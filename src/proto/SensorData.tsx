import protobuf from 'protobufjs';

const proto = `
syntax = "proto3";

message SensorData {
  uint64 timestamp = 1;
  float temperature = 2;
  float humidity = 3;
}

message SensorConfig {

  enum Log_mode {
    NEVER = 0;
    ALWAYS = 1;
    DEFINED = 3;
  }

  uint64 interval = 1;
  Log_mode log_mode = 2;
  uint64 date_time_init = 3;
  uint64 date_time_stop = 4;
}

message LogControl {
  
  enum Command {
    START = 0;
    STOP = 1;
    CLEAR = 2;
    NEXT = 3;
    GETLENGTH = 4;
  }

  Command command = 1;
  uint32 length = 2;
}
`;

const root = protobuf.parse(proto).root;

export const SensorData = root.lookupType('SensorData');
export const SensorConfig = root.lookupType('SensorConfig');
export const LogControl = root.lookupType('LogControl');

export type SensorDataType = {
  timestamp: number;
  temperature: number;
  humidity: number;
};

export type SensorConfigType = {
  interval: number;
  logMode: number;
  dateTimeInit: number;
  dateTimeStop: number;
};

export type LogControlType = {
  command: number;
  length: number;
};

export function buildCommand(command: number) {
  const message = LogControl.create({ command });
  const buffer = LogControl.encode(message).finish();
  return buffer;
}
