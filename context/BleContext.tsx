// BleContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import BleManager, { Peripheral } from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { Buffer } from 'buffer';
import { SensorData, SensorDataType, buildCommand } from '../src/proto/SensorData';
import { usePopup } from './PopupContext';
import protobuf from 'protobufjs';


interface BleContextType {
    requestRadioEnable: () => void;
    bleManagerEmitter: NativeEventEmitter;
    BleManager: typeof BleManager;
    radioState: boolean;
    devicesFound: Peripheral[];
    setDevicesFound: React.Dispatch<React.SetStateAction<Peripheral[]>>;
    decodeData: (value: number[]) => SensorDataType;
    downloadLog: (device: Peripheral) => Promise<void>;
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

    const serviceUIDD = '00001809-0000-1000-8000-00805f9b34fb';
    const logCharUIDD = '00002a1d-0000-1000-8000-00805f9b34fb'; //efcdab90-7856-3412-efcd-ab9078563412
    const logControlCharUUID = '00002a1f-0000-1000-8000-00805f9b34fb';

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

        const logs: SensorDataType[] = [];

        const updateLog = bleManagerEmitter.addListener(
            'BleManagerDidUpdateValueForCharacteristic',
            ({ value, characteristic }) => {
                if (characteristic.toLowerCase() === logCharUIDD.toLowerCase()) {
                    const buffer = Buffer.from(value);
                    console.log('📦 Pacote recebido:', buffer.toString('hex'));

                    const reader = protobuf.Reader.create(buffer);
                    //console.log('📖 Reader inicial:', reader);

                    function isTimestampUnique(array: SensorDataType[], objeto: SensorDataType) {
                        return !array.some(item => item.timestamp === objeto.timestamp);
                    }

                    try {
                        const msg = SensorData.decodeDelimited(reader) as unknown as SensorDataType;
                        if(isTimestampUnique(logs, msg)){
                            logs.push(msg);
                        }
                        console.log('📄 Log recebido:', logs);
                    } catch (err) {
                        console.warn('⚠️ Erro no decode:', err);
                    }

                }
            }
        );

        return () => {
            updateState.remove();
            updateLog.remove()
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


    /// 🚀 Função principal para download do log
    async function downloadLog(
        device: { id: string },
    ) {

        try {
            await BleManager.retrieveServices(device.id).then((item) => console.log(item))

            console.log('🚀 Iniciando download de log...');
            await BleManager.startNotification(device.id, serviceUIDD, logCharUIDD);

            //START
            const startBuffer = buildCommand(0);

            await BleManager.write(
                device.id,
                serviceUIDD,
                logControlCharUUID,
                Array.from(startBuffer) // BleManager espera array de int, não Buffer direto
            );

            // 🔥 Aguarda 5 segundos para o ESP32 enviar os pacotes
            await new Promise(resolve => setTimeout(resolve, 30000));

            //STOP
            // const stopCommand = buildCommand(1);

            // await BleManager.write(
            //     device.id,
            //     serviceUIDD,
            //     logControlCharUUID,
            //     Array.from(stopCommand) // BleManager espera array de int, não Buffer direto
            // );

        } catch (error) {
            console.error('❌ Erro no download de log:', error);
            throw error;
        }
    }


    return (
        <BleContext.Provider value={{
            BleManager,
            bleManagerEmitter,
            radioState,
            devicesFound,
            setDevicesFound,
            requestRadioEnable,
            decodeData,
            downloadLog,
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
