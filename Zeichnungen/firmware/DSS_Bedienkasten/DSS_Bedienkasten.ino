/*
  DSS-Flex Laser-Positionierhilfe v3 – Bedienkasten im Fahrzeug
  --------------------------------------------------------------
  Hardware: ESP32 DevKitC (ESP32-WROOM-32), RS-485-Modul (3,3 V, MAX3485),
            4-stellige 7-Segment-Anzeige mit TM1637, 2 Taster (NULL, WAHL),
            LED rot + gruen, Summer, Schaltregler 12/24 V -> 5 V.
  Speist ueber Ader 1/2 den Laserkopf mit der Fahrzeugspannung (12–24 V,
  mit Sicherung 1 A) und spricht ueber Ader 3/4 (RS-485) mit ihm.

  Bedienung am Pult neben den Roboter-Bedienelementen:
    WAHL kurz  = naechste Schalung (d1…d5 = DN 300 … DN 650–700, o = offen, A = Abschluss)
    NULL kurz  = rote Linie steht auf der Anschlussmitte -> nullen (Doppelblitz)
    NULL 3 s   = Nullung aufheben (Anzeige "----")
  Anzeige: Restweg in mm bis zur Mitte der Schildoeffnung. 0 = Ziel, negativ = zu weit.
    Rot            = Start / zurueckfahren
    Rot Doppelblitz= genullt
    Gruen blinkt   = gleich da (ab Ziel − 15 mm), langsam
    Gruen          = Ziel (± 3 mm), Summer kurz
    Rot blinkt     = zu weit, wieder vor
    "Err" / rot-gruen im Wechsel = keine Verbindung zum Laserkopf
    "nAG"          = Magnet am Messrad nicht erkannt (Sensorabstand pruefen)

  Einstellen per Handy: WLAN "DSS-Laser" (Passwort unten aendern), Browser 192.168.4.1.
  Board in der Arduino IDE: "ESP32 Dev Module" (Paket "esp32" von Espressif, 3.0.7).
*/

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>

struct Btn { int pin; bool down; uint32_t since; bool longDone; };   // Taster mit Entprellung

// ---------- Pins ----------
const int PIN_RX    = 16;   // RS-485 RO
const int PIN_TX    = 17;   // RS-485 DI
const int PIN_DE    = 4;    // RS-485 DE und /RE
const int PIN_CLK   = 18;   // TM1637 CLK
const int PIN_DIO   = 19;   // TM1637 DIO
const int PIN_NULL  = 32;   // Taster NULL gegen GND
const int PIN_WAHL  = 33;   // Taster WAHL gegen GND
const int PIN_LED_R = 25;
const int PIN_LED_G = 26;
const int PIN_BUZ   = 27;

const char* AP_SSID = "DSS-Laser";
const char* AP_PASS = "bitte-aendern";   // mind. 8 Zeichen – vor dem Einsatz eigenes Passwort setzen

// ---------- Einstellungen ----------
// 10 Profile: Index = dn*2 + art, dn 0..4 (DN 300 … DN 650–700), art 0 = offen, 1 = Abschluss
const int NPROF = 10;
struct Cfg {
  float    L[NPROF];     // Weg Laserlinie -> Mitte Schildoeffnung [mm], je Schalung messen
  int      active;
  float    mmPerCount;   // Kalibrierfaktor Messrad [mm pro Schritt]
  float    tol, warn;
  bool     invert;
} cfg;
Preferences prefs;
WebServer server(80);

