// BleContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import BleManager, { Peripheral } from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { Buffer } from 'buffer';
import { SensorData, SensorDataType, buildCommand } from '../src/proto/SensorData';
import { usePopup } from './PopupContext'

interface BleContextType {
    requestRadioEnable: () => void;
    bleManagerEmitter: NativeEventEmitter;
    BleManager: typeof BleManager;
    radioState: boolean;
    devicesFound: Peripheral[];
    setDevicesFound: React.Dispatch<React.SetStateAction<Peripheral[]>>;
    decodeData: (value: number[]) => SensorDataType;
}

export type BleData = {
    value: number[];
    peripheral: string;
    characteristic: string;
    service: string;
};

const BleContext = createContext<BleContextType | undefined>(undefined);

export const BleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const { showMessage } = usePopup();
    const [radioState, setRadioState] = useState<boolean>(false);
    const [devicesFound, setDevicesFound] = useState<Peripheral[]>([]);
    const BleManagerModule = NativeModules.BleManager;
    const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

    useEffect(() => {
        BleManager.checkState();
        BleManager.start({ showAlert: false });

        const handleRadioStateChange = (args: { state: string }) => {
            setRadioState(args.state === 'on');
        };

        const updateState = bleManagerEmitter.addListener(
            'BleManagerDidUpdateState',
            handleRadioStateChange
        );

        return () => {
            updateState.remove();
        };


    }, []);

    useEffect(() => {
        requestRadioEnable();
    }, [radioState]);

    const requestRadioEnable = () => {
        if (!radioState) {
            BleManager.enableBluetooth();
        }
    };

    const decodeData = (value: number[]): SensorDataType => {
        const buffer = Buffer.from(value);
        const decoded = SensorData.decode(buffer);
        const decodedObj = SensorData.toObject(decoded) as SensorDataType;
        return decodedObj;
    };

    return (
        <BleContext.Provider value={{
            BleManager,
            bleManagerEmitter,
            radioState,
            devicesFound,
            setDevicesFound,
            requestRadioEnable,
            decodeData,
        }}>
            {children}
        </BleContext.Provider>
    );
};

export const useBle = () => {
    const context = useContext(BleContext);
    if (!context) throw new Error('useBle must be used within a BleProvider');
    return context;
};
