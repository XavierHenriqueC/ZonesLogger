import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Button,
    NativeEventEmitter,
    NativeModules,
    TextInput,
    PermissionsAndroid,
    Platform,
    StyleSheet,
} from 'react-native';

import { Buffer } from 'buffer';
import BleManager from 'react-native-ble-manager';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const DEVICE_ID = '58:BF:25:92:D6:B2';
const SERVICE_UUID = '00001809-0000-1000-8000-00805f9b34fb';
const TEMPERATURE_UUID = '00002a1c-0000-1000-8000-00805f9b34fb';  // Temperatura (READ + NOTIFY)
const SETPOINT_UUID = '00002a1e-0000-1000-8000-00805f9b34fb';     // Setpoint (READ + WRITE)

// const SERVICE_UUID = '00001809-0000-1000-8000-00805f9b34fb';
// const TEMP_CHAR_UUID = '00002a1c-0000-1000-8000-00805f9b34fb';
// const SETPOINT_CHAR_UUID = '00002a1e-0000-1000-8000-00805f9b34fb';

export default function TemperatureBLE() {
    const [isConnected, setIsConnected] = useState(false);
    const [temperature, setTemperature] = useState('--');
    const [setpoint, setSetpoint] = useState('--');
    const [inputSetpoint, setInputSetpoint] = useState('');

    useEffect(() => {
        BleManager.start({ showAlert: false });

        const handleUpdateValue = (data: any) => {
            const value = Buffer.from(data.value).toString();
            console.log(`Notificação recebida de ${data.characteristic}:`, value);

            console.log(data)

            if (data.characteristic === TEMPERATURE_UUID) {
                setTemperature(value);
            } else if (data.characteristic === SETPOINT_UUID) {
                setSetpoint(value);
            }
        };

        const handleDisconnect = (peripheral: any) => {
            console.log('Dispositivo desconectado:', peripheral.peripheral);
            if (peripheral.peripheral === DEVICE_ID) {
                setIsConnected(false);
                setTemperature('--');
                setSetpoint('--');
            }
        };

        const disconnectListener = bleManagerEmitter.addListener(
            'BleManagerDisconnectPeripheral',
            handleDisconnect
        );

        const updateValueListener = bleManagerEmitter.addListener(
            'BleManagerDidUpdateValueForCharacteristic',
            handleUpdateValue
        );

        return () => {
            disconnectListener.remove();
            updateValueListener.remove();
        };
    }, []);

    const connectDevice = async () => {
        try {
            console.log('Tentando conectar...');

            const connectedPeripherals = await BleManager.getConnectedPeripherals([]);
            const isAlreadyConnected = connectedPeripherals.some(
                (p) => p.id === DEVICE_ID
            );

            if (isAlreadyConnected) {
                console.log('Já conectado!');
                setIsConnected(true);
                await retrieveData();
                return;
            }

            await BleManager.connect(DEVICE_ID);
            console.log('Conectado com sucesso');

            await BleManager.retrieveServices(DEVICE_ID);
            console.log('Serviços descobertos');

            await BleManager.startNotification(DEVICE_ID, SERVICE_UUID, TEMPERATURE_UUID);
            await BleManager.startNotification(DEVICE_ID, SERVICE_UUID, SETPOINT_UUID);

            console.log('Notificações ativadas');

            setIsConnected(true);

            await retrieveData();
        } catch (error) {
            console.warn('Erro ao conectar:', error);
        }
    };

    const retrieveData = async () => {
        try {
            const tempData = await BleManager.read(DEVICE_ID, SERVICE_UUID, TEMPERATURE_UUID);
            const tempValue = Buffer.from(tempData).toString();
            setTemperature(tempValue);

            const setpointData = await BleManager.read(DEVICE_ID, SERVICE_UUID, SETPOINT_UUID);
            const setpointValue = Buffer.from(setpointData).toString();
            setSetpoint(setpointValue);

            console.log('Dados lidos:', { tempValue, setpointValue });
        } catch (error) {
            console.warn('Erro ao ler dados:', error);
        }
    };

    const disconnectDevice = async () => {
        try {
            console.log('Desconectando...');
            await BleManager.stopNotification(DEVICE_ID, SERVICE_UUID, TEMPERATURE_UUID);
            await BleManager.stopNotification(DEVICE_ID, SERVICE_UUID, SETPOINT_UUID);
            await BleManager.disconnect(DEVICE_ID);

            setIsConnected(false);
            setTemperature('--');
            setSetpoint('--');

            console.log('Dispositivo desconectado');
        } catch (error) {
            console.warn('Erro ao desconectar:', error);
        }
    };

    const writeSetpoint = async () => {
        if (!inputSetpoint) return;

        try {
            const valueBytes = Buffer.from(inputSetpoint);
            await BleManager.write(
                DEVICE_ID,
                SERVICE_UUID,
                SETPOINT_UUID,
                Array.from(valueBytes)
            );

            console.log('Setpoint enviado:', inputSetpoint);
            setSetpoint(inputSetpoint);
            setInputSetpoint('');
        } catch (error) {
            console.warn('Erro ao enviar setpoint:', error);
        }
    };

    useEffect(() => {
        console.log(`Temperatura: ${temperature}`)
    },[temperature])

    return (
        <View style={styles.container}>
            <Text style={styles.title}>ESP32 BLE Temperatura</Text>

            <Text style={styles.label}>
                Temperatura: {isConnected ? `${temperature} °C` : '-- °C'}
            </Text>

            <Text style={styles.label}>
                Setpoint: {isConnected ? `${setpoint} °C` : '-- °C'}
            </Text>

            {isConnected && (
                <View style={styles.setpointContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Novo setpoint"
                        keyboardType="numeric"
                        value={inputSetpoint}
                        onChangeText={setInputSetpoint}
                    />
                    <Button title="Enviar" onPress={writeSetpoint} />
                </View>
            )}

            <View style={{ marginTop: 20 }}>
                {isConnected ? (
                    <Button title="Desconectar" onPress={disconnectDevice} />
                ) : (
                    <Button title="Conectar" onPress={connectDevice} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 22,
        marginBottom: 20,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 24,
        marginVertical: 5,
    },
    setpointContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 8,
        minWidth: 100,
        marginRight: 10,
        fontSize: 18,
    },
});
