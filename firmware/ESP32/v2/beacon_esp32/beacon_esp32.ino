#include <NimBLEDevice.h>
#include "sensor.pb.h"
#include <pb_encode.h>
#include <pb_decode.h>
 
// Simulações
float simulatedTemperature = 25.0;
float simulatedHumidity = 50.0;
uint64_t interval = 300;
 
// BLE
NimBLECharacteristic* tempCharacteristic;
NimBLECharacteristic* intervalCharacteristic;
NimBLEAdvertising* pAdvertising;
 
// ============================
// Função para serializar os dados com protobuf
// ============================
std::string serializeSensorData(float temp, float hum, uint64_t timestamp, uint64_t interv) {
    uint8_t buffer[64];
    pb_ostream_t stream = pb_ostream_from_buffer(buffer, sizeof(buffer));
 
    SensorData data = SensorData_init_default;
    data.temperature = temp;
    data.humidity = hum;
    data.timestamp = timestamp;
    data.interval = interv;
 
    bool status = pb_encode(&stream, SensorData_fields, &data);
    if (!status) {
        Serial.println("Falha na serialização");
        return "";
    }
 
    return std::string((char*)buffer, stream.bytes_written);
}
 
// ============================
// Função para desserializar os dados recebidos
// ============================
bool deserializeSensorData(const uint8_t* buffer, size_t length, SensorData* data) {
    pb_istream_t stream = pb_istream_from_buffer(buffer, length);
    bool status = pb_decode(&stream, SensorData_fields, data);
    return status;
}
 
// ============================
// Callbacks BLE
// ============================
class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
    Serial.println(">> Dispositivo conectado!");
  }
 
  void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
    Serial.println(">> Cliente desconectado. Reiniciando advertising...");
    NimBLEDevice::startAdvertising();
  }
};
 
class intervalCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override {
    std::string value = pCharacteristic->getValue();
 
    if (value.length() > 0) {
      SensorData data = SensorData_init_default;
      bool ok = deserializeSensorData((const uint8_t*)value.data(), value.length(), &data);
 
      if (ok) {
        interval = data.interval;
        Serial.print(">> Novo interval recebido via BLE: ");
        Serial.println(interval);
      } else {
        Serial.println(">> Falha na desserialização do interval");
      }
    }
  }
};
 
void setup() {
  Serial.begin(115200);
  Serial.println("Digite a nova temperatura ou umidade no formato:");
  Serial.println("T=27.5 ou H=55.3 e pressione Enter.");
 
  NimBLEDevice::init("ESP32_TEMP_HUM");
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);
 
  NimBLEServer* pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
 
  NimBLEService* tempService = pServer->createService("1809");
 
  // Característica temperatura e umidade (READ + NOTIFY)
  tempCharacteristic = tempService->createCharacteristic(
    "2A1C",
    NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
  );
  std::string serialized = serializeSensorData(simulatedTemperature, simulatedHumidity, millis(), interval);
  tempCharacteristic->setValue(serialized);
 
  // Característica interval (READ + WRITE + NOTIFY)
  intervalCharacteristic = tempService->createCharacteristic(
    "2A1E",
    NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::NOTIFY
  );
  intervalCharacteristic->setValue(serialized);
  intervalCharacteristic->setCallbacks(new intervalCallbacks());
 
  tempService->start();
 
  // Advertising
  pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID("1809");
  pAdvertising->setAppearance(0x0340);
  pAdvertising->start();
 
  Serial.println("BLE GATT iniciado.");
}
 
void loop() {
  // Leitura manual via Serial
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
 
    if (input.startsWith("T=")) {
      simulatedTemperature = input.substring(2).toFloat();
      Serial.print(">> Nova temperatura simulada: ");
      Serial.println(simulatedTemperature);
    } else if (input.startsWith("H=")) {
      simulatedHumidity = input.substring(2).toFloat();
      Serial.print(">> Nova umidade simulada: ");
      Serial.println(simulatedHumidity);
    }
 
    std::string serialized = serializeSensorData(simulatedTemperature, simulatedHumidity, millis(), interval);
    tempCharacteristic->setValue(serialized);
    tempCharacteristic->notify();
  }
 
  // Atualiza periodicamente temperatura, umidade e interval (broadcast)
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 5000) {
    lastUpdate = millis();
 
    Serial.print(">> Temp Atual: ");
    Serial.print(simulatedTemperature);
    Serial.print(" | Umidade: ");
    Serial.print(simulatedHumidity);
    Serial.print(" | interval: ");
    Serial.println(interval);
 
    std::string serialized = serializeSensorData(simulatedTemperature, simulatedHumidity, millis(), interval);
 
    tempCharacteristic->setValue(serialized);
    tempCharacteristic->notify();
 
    intervalCharacteristic->setValue(serialized);
    intervalCharacteristic->notify();
  }
}