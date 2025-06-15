import React, { useEffect, useState } from 'react';
import { useBle } from '../../context/BleContext';
import {
    View,
    Text,
    Button,
    TextInput,
    StyleSheet,
} from 'react-native';

import { Buffer } from 'buffer';

interface propsInterface {
    deviceId: string;
    connectedStatus: (state: boolean) => void;
}

const BeaconRead: React.FC<propsInterface> = ({ deviceId, connectedStatus }) => {

    const { BleManager, bleManagerEmitter, radioState, requestRadioEnable } = useBle()

    const [isConnected, setIsConnected] = useState(false);
    const [temperature, setTemperature] = useState('--');
    const [setpoint, setSetpoint] = useState('--');
    const [inputSetpoint, setInputSetpoint] = useState('');

    const serviceUIDD = '00001809-0000-1000-8000-00805f9b34fb'; //1809
    const temperatureUIDD = '00002a1c-0000-1000-8000-00805f9b34fb';  // Temperatura (READ + NOTIFY)
    const setpointUIDD = '00002a1e-0000-1000-8000-00805f9b34fb';     // Setpoint (READ + WRITE)

    useEffect(() => {

        const handleUpdateValue = (data: any) => {

            const value = Buffer.from(data.value).toString();

            if (data.characteristic === temperatureUIDD) {
                setTemperature(value);
            } else if (data.characteristic === setpointUIDD) {
                setSetpoint(value);
            }
        };

        const handleDisconnect = (peripheral: any) => {
            console.log('Dispositivo desconectado:', peripheral.peripheral);
            if (peripheral.peripheral === deviceId) {
                setIsConnected(false);
                connectedStatus(false)
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
                (p) => p.id === deviceId
            );

            if (isAlreadyConnected) {
                console.log('Já conectado!');
                setIsConnected(true);
                connectedStatus(true)
                await retrieveData();
                return;
            }

            await BleManager.connect(deviceId);
            console.log('Conectado com sucesso');

            await BleManager.retrieveServices(deviceId);
            console.log('Serviços descobertos');

            await BleManager.startNotification(deviceId, serviceUIDD, temperatureUIDD);
            await BleManager.startNotification(deviceId, serviceUIDD, setpointUIDD);

            console.log('Notificações ativadas');

            setIsConnected(true);
            connectedStatus(true)

            await retrieveData();

        } catch (error) {
            console.warn('Erro ao conectar:', error);
        }
    };

    const retrieveData = async () => {
        try {
            const tempData = await BleManager.read(deviceId, serviceUIDD, temperatureUIDD);
            const tempValue = Buffer.from(tempData).toString();
            setTemperature(tempValue);

            const setpointData = await BleManager.read(deviceId, serviceUIDD, setpointUIDD);
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
            await BleManager.stopNotification(deviceId, serviceUIDD, temperatureUIDD);
            await BleManager.stopNotification(deviceId, serviceUIDD, setpointUIDD);
            await BleManager.disconnect(deviceId);

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

            const request = await BleManager.write(
                deviceId,
                serviceUIDD,
                setpointUIDD,
                Array.from(valueBytes)
            );

            console.log('Setpoint enviado:', inputSetpoint, request);
            setSetpoint(inputSetpoint);
            setInputSetpoint('');
        } catch (error) {
            console.warn('Erro ao enviar setpoint:', error);
        }
    };

    return (
        radioState ? (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Beacon</Text>
                    <Text style={styles.id}>{deviceId}</Text>
                </View>

                <Text style={styles.label}>
                    {isConnected && `${temperature} °C`}
                </Text>

                {isConnected && (
                    <View style={styles.setpointContainer}>
                        <Text>
                            Setpoint: {isConnected ? `${setpoint} °C` : '-- °C'}
                        </Text>
                        <View style={styles.setpointWriteConteiner}>
                            <TextInput
                                style={styles.input}
                                placeholder="Novo setpoint"
                                keyboardType="numeric"
                                value={inputSetpoint}
                                onChangeText={setInputSetpoint}
                            />
                            <Button title="Enviar" onPress={writeSetpoint} />
                        </View>
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
        ) : (
            <View style={styles.container}>
                <Text style={styles.text}>Bluetooth is off</Text>
                <Button title='Enable Bluetooth' onPress={requestRadioEnable}></Button>
            </View>
        )
    );
}

export default BeaconRead;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'solid',
        borderColor: '#222',
        borderWidth: 1,
        borderRadius: 10,
        width: '100%'
    },
    id: {

    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 60,
        marginVertical: 5,
    },
    setpointContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        borderStyle: 'solid',
        borderColor: '#222',
        borderWidth: 1,
        borderRadius: 10,
        padding: 10
    },
    setpointWriteConteiner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 4,
        minWidth: 100,
        fontSize: 18,
    },
    text: {
        color: '#222'
    }
});
