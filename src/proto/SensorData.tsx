import protobuf from 'protobufjs';

const proto = `
syntax = "proto3";

message SensorData {
  float temperature = 1;
  float humidity = 2;
  uint64 timestamp = 3;
  uint64 interval = 4;
}

message LogControl {
  enum Command {
    START = 0;
    STOP = 1;
    CLEAR = 2;
  }
  Command command = 1;
  uint32 total_entries = 2; // <-- Novo campo
}
`;

const root = protobuf.parse(proto).root;

export const SensorData = root.lookupType('SensorData');
export const LogControl = root.lookupType('LogControl');

export type SensorDataType = {
  temperature: number;
  humidity: number;
  timestamp: number;
  interval: number;
};

export type LogControlType = {
  command: number;
  totalEntries: number;
};

export function buildCommand(command: number) {
  const message = LogControl.create({ command });
  const buffer = LogControl.encode(message).finish();
  return buffer;
}
