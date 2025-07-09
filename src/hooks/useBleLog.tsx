import { useEffect, useRef, useState } from 'react';
import BleManager, { Peripheral } from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import { SensorData, SensorDataType, buildCommand, LogControl, LogControlType } from '../../src/proto/SensorData';
import { BleData, useBle } from '../../context/BleContext';
import { usePopup } from '../../context/PopupContext';
import { logDemo } from '../helpers/sensorDemo';
import protobuf from 'protobufjs';

interface UseBleLog {
    logs: SensorDataType[];
    demoLogs: SensorDataType[];
    downloadLog: (device: Peripheral) => Promise<void>;
    clearLogs: () => void;
    isDownloading: boolean;
    error: string | null;
}

export const useBleLog = (): UseBleLog => {
    const { bleManagerEmitter, decodeDataSensor, decodeLogControl } = useBle();
    const { showMessage } = usePopup();

    const [logs, setLogs] = useState<SensorDataType[]>([]);
    const [demoLogs, setDemologs] = useState<SensorDataType[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expectedTotal, setExpectedTotal] = useState<number | null>(null);

    const deviceRef = useRef<Peripheral | null>(null);
    const currentStep = useRef<'idle' | 'waiting_length' | 'receiving' | 'completed'>('idle');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const serviceUUID = '00001809-0000-1000-8000-00805f9b34fb';
    const logCharUUID = '00002a1d-0000-1000-8000-00805f9b34fb';
    const logControlCharUUID = '00002a1f-0000-1000-8000-00805f9b34fb';

    useEffect(() => {

        const handleUpdate = async (data: BleData) => {

            if (data.characteristic.toLowerCase() === logControlCharUUID.toLowerCase()) {
                try {
                    
                    const values = decodeLogControl(data.value)
                    console.log('📦 Total logs informados:', values.length);
                    setExpectedTotal(values.length);

                    if (currentStep.current === 'waiting_length') {
                        currentStep.current = 'receiving';

                        const startBuffer = buildCommand(0); // START
                        await BleManager.write(
                            deviceRef.current!.id,
                            serviceUUID,
                            logControlCharUUID,
                            Array.from(startBuffer)
                        );

                        resetTimeout();
                    }
                } catch (err) {
                    console.warn('⚠️ Decode control error:', err);
                }
            }

            if (data.characteristic.toLowerCase() === logCharUUID.toLowerCase()) {
                try {
                    const values = decodeDataSensor(data.value)
                    setLogs(prev => {
                        const unique = !prev.some(e => e.timestamp === values.timestamp);
                        return unique ? [...prev, values] : prev;
                    });

                    resetTimeout();

                    // Atualizamos após setLogs por segurança
                    setTimeout(async () => {
                        const total = expectedTotal;
                        const received = logs.length + 1;

                        if (currentStep.current === 'receiving' && total !== null && received >= total) {
                            console.log('✅ Todos os logs recebidos');
                            currentStep.current = 'completed';

                            const stopBuffer = buildCommand(1); // STOP
                            await BleManager.write(
                                deviceRef.current!.id,
                                serviceUUID,
                                logControlCharUUID,
                                Array.from(stopBuffer)
                            );

                            await stopLogNotification(deviceRef.current);
                            setIsDownloading(false);
                            showMessage(`Download Concluído! Registros: ${received}`, 'success');
                        } else {
                            // Envia NEXT
                            const nextBuffer = buildCommand(3); // NEXT
                            await BleManager.write(
                                deviceRef.current!.id,
                                serviceUUID,
                                logControlCharUUID,
                                Array.from(nextBuffer)
                            );
                        }
                    }, 50); // pequeno delay para esperar `setLogs` se propagar
                } catch (err) {
                    console.warn('⚠️ Decode log error:', err);
                }
            }

        }

        const updateListener = bleManagerEmitter.addListener(
            'BleManagerDidUpdateValueForCharacteristic', handleUpdate
        );

        return () => {
            updateListener.remove();
        };
    }, [expectedTotal, logs.length]);

    const resetTimeout = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            checkCompletion();
        }, 5000);
    };

    const checkCompletion = async () => {
        const total = expectedTotal;
        if (total !== null && logs.length >= total) {
            console.log('✅ Timeout detectou fim dos logs');
        } else {
            console.warn('⚠️ Timeout: logs incompletos');
            setError('Timeout na transferência dos logs.');
        }

        await stopLogNotification(deviceRef.current);
        setIsDownloading(false);
    };

    const downloadLog = async (device: Peripheral) => {
        if (device.name === 'DEMO') {
            setDemologs(logDemo);
            showMessage(`Download Concluído! Registros: ${logDemo.length}`, 'success');
            return;
        }

        try {
            setIsDownloading(true);
            setError(null);
            setLogs([]);
            setExpectedTotal(null);
            currentStep.current = 'waiting_length';
            deviceRef.current = device;

            await BleManager.retrieveServices(device.id);
            await BleManager.startNotification(device.id, serviceUUID, logCharUUID);
            await BleManager.startNotification(device.id, serviceUUID, logControlCharUUID);

            const getLengthBuffer = buildCommand(4); // GETLENGTH
            await BleManager.write(
                device.id,
                serviceUUID,
                logControlCharUUID,
                Array.from(getLengthBuffer)
            );
        } catch (error) {
            console.error('❌ Download error:', error);
            setError(String(error));
            setIsDownloading(false);
        }
    };

    const stopLogNotification = async (device: Peripheral | null) => {
        if (!device) return;
        try {
            await BleManager.stopNotification(device.id, serviceUUID, logCharUUID);
            await BleManager.stopNotification(device.id, serviceUUID, logControlCharUUID);
            console.log('🛑 Notificações encerradas');
        } catch (error) {
            console.warn('⚠️ Erro ao parar notificações:', error);
        }
    };

    const clearLogs = () => {
        setLogs([]);
        setExpectedTotal(null);
    };

    useEffect(() => {
        console.log(logs)
    },[logs])

    return {
        logs,
        demoLogs,
        downloadLog,
        clearLogs,
        isDownloading,
        error,
    };
};