// ---------- TM1637 ohne Bibliothek ----------
void tmDelay() { delayMicroseconds(5); }
void tmStart() { pinMode(PIN_DIO, OUTPUT); digitalWrite(PIN_DIO, HIGH); digitalWrite(PIN_CLK, HIGH); tmDelay(); digitalWrite(PIN_DIO, LOW); tmDelay(); }
void tmStop()  { pinMode(PIN_DIO, OUTPUT); digitalWrite(PIN_CLK, LOW); digitalWrite(PIN_DIO, LOW); tmDelay(); digitalWrite(PIN_CLK, HIGH); tmDelay(); digitalWrite(PIN_DIO, HIGH); tmDelay(); }
void tmWrite(uint8_t b) {
  for (int i = 0; i < 8; i++) {
    digitalWrite(PIN_CLK, LOW); tmDelay();
    digitalWrite(PIN_DIO, (b >> i) & 1); tmDelay();
    digitalWrite(PIN_CLK, HIGH); tmDelay();
  }
  digitalWrite(PIN_CLK, LOW); pinMode(PIN_DIO, INPUT_PULLUP); tmDelay();
  digitalWrite(PIN_CLK, HIGH); tmDelay(); digitalWrite(PIN_CLK, LOW); pinMode(PIN_DIO, OUTPUT);
}
uint8_t seg(char c) {
  switch (c) {
    case '0': return 0x3F; case '1': return 0x06; case '2': return 0x5B; case '3': return 0x4F; case '4': return 0x66;
    case '5': return 0x6D; case '6': return 0x7D; case '7': return 0x07; case '8': return 0x7F; case '9': return 0x6F;
    case '-': return 0x40; case 'A': return 0x77; case 'd': return 0x5E; case 'o': return 0x5C; case 'n': return 0x54;
    case 'E': return 0x79; case 'r': return 0x50; case 'G': return 0x3D; case 'L': return 0x38; case 'U': return 0x3E;
    case 'P': return 0x73; case 'C': return 0x39; case 'b': return 0x7C; default: return 0x00;
  }
}
String lastShown;
void show(const char* s) {                 // genau 4 Zeichen, rechtsbuendig auffuellen
  char t[5] = "    ";
  int n = strlen(s); if (n > 4) n = 4;
  for (int i = 0; i < n; i++) t[4 - n + i] = s[i];
  if (lastShown == t) return;
  lastShown = t;
  tmStart(); tmWrite(0x40); tmStop();
  tmStart(); tmWrite(0xC0); for (int i = 0; i < 4; i++) tmWrite(seg(t[i])); tmStop();
  tmStart(); tmWrite(0x8F); tmStop();
}

// ---------- RS-485 zum Laserkopf ----------
long     headCount = 0;
bool     headMagnet = false;
uint32_t lastReplyMs = 0, lastPollMs = 0;
char     rbuf[32];
uint8_t  rlen = 0;

void sendLasers(bool red, bool green) {
  char out[6] = {'L', red ? '1' : '0', green ? '1' : '0', '\n', 0};
  digitalWrite(PIN_DE, HIGH);
  delayMicroseconds(50);
  Serial2.write((const uint8_t*)out, 4);
  Serial2.flush();
  digitalWrite(PIN_DE, LOW);
}
void readHead() {
  while (Serial2.available()) {
    char c = Serial2.read();
    if (c == '\n') {
      rbuf[rlen] = 0;
      long cnt; int mag;
      if (rlen > 2 && rbuf[0] == 'C' && sscanf(rbuf + 1, "%ld,%d", &cnt, &mag) == 2) { headCount = cnt; headMagnet = mag == 1; lastReplyMs = millis(); }
      rlen = 0;
    } else if (rlen < sizeof(rbuf) - 1) rbuf[rlen++] = c; else rlen = 0;
  }
}
bool linkOk() { return millis() - lastReplyMs < 500; }

// ---------- Zustand ----------
enum { ST_START = 0, ST_RED = 1, ST_WARN = 2, ST_TARGET = 3, ST_OVER = 4 };
bool     zeroed = false;
long     zeroCount = 0;
bool     flashActive = false;
uint32_t flashStart = 0, profileShownUntil = 0;
bool     beeped = false;
long     calBase = 0;
bool     calRunning = false;

float travelMm() { float d = (headCount - zeroCount) * cfg.mmPerCount; return cfg.invert ? -d : d; }
int currentState(float d) {
  if (!zeroed) return ST_START;
  float T = cfg.L[cfg.active];
  if (d > T + cfg.tol)   return ST_OVER;
  if (d >= T - cfg.tol)  return ST_TARGET;
  if (d >= T - cfg.warn) return ST_WARN;
  return ST_RED;
}
void doZero() { zeroCount = headCount; zeroed = true; flashActive = true; flashStart = millis(); beeped = false; }

