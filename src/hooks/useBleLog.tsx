import { useEffect, useState, useRef } from 'react';
import BleManager, { Peripheral } from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import { SensorData, SensorDataType, buildCommand, LogControl, LogControlType } from '../../src/proto/SensorData';
import { useBle } from '../../context/BleContext';
import protobuf from 'protobufjs';
import { usePopup } from '../../context/PopupContext';
import { logDemo } from '../helpers/sensorDemo';

interface UseBleLog {
    logs: SensorDataType[];
    demoLogs: SensorDataType[];
    downloadLog: (device: Peripheral) => Promise<void>;
    clearLogs: () => void;
    isDownloading: boolean;
    error: string | null;
}

export const useBleLog = (): UseBleLog => {

    const { bleManagerEmitter } = useBle();
    const { showMessage } = usePopup()

    const [logs, setLogs] = useState<SensorDataType[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expectedTotal, setExpectedTotal] = useState<number | null>(null);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const serviceUUID = '00001809-0000-1000-8000-00805f9b34fb';
    const logCharUUID = '00002a1d-0000-1000-8000-00805f9b34fb';
    const logControlCharUUID = '00002a1f-0000-1000-8000-00805f9b34fb';


    const [demoLogs, setDemologs] = useState<SensorDataType[]>([]);

    useEffect(() => {
        const updateListener = bleManagerEmitter.addListener(
            'BleManagerDidUpdateValueForCharacteristic',
            ({ value, characteristic }) => {

                const buffer = Buffer.from(value);
                const reader = protobuf.Reader.create(buffer);

                if (characteristic.toLowerCase() === logCharUUID.toLowerCase()) {

                    while (reader.pos < reader.len) {
                        try {
                            const msg = SensorData.decodeDelimited(reader) as unknown as SensorDataType;
                            setLogs(prev => {
                                const unique = !prev.some(e => e.timestamp === msg.timestamp);
                                return unique ? [...prev, msg] : prev;
                            });

                            resetTimeout();
                        } catch (err) {
                            console.warn('⚠️ Decode log error:', err);
                            break;
                        }
                    }
                }

                if (characteristic.toLowerCase() === logControlCharUUID.toLowerCase()) {
                    try {
                        const ctrl = LogControl.decode(reader) as unknown as LogControlType;
                        console.log('📦 Total logs informados:', ctrl.totalEntries);
                        setExpectedTotal(ctrl.totalEntries);
                    } catch (err) {
                        console.warn('⚠️ Decode control error:', err);
                    }
                }
            }
        );

        return () => {
            updateListener.remove();
        };
    }, []);

    const resetTimeout = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            checkCompletion();
        }, 3000);
    };

    const checkCompletion = async () => {
        if (expectedTotal !== null && logs.length >= expectedTotal) {
            console.log('✅ Todos os logs recebidos');
        } else {
            console.warn('⚠️ Timeout: logs incompletos');
        }
        await stopLogNotification();
        setIsDownloading(false);
    };

    const downloadLog = async (device: Peripheral) => {

        if(device.name === 'DEMO') {
            setDemologs(logDemo)
            showMessage(`Download Concluido! Registros: ${logDemo.length}`, 'success')
            return
        }


        try {

            setIsDownloading(true);
            setError(null);
            setLogs([]);
            setExpectedTotal(null);

            await BleManager.retrieveServices(device.id);
            await BleManager.startNotification(device.id, serviceUUID, logCharUUID);
            await BleManager.startNotification(device.id, serviceUUID, logControlCharUUID);

            const startBuffer = buildCommand(0); // START
            await BleManager.write(
                device.id,
                serviceUUID,
                logControlCharUUID,
                Array.from(startBuffer)
            );

            resetTimeout();

        } catch (error) {
            console.error('❌ Download error:', error);
            setError(String(error));
            setIsDownloading(false);
        }
    };

    const stopLogNotification = async (device?: Peripheral) => {
        if (!device) return;
        try {
            await BleManager.stopNotification(device.id, serviceUUID, logCharUUID);
            await BleManager.stopNotification(device.id, serviceUUID, logControlCharUUID);
            const stopBuffer = buildCommand(1); // STOP
            await BleManager.write(
                device.id,
                serviceUUID,
                logControlCharUUID,
                Array.from(stopBuffer)
            );
            console.log('🛑 Notifications stopped');
        } catch (error) {
            console.warn('⚠️ Error stopping notification:', error);
        }
    };

    const clearLogs = () => {
        setLogs([]);
        setExpectedTotal(null);
    };

    return {
        logs,
        demoLogs,
        downloadLog,
        clearLogs,
        isDownloading,
        error,
    };
};
