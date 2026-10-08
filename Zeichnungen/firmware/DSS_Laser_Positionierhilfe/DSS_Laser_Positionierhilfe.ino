/*
  DSS-Flex Laser-Positionierhilfe – Firmware v2.0 (Heckmodul)
  -----------------------------------------------------------
  Hardware: ESP32 DevKitC (klassischer ESP32-WROOM-32),
            Magnet-Drehgeber AS5600 (I2C 0x36) im vergossenen Sensorkopf am
            Schwingenarm, Magnet Ø6 × 2,5 diametral in der Radwelle,
            Messrad RAD DN70 (Ø70 mm, Umfang ca. 219,9 mm),
            Linienlaser rot + gruen (Klasse 2, <= 1 mW), 2 MOSFET-Schaltmodule.
  Zeichnungen: Zeichnungen/Laser-Heckmodul-DSS-Flex.pdf (LPH-130 Schaltplan).

  Anzeige ueber die Laserlinie im Kamerabild:
    Rot            = Start / ausrichten (Linie auf Anschlussmitte)
    Rot Doppelblitz= genullt (nach 2 s Stillstand)
    Gruen blinkt   = gleich da, langsam fahren
    Gruen          = Ziel erreicht, Schildoeffnung mittig unter dem Anschluss
    Rot blinkt     = zu weit gefahren
    Rot+Gruen blinken abwechselnd = Magnet nicht erkannt (Sensorabstand pruefen)

  Einstellen per Handy: WLAN "DSS-Laser" verbinden, Browser 192.168.4.1
  Board in der Arduino IDE: "ESP32 Dev Module" (Paket "esp32" von Espressif)
*/

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <Wire.h>

// ---------- Pins ----------
const int PIN_SDA   = 21;   // AS5600 SDA (Sensorkabel)
const int PIN_SCL   = 22;   // AS5600 SCL (Sensorkabel)
const int PIN_RED   = 25;   // Signal MOSFET-Modul Laser rot
const int PIN_GREEN = 26;   // Signal MOSFET-Modul Laser gruen

// ---------- WLAN zum Einstellen ----------
const char* AP_SSID = "DSS-Laser";
const char* AP_PASS = "bitte-aendern";  // mind. 8 Zeichen – vor dem Einsatz eigenes Passwort setzen

// ---------- Einstellungen ----------
struct Cfg {
  float    L[5];        // Weg Laserlinie -> Mitte Schildoeffnung je Schalung [mm]
  int      active;      // aktive Schalung 0..4
  float    mmPerCount;  // Kalibrierfaktor Messrad [mm pro Zaehlschritt]
  float    tol;         // +/- Toleranz fuer Dauergruen [mm]
  float    warn;        // Vorwarnung: gruen blinkt ab Ziel minus warn [mm]
  uint32_t stillMs;     // Stillstand bis automatisches Nullen [ms]
  bool     invert;      // Zaehlrichtung umdrehen
} cfg;

Preferences prefs;
WebServer server(80);

// ---------- AS5600: Winkel lesen und Umdrehungen mitzaehlen ----------
// 12 bit pro Radumdrehung (4096 Schritte = ca. 219,9 mm, also ca. 0,054 mm pro Schritt).
// Der Zaehler laeuft ueber den Nulldurchgang weiter (Mehrfachumdrehungen per Software).
const uint8_t AS5600_ADDR = 0x36;
long     encCount = 0;
int      lastRaw  = -1;
bool     magnetOk = false;
uint32_t lastPollUs = 0;

int as5600Read16(uint8_t reg) {
  Wire.beginTransmission(AS5600_ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return -1;
  if (Wire.requestFrom(AS5600_ADDR, (uint8_t)2) != 2) return -1;
  int hi = Wire.read(), lo = Wire.read();
  return ((hi << 8) | lo) & 0x0FFF;
}

bool as5600MagnetOk() {
  Wire.beginTransmission(AS5600_ADDR);
  Wire.write(0x0B);                                     // STATUS: MD bit5, ML bit4, MH bit3
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(AS5600_ADDR, (uint8_t)1) != 1) return false;
  uint8_t st = Wire.read();
  return (st & 0x20) && !(st & 0x18);                   // Magnet erkannt, weder zu schwach noch zu stark
}

