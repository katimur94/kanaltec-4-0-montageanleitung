/*
  DSS-Flex Laser-Positionierhilfe v3 – Laserkopf (auf dem Zentralrohr, vergossen)
  -------------------------------------------------------------------------------
  Hardware: ESP32-C3 SuperMini, RS-485-Transceiver (3,3 V, z. B. MAX3485/SP3485),
            Schaltregler 24 V -> 5 V (Eingang 7–36 V), 2 Logic-Level-MOSFET,
            Linienlaser rot 650 nm und gruen 520 nm (je <= 1 mW, Klasse 2, 5 V),
            ueber das Spiralkabel: Magnet-Drehgeber AS5600 (I2C 0x36) im
            vergossenen Sensorkopf am Messrad (Magnet in der Radwelle).
  Kabel zum Fahrzeug (4 freie Adern im Roboterkabel ueber die Kabelbombe):
            1 = +24 V   2 = 0 V   3 = RS-485 A   4 = RS-485 B
  Spiralkabel zum Messrad (4 Adern): 3,3 V, 0 V, SDA, SCL

  Der Laserkopf rechnet nichts aus. Er zaehlt die Radumdrehungen, schaltet die
  Laser so, wie der Bedienkasten es sagt, und meldet den Zaehlerstand zurueck.
  Protokoll (19200 Bd, 8N1, Halbduplex):
    Bedienkasten -> Kopf:  "L<rot><gruen>\n"   z. B. "L10\n" = rot an, gruen aus
    Kopf -> Bedienkasten:  "C<zaehler>,<magnet>\n"   magnet 1 = in Ordnung
  Ohne Befehl fuer 500 ms gehen beide Laser aus (Kabel getrennt = dunkel).

  Board in der Arduino IDE: "ESP32C3 Dev Module", USB CDC On Boot: Enabled.
*/

#include <Wire.h>

const int PIN_SDA   = 6;    // Spiralkabel zum Sensorkopf
const int PIN_SCL   = 7;
const int PIN_RX    = 20;   // RS-485 RO
const int PIN_TX    = 21;   // RS-485 DI
const int PIN_DE    = 10;   // RS-485 DE und /RE zusammen
const int PIN_RED   = 3;    // MOSFET Laser rot
const int PIN_GREEN = 4;    // MOSFET Laser gruen

const uint8_t AS5600_ADDR = 0x36;
long     count    = 0;
int      lastRaw  = -1;
bool     magnetOk = false;
uint32_t lastPollUs = 0, lastCmdMs = 0, lastStatusMs = 0;
char     buf[24];
uint8_t  len = 0;

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
  Wire.write(0x0B);                                   // STATUS: MD bit5, ML bit4, MH bit3
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(AS5600_ADDR, (uint8_t)1) != 1) return false;
  uint8_t st = Wire.read();
  return (st & 0x20) && !(st & 0x18);
}

// 12 bit pro Radumdrehung. Bei Schalungsfahrt dreht das Rad deutlich unter einer
// halben Umdrehung pro Millisekunde-Abfrage; ein Sprung > 2048 ist ein Ueberlauf.
void pollEncoder() {
  uint32_t now = micros();
  if (now - lastPollUs < 1000) return;
  lastPollUs = now;
  int raw = as5600Read16(0x0C);                       // RAW ANGLE
  if (raw < 0) { magnetOk = false; return; }
  if (lastRaw >= 0) {
    int d = raw - lastRaw;
    if (d > 2048)  d -= 4096;
    if (d < -2048) d += 4096;
    count += d;
  }
  lastRaw = raw;
}

void setLasers(bool red, bool green) {
  digitalWrite(PIN_RED, red ? HIGH : LOW);
  digitalWrite(PIN_GREEN, green ? HIGH : LOW);
}

void reply() {
  char out[32];
  int n = snprintf(out, sizeof(out), "C%ld,%d\n", count, magnetOk ? 1 : 0);
  digitalWrite(PIN_DE, HIGH);
  delayMicroseconds(50);
  Serial1.write((const uint8_t*)out, n);
  Serial1.flush();                                    // warten, bis alles raus ist
  digitalWrite(PIN_DE, LOW);
}

void handleLine() {
  buf[len] = 0;
  if (len >= 3 && buf[0] == 'L') {
    setLasers(buf[1] == '1', buf[2] == '1');
    lastCmdMs = millis();
    reply();
  }
  len = 0;
}

void setup() {
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_DE, OUTPUT);
  digitalWrite(PIN_DE, LOW);
  setLasers(false, false);
  Wire.begin(PIN_SDA, PIN_SCL, 100000);               // Spiralkabel bis ca. 0,5 m: 100 kHz
  Serial1.begin(19200, SERIAL_8N1, PIN_RX, PIN_TX);
  magnetOk = as5600MagnetOk();
  lastRaw = as5600Read16(0x0C);
}

void loop() {
  pollEncoder();
  while (Serial1.available()) {
    char c = Serial1.read();
    if (c == '\n') handleLine();
    else if (len < sizeof(buf) - 1) buf[len++] = c;
    else len = 0;
  }
  uint32_t now = millis();
  if (now - lastStatusMs > 500) { lastStatusMs = now; magnetOk = as5600MagnetOk(); }
  if (now - lastCmdMs > 500) setLasers(false, false);
}