void profileText(int p, char* out) { out[0] = 'd'; out[1] = '1' + p / 2; out[2] = '-'; out[3] = (p % 2) ? 'A' : 'o'; out[4] = 0; }

// ---------- Taster ----------
Btn bNull = {PIN_NULL, false, 0, false}, bWahl = {PIN_WAHL, false, 0, false};
// Rueckgabe: 1 = kurz, 2 = lang (3 s)
int pollBtn(Btn& b) {
  bool d = digitalRead(b.pin) == LOW; uint32_t now = millis();
  if (d && !b.down) { b.down = true; b.since = now; b.longDone = false; return 0; }
  if (d && b.down && !b.longDone && now - b.since > 3000) { b.longDone = true; return 2; }
  if (!d && b.down) { b.down = false; if (!b.longDone && now - b.since > 40) return 1; }
  return 0;
}

// ---------- Ausgabe ----------
void outputs() {
  uint32_t now = millis();
  bool red = false, green = false;
  if (!linkOk()) {
    bool a = (now / 250) % 2 == 0;
    digitalWrite(PIN_LED_R, a); digitalWrite(PIN_LED_G, !a); show("Err"); sendLasers(false, false); return;
  }
  if (!headMagnet) {
    bool a = (now / 250) % 2 == 0; red = a; green = !a; show("nAG");
  } else if (flashActive && now - flashStart < 600) {
    uint32_t t = now - flashStart; red = (t >= 100 && t < 200) || t >= 300; show("0");
  } else {
    flashActive = false;
    float d = travelMm(); int st = currentState(d);
    switch (st) {
      case ST_START:  red = true; break;
      case ST_RED:    red = true; break;
      case ST_WARN:   green = (now / 125) % 2 == 0; break;
      case ST_TARGET: green = true; if (!beeped) { beeped = true; digitalWrite(PIN_BUZ, HIGH); delay(120); digitalWrite(PIN_BUZ, LOW); } break;
      case ST_OVER:   red = (now / 80) % 2 == 0; break;
    }
    if (now < profileShownUntil) { char p[5]; profileText(cfg.active, p); show(p); }
    else if (st == ST_START) show("----");
    else { char s[8]; long rest = lroundf(cfg.L[cfg.active] - d); if (rest > 9999) rest = 9999; if (rest < -999) rest = -999; snprintf(s, sizeof(s), "%ld", rest); show(s); }
  }
  digitalWrite(PIN_LED_R, red); digitalWrite(PIN_LED_G, green);
  sendLasers(red, green);
}

// ---------- Speichern / Laden ----------
void loadCfg() {
  prefs.begin("laser", false);
  for (int i = 0; i < NPROF; i++) { char k[4]; snprintf(k, sizeof(k), "L%d", i); cfg.L[i] = prefs.getFloat(k, (i % 2) ? 199.0f : 265.0f); }
  cfg.active     = prefs.getInt("act", 2);
  cfg.mmPerCount = prefs.getFloat("mpc", 219.91f / 4096.0f);   // RAD DN70, 12 bit
  cfg.tol        = prefs.getFloat("tol", 3.0f);
  cfg.warn       = prefs.getFloat("warn", 15.0f);
  cfg.invert     = prefs.getBool("inv", false);
  prefs.end();
  if (cfg.active < 0 || cfg.active >= NPROF) cfg.active = 0;
}
void saveCfg() {
  prefs.begin("laser", false);
  for (int i = 0; i < NPROF; i++) { char k[4]; snprintf(k, sizeof(k), "L%d", i); prefs.putFloat(k, cfg.L[i]); }
  prefs.putInt("act", cfg.active); prefs.putFloat("mpc", cfg.mmPerCount); prefs.putFloat("tol", cfg.tol);
  prefs.putFloat("warn", cfg.warn); prefs.putBool("inv", cfg.invert);
  prefs.end();
}