// Alle 1 ms abfragen: bei Schalungsfahrt (< 100 mm/s) dreht das Rad weniger als
// eine halbe Umdrehung pro Sekunde, ein Sprung > 2048 ist also immer ein Ueberlauf.
void pollEncoder() {
  uint32_t now = micros();
  if (now - lastPollUs < 1000) return;
  lastPollUs = now;
  int raw = as5600Read16(0x0C);                         // RAW ANGLE
  if (raw < 0) { magnetOk = false; return; }
  if (lastRaw >= 0) {
    int d = raw - lastRaw;
    if (d > 2048)  d -= 4096;
    if (d < -2048) d += 4096;
    encCount += d;
  }
  lastRaw = raw;
}

long readCount() { return encCount; }

// ---------- Zustand ----------
long     zeroCount     = 0;
long     lastMoveCount = 0;
uint32_t lastMoveMs    = 0;
bool     stillHandled  = false;
bool     flashActive   = false;
uint32_t flashStart    = 0;
long     calBase       = 0;
bool     calRunning    = false;

enum State { ST_RED = 0, ST_WARN = 1, ST_TARGET = 2, ST_OVER = 3 };

float clampf(float v, float lo, float hi) { return v < lo ? lo : (v > hi ? hi : v); }

float travelMm() {
  float d = (readCount() - zeroCount) * cfg.mmPerCount;
  return cfg.invert ? -d : d;
}

void doZero() {
  zeroCount   = readCount();
  flashActive = true;
  flashStart  = millis();
}

int currentState(float d) {   // liefert einen State-Wert
  float T = cfg.L[cfg.active];
  if (d > T + cfg.tol)  return ST_OVER;
  if (d >= T - cfg.tol) return ST_TARGET;
  if (d >= T - cfg.warn) return ST_WARN;
  return ST_RED;
}

// Nach Stillstand automatisch nullen – aber nur deutlich vor dem Zielbereich,
// damit ein kurzer Halt beim Ueberfahren/Korrigieren nicht neu nullt.
void updateStillstand() {
  long c = readCount();
  uint32_t now = millis();
  if (fabsf((c - lastMoveCount) * cfg.mmPerCount) > 0.5f) {
    lastMoveCount = c;
    lastMoveMs    = now;
    stillHandled  = false;
    return;
  }
  if (!stillHandled && now - lastMoveMs >= cfg.stillMs) {
    stillHandled = true;
    if (travelMm() < cfg.L[cfg.active] - 30.0f) doZero();
  }
}

void setLasers(bool red, bool green) {
  digitalWrite(PIN_RED,   red   ? HIGH : LOW);
  digitalWrite(PIN_GREEN, green ? HIGH : LOW);
}

void updateLasers() {
  uint32_t now = millis();
  if (!magnetOk) {                         // Sensorfehler: rot/gruen im Wechsel
    bool a = (now / 250) % 2 == 0;
    setLasers(a, !a);
    return;
  }
  if (flashActive) {                       // Doppelblitz rot = genullt
    uint32_t t = now - flashStart;
    if (t < 600) {
      bool on = (t >= 100 && t < 200) || (t >= 300);
      setLasers(on, false);
      return;
    }
    flashActive = false;
  }
  switch (currentState(travelMm())) {
    case ST_RED:    setLasers(true, false);                     break;
    case ST_WARN:   setLasers(false, (now / 125) % 2 == 0);     break;
    case ST_TARGET: setLasers(false, true);                     break;
    case ST_OVER:   setLasers((now / 80) % 2 == 0, false);      break;
  }
}

