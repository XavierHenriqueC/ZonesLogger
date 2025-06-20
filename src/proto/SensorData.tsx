import protobuf from 'protobufjs';

const proto = `
syntax = "proto3";

message SensorData {
  float temperature = 1;
  float humidity = 2;
  uint64 timestamp = 3;
  uint64 interval = 4;
}

message SensorDataLog {
  repeated SensorData logs = 1;
}
`;

const root = protobuf.parse(proto).root;

export const SensorData = root.lookupType('SensorData');
export const SensorDataLog = root.lookupType('SensorDataLog');

export type SensorDataType = {
  temperature: number;
  humidity: number;
  timestamp: number;
  interval: number;
};

export type SensorDataLogType = {
  logs: SensorDataType[];
};