// ---------- Handy-Seite ----------
const char PAGE[] PROGMEM = R"rawliteral(<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>DSS-Laser</title>
<style>body{font-family:sans-serif;margin:16px;max-width:560px}h1{font-size:20px}
.big{font-size:44px;font-weight:bold}#st{padding:6px 10px;border-radius:6px;display:inline-block;color:#fff}
label{display:block;margin:8px 0 3px}input,select{font-size:16px;padding:6px;width:100%;box-sizing:border-box}
button{font-size:16px;padding:10px 14px;margin:8px 6px 0 0}fieldset{margin-top:16px;border:1px solid #ccc;border-radius:8px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}</style></head><body>
<h1>DSS-Flex Laser · Bedienkasten</h1>
<div class="big" id="d">-</div><div id="st">-</div>
<p><button onclick="go('/zero')">NULL</button><button onclick="go('/unzero')">Nullung aufheben</button></p>
<fieldset><legend>Schalung und Anzeige</legend>
<label for="act">Aktive Schalung</label><select id="act"></select>
<div class="grid" id="Ls"></div>
<label for="tol">Toleranz Dauergruen &plusmn; mm</label><input id="tol" type="number" step="0.5">
<label for="warn">Gruen blinkt ab Ziel minus mm</label><input id="warn" type="number" step="1">
<label><input id="inv" type="checkbox" style="width:auto"> Zaehlrichtung umdrehen</label>
<button onclick="save()">Speichern</button></fieldset>
<fieldset><legend>Messrad kalibrieren</legend>
<p>1. Start druecken. 2. Schalung auf ebenem Boden eine gemessene Strecke schieben (z. B. 1000 mm). 3. Strecke eintragen und uebernehmen.</p>
<button onclick="go('/cal?start=1')">Start</button>
<label for="calmm">Gefahrene Strecke mm</label><input id="calmm" type="number" value="1000">
<button onclick="go('/cal?mm='+$('calmm').value)">Uebernehmen</button>
<p id="mpc"></p></fieldset>
<script>
const $=i=>document.getElementById(i);
const D=["DN 300","DN 350-400","DN 450-500","DN 550-600","DN 650-700"],N=[];D.forEach(d=>{N.push(d+" offen");N.push(d+" Abschluss")});
const S=["Rot: Linie auf Anschlussmitte, NULL","Rot: zurueckfahren","Gruen blinkt: gleich da","Gruen: Ziel erreicht","Rot blinkt: zu weit"];
const C=["#c0392b","#c0392b","#9a7d0a","#1e8449","#c0392b"];
let init=false;
function go(u){fetch(u).then(r=>r.text()).then(t=>{if(t!=='ok')alert(t)})}
function save(){let q='act='+$('act').value+'&tol='+$('tol').value+'&warn='+$('warn').value+'&inv='+($('inv').checked?1:0);
for(let i=0;i<N.length;i++)q+='&L'+i+'='+$('L'+i).value;go('/save?'+q)}
function tick(){fetch('/state').then(r=>r.json()).then(j=>{
$('d').textContent=j.link?(j.z?j.rest.toFixed(0)+' mm':'----'):'keine Verbindung';$('st').textContent=(j.mag?S[j.st]:'Magnet nicht erkannt')+' · Ziel '+j.L.toFixed(1)+' mm';$('st').style.background=C[j.st];
$('mpc').textContent='Faktor: '+j.mpc.toFixed(5)+' mm pro Schritt';
if(!init){init=true;$('act').innerHTML=N.map((n,i)=>'<option value="'+i+'">'+n+'</option>').join('');$('act').value=j.act;
$('Ls').innerHTML=N.map((n,i)=>'<div><label for="L'+i+'">'+n+' (mm)</label><input id="L'+i+'" type="number" step="0.5" value="'+j.Ls[i]+'"></div>').join('');
$('tol').value=j.tol;$('warn').value=j.warn;$('inv').checked=!!j.inv;}
}).catch(()=>{})}
setInterval(tick,300);tick();
</script></body></html>)rawliteral";

