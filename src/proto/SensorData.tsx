import protobuf from 'protobufjs';

const proto = `
syntax = "proto3";
message SensorData {
  float temperature = 1;
  float humidity = 2;
  uint64 timestamp = 3;
  uint64 interval = 4;
}
`;

const root = protobuf.parse(proto).root;
export const SensorData = root.lookupType('SensorData');

export type SensorDataType = {
  temperature: number;
  humidity: number;
  timestamp: number;
  interval: number;
};

