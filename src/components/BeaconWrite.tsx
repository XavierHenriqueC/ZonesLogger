import React, { useEffect, useState } from 'react';
import { useBle } from '../../context/BleContext';
import {
    View,
    Text,
    Button,
    StyleSheet,
    TextInput,
} from 'react-native';

import { Buffer } from 'buffer';

interface propsInterface {
    deviceId: string;
    connectedStatus: (state: boolean) => void;
    handleCancel: () => void;
}

const BeaconWrite: React.FC<propsInterface> = ({ deviceId, connectedStatus, handleCancel }) => {

    const { BleManager, bleManagerEmitter, radioState, requestRadioEnable } = useBle()
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [setpoint, setSetpoint] = useState('--');
    const [inputSetpoint, setInputSetpoint] = useState('');

    const serviceUIDD = '00001809-0000-1000-8000-00805f9b34fb'; //1809
    const setpointUIDD = '00002a1e-0000-1000-8000-00805f9b34fb';     // Setpoint (READ + WRITE)

    useEffect(() => {

        const handleUpdateValue = (data: any) => {

            const value = Buffer.from(data.value).toString();

            if (data.characteristic === setpointUIDD) {
                setSetpoint(value);
            }
        };

        const handleDisconnect = (peripheral: any) => {
            console.log('Dispositivo desconectado:', peripheral.peripheral);
            if (peripheral.peripheral === deviceId) {
                setIsConnected(false);
                connectedStatus(false)
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
            disconnectDevice()
            disconnectListener.remove();
            updateValueListener.remove();
        };
    }, []);

    const connectDevice = async () => {

        try {
            console.log('Tentando conectar...');
            setIsConnecting(true)
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
            setIsConnected(true);
            connectedStatus(true)

            await BleManager.retrieveServices(deviceId);
            console.log('Serviços descobertos');

            await BleManager.startNotification(deviceId, serviceUIDD, setpointUIDD);

            console.log('Notificações ativadas');
            await retrieveData();

        } catch (error) {
            console.warn('Erro ao conectar:', error);
            disconnectDevice()
        } finally {
            setIsConnecting(false)
        }
    };

    const retrieveData = async () => {
        try {
            const setpointData = await BleManager.read(deviceId, serviceUIDD, setpointUIDD);
            const setpointValue = Buffer.from(setpointData).toString();
            setSetpoint(setpointValue);

            console.log('Dados lidos:', { setpointValue });
        } catch (error) {
            console.warn('Erro ao ler dados:', error);
        }
    };

    const disconnectDevice = async () => {
        try {
            console.log('Desconectando...');
            await BleManager.disconnect(deviceId);
            await BleManager.stopNotification(deviceId, serviceUIDD, setpointUIDD);

            setIsConnected(false);
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

    useEffect(() => {
        if (!radioState) {
            setIsConnected(false)
            setIsConnecting(false)
        }
    }, [radioState])

    return (
        radioState ? (
            <View style={styles.container}>

                <View style={styles.header}>
                    <View style={styles.buttons}>
                        <Button disabled={isConnected || isConnecting} title='Return' onPress={handleCancel}></Button>
                        {isConnected ? (
                            <Button title="Disconnect" onPress={disconnectDevice} />
                        ) : (
                            <Button title={isConnecting ? 'Connecting...' : 'Connect'} onPress={connectDevice} />
                        )}
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Beacon</Text>
                        <Text style={styles.id}>{deviceId}</Text>
                        <Text style={isConnected ? styles.stateOn : styles.stateOff}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
                    </View>
                </View>

                <View style={styles.body}>
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
                </View>

            </View>
        ) : (
            <View style={styles.container}>
                <Text style={styles.text}>BLUETOOTH IS OFF!</Text>
                <Button title='Enable Bluetooth' onPress={requestRadioEnable}></Button>
            </View>
        )
    );
}

export default BeaconWrite;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        minWidth: '100%',
        gap: 20
    },
    header: {
        gap: 20,
        justifyContent: 'flex-start',
        alignItems: 'center',
        height: 'auto',
    },
    titleContainer: {
        width: '100%',
        height: 'auto',
        gap: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 10,
        padding: 10
    },
    buttons: {
        minWidth: '100%',
        justifyContent: 'space-between',
        height: 'auto',
        flexDirection: 'row'
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff'
    },
    id: {
        color: '#fff'
    },
    stateOn: {
        color: '#0f0',
        fontWeight: 'bold',
    },
    stateOff: {
        color: '#ccc',
        fontWeight: 'bold',
    },
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#fff',
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