// ---------- Speichern / Laden ----------
void loadCfg() {
  prefs.begin("laser", false);
  for (int i = 0; i < 5; i++) {
    char k[3] = {'L', char('0' + i), 0};
    cfg.L[i] = prefs.getFloat(k, 265.0f);   // Startwert, je Schalung messen
  }
  cfg.active     = prefs.getInt("act", 0);
  cfg.mmPerCount = prefs.getFloat("mpc", 219.91f / 4096.0f);  // Ø70 mm Rad, 12 bit
  cfg.tol        = prefs.getFloat("tol", 3.0f);
  cfg.warn       = prefs.getFloat("warn", 15.0f);
  cfg.stillMs    = prefs.getUInt("still", 2000);
  cfg.invert     = prefs.getBool("inv", false);
  prefs.end();
  if (cfg.active < 0 || cfg.active > 4) cfg.active = 0;
}

void saveCfg() {
  prefs.begin("laser", false);
  for (int i = 0; i < 5; i++) {
    char k[3] = {'L', char('0' + i), 0};
    prefs.putFloat(k, cfg.L[i]);
  }
  prefs.putInt("act", cfg.active);
  prefs.putFloat("mpc", cfg.mmPerCount);
  prefs.putFloat("tol", cfg.tol);
  prefs.putFloat("warn", cfg.warn);
  prefs.putUInt("still", cfg.stillMs);
  prefs.putBool("inv", cfg.invert);
  prefs.end();
}

// ---------- Handy-Seite ----------
const char PAGE[] PROGMEM = R"rawliteral(<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>DSS-Laser</title>
<style>body{font-family:sans-serif;margin:16px;max-width:520px}h1{font-size:20px}
.big{font-size:44px;font-weight:bold}#st{padding:6px 10px;border-radius:6px;display:inline-block;color:#fff}
label{display:block;margin:10px 0 4px}input,select{font-size:16px;padding:6px;width:100%;box-sizing:border-box}
button{font-size:16px;padding:10px 14px;margin:8px 6px 0 0}fieldset{margin-top:16px;border:1px solid #ccc;border-radius:8px}</style></head><body>
<h1>DSS-Flex Laser</h1>
<div class="big" id="d">-</div><div id="st">-</div>
<p><button onclick="go('/zero')">Jetzt nullen</button></p>
<fieldset><legend>Schalung und Anzeige</legend>
<label for="act">Aktive Schalung</label><select id="act"></select>
<div id="Ls"></div>
<label for="tol">Toleranz Dauergruen &plusmn; mm</label><input id="tol" type="number" step="0.5">
<label for="warn">Gruen blinkt ab Ziel minus mm</label><input id="warn" type="number" step="1">
<label for="still">Stillstand bis Nullen (ms)</label><input id="still" type="number" step="100">
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
const N=["DN 300","DN 350-400","DN 450-500","DN 550-600","DN 650-700"];
const S=["Rot: ausrichten / zurueckfahren","Gruen blinkt: gleich da","Gruen: Ziel erreicht","Rot blinkt: zu weit"];
const C=["#c0392b","#9a7d0a","#1e8449","#c0392b"];
let init=false;
function go(u){fetch(u).then(r=>r.text()).then(t=>{if(t!=='ok')alert(t)})}
function save(){let q='act='+$('act').value+'&tol='+$('tol').value+'&warn='+$('warn').value+'&still='+$('still').value+'&inv='+($('inv').checked?1:0);
for(let i=0;i<5;i++)q+='&L'+i+'='+$('L'+i).value;go('/save?'+q)}
function tick(){fetch('/state').then(r=>r.json()).then(j=>{
$('d').textContent=j.d.toFixed(1)+' mm';$('st').textContent=S[j.st]+' (Ziel '+j.L.toFixed(1)+' mm)';$('st').style.background=C[j.st];
$('mpc').textContent='Faktor: '+j.mpc.toFixed(5)+' mm pro Schritt'+(j.mag?'':' – MAGNET NICHT ERKANNT');
if(!init){init=true;$('act').innerHTML=N.map((n,i)=>'<option value="'+i+'">'+n+'</option>').join('');$('act').value=j.act;
$('Ls').innerHTML=N.map((n,i)=>'<label for="L'+i+'">Weg '+n+' (mm)</label><input id="L'+i+'" type="number" step="0.5" value="'+j.Ls[i]+'">').join('');
$('tol').value=j.tol;$('warn').value=j.warn;$('still').value=j.still;$('inv').checked=!!j.inv;}
}).catch(()=>{})}
setInterval(tick,300);tick();
</script></body></html>)rawliteral";

