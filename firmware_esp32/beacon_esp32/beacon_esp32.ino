#include <NimBLEDevice.h>

// Simulações
float simulatedTemperature = 25.0;
float setpointTemperature = 30.0;

// BLE Globals
NimBLECharacteristic* tempCharacteristic;
NimBLECharacteristic* setpointCharacteristic;
NimBLEAdvertising* pAdvertising;

// ============================
// Callbacks do Servidor BLE
// ============================
class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
    Serial.println(">> Dispositivo conectado!");
  }

  void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
    Serial.printf("Client disconnected - start advertising\n");
    NimBLEDevice::startAdvertising();
  }

};

// ============================
// Callback para Setpoint
// ============================
class SetpointCallbacks : public NimBLECharacteristicCallbacks {

  void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override {
    std::string value = pCharacteristic->getValue();

    if (value.length() > 0) {
      float newSetpoint = atof(value.c_str());
      setpointTemperature = newSetpoint;

      Serial.print(">> Novo Setpoint recebido via BLE: ");
      Serial.println(setpointTemperature);

      // Atualiza a característica para refletir o novo valor
      char setStr[8];
      dtostrf(setpointTemperature, 4, 1, setStr);
      pCharacteristic->setValue((uint8_t*)setStr, strlen(setStr));
    }
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Digite a nova temperatura no terminal e pressione Enter.");

  NimBLEDevice::init("ESP32_TEMP");
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);

  NimBLEServer* pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  NimBLEService* tempService = pServer->createService("1809");

  // === Característica Temperatura (READ + NOTIFY) ===
  tempCharacteristic = tempService->createCharacteristic(
    "2A1C",
    NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);

  char tempStr[8];
  dtostrf(simulatedTemperature, 4, 1, tempStr);
  tempCharacteristic->setValue((uint8_t*)tempStr, strlen(tempStr));

  // === Característica Setpoint (READ + WRITE + NOTIFY) ===
  setpointCharacteristic = tempService->createCharacteristic(
    "2A1E",
    NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::NOTIFY);

  char setStr[8];
  dtostrf(setpointTemperature, 4, 1, setStr);
  setpointCharacteristic->setValue((uint8_t*)setStr, strlen(setStr));

  setpointCharacteristic->setCallbacks(new SetpointCallbacks());

  tempService->start();

  // === Advertising ===
  pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID("1809");
  pAdvertising->setAppearance(0x0340);
  pAdvertising->start();

  Serial.println("BLE GATT iniciado.");
}

void loop() {
  // Leitura manual via Serial para simular temperatura
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    float newTemp = input.toFloat();
    if (input.length() > 0) {
      simulatedTemperature = newTemp;
      Serial.print(">> Nova temperatura simulada: ");
      Serial.println(simulatedTemperature);

      char tempStr[8];
      dtostrf(simulatedTemperature, 4, 1, tempStr);
      tempCharacteristic->setValue((uint8_t*)tempStr, strlen(tempStr));
      tempCharacteristic->notify();
    }
  }

  // Atualiza periodicamente temperatura e setpoint (broadcast)
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 5000) {
    lastUpdate = millis();

    Serial.print(">> Temp Atual: ");
    Serial.print(simulatedTemperature);
    Serial.print(" | Setpoint: ");
    Serial.println(setpointTemperature);

    char tempStr[8];
    dtostrf(simulatedTemperature, 4, 1, tempStr);
    tempCharacteristic->setValue((uint8_t*)tempStr, strlen(tempStr));
    tempCharacteristic->notify();

    char setStr[8];
    dtostrf(setpointTemperature, 4, 1, setStr);
    setpointCharacteristic->setValue((uint8_t*)setStr, strlen(setStr));
    setpointCharacteristic->notify();
  }
}
