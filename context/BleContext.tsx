// BleContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import BleManager, { Peripheral } from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { Buffer } from 'buffer';
import { SensorData, SensorDataType, SensorDataLog } from '../src/proto/SensorData';
import { usePopup } from './PopupContext';

interface BleContextType {
    requestRadioEnable: () => void;
    bleManagerEmitter: NativeEventEmitter;
    BleManager: typeof BleManager;
    radioState: boolean;
    devicesFound: Peripheral[];
    setDevicesFound: React.Dispatch<React.SetStateAction<Peripheral[]>>;
    decodeData: (value: number[]) => SensorDataType;
    downloadLogData: (device: Peripheral, serviceUIDD: string, logUUID: string, controlUUID: string) => Promise<void>;
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



    const downloadLogData = async (
        device: Peripheral,
        serviceUUID: string,
        logUUID: string,
        controlUUID: string
    ) => {
        const chunks: Buffer[] = [];
        let lastChunkTime = Date.now();

        console.log('Iniciado download dos logs');
        showMessage('Download Started...', 'info');

        // Inicia notificação para receber dados
        await BleManager.startNotification(device.id, serviceUUID, logUUID)
        .then(() => console.log('Notificações iniciadas no download'))
        .catch((e) => console.log('Erro nas Notificações do download',e))

        const subscription = bleManagerEmitter.addListener(
            'BleManagerDidUpdateValueForCharacteristic',
            ({ value, characteristic, peripheral }) => {
                if (characteristic.toLowerCase() === logUUID.toLowerCase() && peripheral === device.id) {
                    const chunk = Buffer.from(value);
                    chunks.push(chunk);
                    lastChunkTime = Date.now();

                    console.log(`Chunk recebido: ${chunk.length} bytes`);
                }
            }
        );

        // Envia o comando 'start' para iniciar a transmissão dos logs
        await BleManager.write(
            device.id,
            serviceUUID,
            controlUUID,
            Buffer.from('start').toJSON().data
        );

        console.log('Comando start enviado');

        // Aguarda os dados chegando até um timeout sem receber chunks (ex.: 1500 ms sem receber)
        await new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
                const now = Date.now();
                const timeSinceLastChunk = now - lastChunkTime;

                if (timeSinceLastChunk > 1500) {
                    console.log('Timeout sem novos dados. Encerrando...');
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
        });

        // Para de escutar notificações
        subscription.remove();
        await BleManager.stopNotification(device.id, serviceUUID, logUUID);

        const fullBuffer = Buffer.concat(chunks);
        console.log('Total de dados recebidos:', fullBuffer.length);

        if (fullBuffer.length === 0) {
            showMessage('Nenhum dado recebido!', 'error');
            return;
        }

        try {
            const decodedMessage = SensorDataLog.decode(fullBuffer);
            const decodedLog = SensorDataLog.toObject(decodedMessage, {
                longs: Number,
                defaults: true,
                arrays: true,
                objects: true,
            }) as { logs: SensorDataType[] };

            const logs = decodedLog.logs || [];

            console.log(`Logs recebidos: ${logs.length} registros`);
            showMessage(`Logs recebidos: ${logs.length} registros`, 'success');

            logs.forEach((log) => {
                console.log(
                    `T=${log.temperature}°C | H=${log.humidity}% | Timestamp=${log.timestamp}`
                );
            });

            // 🔥 Aqui você pode salvar os logs em CSV, JSON ou exibir na UI.

        } catch (error) {
            console.error('Erro na decodificação dos logs:', error);
            showMessage('Erro na decodificação dos logs', 'error');
        }
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
            downloadLogData,
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