void handleState() {
  float d = travelMm();
  char buf[320];
  snprintf(buf, sizeof(buf),
    "{\"d\":%.1f,\"st\":%d,\"L\":%.1f,\"act\":%d,\"mpc\":%.6f,\"tol\":%.1f,\"warn\":%.1f,"
    "\"still\":%lu,\"inv\":%d,\"mag\":%d,\"Ls\":[%.1f,%.1f,%.1f,%.1f,%.1f]}",
    d, (int)currentState(d), cfg.L[cfg.active], cfg.active, cfg.mmPerCount, cfg.tol, cfg.warn,
    (unsigned long)cfg.stillMs, cfg.invert ? 1 : 0, magnetOk ? 1 : 0,
    cfg.L[0], cfg.L[1], cfg.L[2], cfg.L[3], cfg.L[4]);
  server.send(200, "application/json", buf);
}

void handleSave() {
  if (server.hasArg("act")) {
    int a = server.arg("act").toInt();
    cfg.active = a < 0 ? 0 : (a > 4 ? 4 : a);
  }
  for (int i = 0; i < 5; i++) {
    String k = "L" + String(i);
    if (server.hasArg(k)) cfg.L[i] = clampf(server.arg(k).toFloat(), 10.0f, 1000.0f);
  }
  if (server.hasArg("tol"))   cfg.tol     = clampf(server.arg("tol").toFloat(), 0.5f, 20.0f);
  if (server.hasArg("warn"))  cfg.warn    = clampf(server.arg("warn").toFloat(), 2.0f, 100.0f);
  if (server.hasArg("still")) cfg.stillMs = (uint32_t)clampf(server.arg("still").toFloat(), 500.0f, 10000.0f);
  if (server.hasArg("inv"))   cfg.invert  = server.arg("inv") == "1";
  saveCfg();
  server.send(200, "text/plain", "ok");
}

void handleCal() {
  if (server.hasArg("start")) {
    calBase = readCount();
    calRunning = true;
    server.send(200, "text/plain", "ok");
    return;
  }
  if (server.hasArg("mm")) {
    long n = labs(readCount() - calBase);
    float mm = server.arg("mm").toFloat();
    if (!calRunning || n < 100 || mm < 100.0f) {
      server.send(200, "text/plain", "Erst Start druecken und mindestens 100 mm schieben.");
      return;
    }
    cfg.mmPerCount = mm / (float)n;
    calRunning = false;
    saveCfg();
    server.send(200, "text/plain", "ok");
    return;
  }
  server.send(400, "text/plain", "Parameter fehlt");
}

void setup() {
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  Wire.begin(PIN_SDA, PIN_SCL, 400000);

  loadCfg();

  // Selbsttest: erst rot, dann gruen
  setLasers(true, false);  delay(400);
  setLasers(false, true);  delay(400);
  setLasers(false, false);

  magnetOk = as5600MagnetOk();
  lastRaw = as5600Read16(0x0C);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS);

  server.on("/", []() { server.send(200, "text/html", PAGE); });
  server.on("/state", handleState);
  server.on("/save", handleSave);
  server.on("/cal", handleCal);
  server.on("/zero", []() { doZero(); server.send(200, "text/plain", "ok"); });
  server.begin();

  lastMoveCount = readCount();
  lastMoveMs = millis();
}

uint32_t lastStatusMs = 0;

void loop() {
  pollEncoder();
  if (millis() - lastStatusMs > 500) { lastStatusMs = millis(); magnetOk = as5600MagnetOk(); }
  server.handleClient();
  updateStillstand();
  updateLasers();
  delay(1);
}