void handleState() {
  float d = travelMm(); int st = currentState(d);
  String s = "{\"rest\":" + String(cfg.L[cfg.active] - d, 1) + ",\"z\":" + (zeroed ? "1" : "0") + ",\"st\":" + st +
             ",\"L\":" + String(cfg.L[cfg.active], 1) + ",\"act\":" + cfg.active + ",\"mpc\":" + String(cfg.mmPerCount, 6) +
             ",\"tol\":" + String(cfg.tol, 1) + ",\"warn\":" + String(cfg.warn, 1) + ",\"inv\":" + (cfg.invert ? "1" : "0") +
             ",\"mag\":" + (headMagnet ? "1" : "0") + ",\"link\":" + (linkOk() ? "1" : "0") + ",\"Ls\":[";
  for (int i = 0; i < NPROF; i++) { s += String(cfg.L[i], 1); if (i < NPROF - 1) s += ","; }
  s += "]}";
  server.send(200, "application/json", s);
}
float clampf(float v, float lo, float hi) { return v < lo ? lo : (v > hi ? hi : v); }
void handleSave() {
  if (server.hasArg("act")) { int a = server.arg("act").toInt(); cfg.active = a < 0 ? 0 : (a >= NPROF ? NPROF - 1 : a); }
  for (int i = 0; i < NPROF; i++) { String k = "L" + String(i); if (server.hasArg(k)) cfg.L[i] = clampf(server.arg(k).toFloat(), 10.0f, 1500.0f); }
  if (server.hasArg("tol"))  cfg.tol  = clampf(server.arg("tol").toFloat(), 0.5f, 20.0f);
  if (server.hasArg("warn")) cfg.warn = clampf(server.arg("warn").toFloat(), 2.0f, 100.0f);
  if (server.hasArg("inv"))  cfg.invert = server.arg("inv") == "1";
  saveCfg(); server.send(200, "text/plain", "ok");
}
void handleCal() {
  if (server.hasArg("start")) { calBase = headCount; calRunning = true; server.send(200, "text/plain", "ok"); return; }
  if (server.hasArg("mm")) {
    long n = labs(headCount - calBase); float mm = server.arg("mm").toFloat();
    if (!calRunning || n < 1000 || mm < 100.0f) { server.send(200, "text/plain", "Erst Start druecken und mindestens 100 mm schieben."); return; }
    cfg.mmPerCount = mm / (float)n; calRunning = false; saveCfg(); server.send(200, "text/plain", "ok"); return;
  }
  server.send(400, "text/plain", "Parameter fehlt");
}

void setup() {
  pinMode(PIN_CLK, OUTPUT); pinMode(PIN_DIO, OUTPUT);
  pinMode(PIN_LED_R, OUTPUT); pinMode(PIN_LED_G, OUTPUT); pinMode(PIN_BUZ, OUTPUT);
  pinMode(PIN_NULL, INPUT_PULLUP); pinMode(PIN_WAHL, INPUT_PULLUP);
  pinMode(PIN_DE, OUTPUT); digitalWrite(PIN_DE, LOW);
  Serial2.begin(19200, SERIAL_8N1, PIN_RX, PIN_TX);
  loadCfg();
  show("8888"); digitalWrite(PIN_LED_R, HIGH); delay(400); digitalWrite(PIN_LED_R, LOW); digitalWrite(PIN_LED_G, HIGH); delay(400); digitalWrite(PIN_LED_G, LOW);
  profileShownUntil = millis() + 1500;
  WiFi.mode(WIFI_AP); WiFi.softAP(AP_SSID, AP_PASS);
  server.on("/", []() { server.send(200, "text/html", PAGE); });
  server.on("/state", handleState); server.on("/save", handleSave); server.on("/cal", handleCal);
  server.on("/zero", []() { doZero(); server.send(200, "text/plain", "ok"); });
  server.on("/unzero", []() { zeroed = false; server.send(200, "text/plain", "ok"); });
  server.begin();
}

void loop() {
  server.handleClient();
  readHead();
  int n = pollBtn(bNull), w = pollBtn(bWahl);
  if (n == 1 && linkOk() && headMagnet) doZero();
  if (n == 2) zeroed = false;
  if (w == 1) { cfg.active = (cfg.active + 1) % NPROF; saveCfg(); profileShownUntil = millis() + 1500; zeroed = false; }
  if (millis() - lastPollMs >= 40) { lastPollMs = millis(); outputs(); }   // 25 Abfragen pro Sekunde
}
