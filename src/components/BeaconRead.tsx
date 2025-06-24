import React, { useEffect, useState } from 'react';
import { BleData, useBle } from '../../context/BleContext';
import {
    View,
    Text,
    Button,
    StyleSheet,
    Image
} from 'react-native';

import { Peripheral } from 'react-native-ble-manager';
import { usePopup } from '../../context/PopupContext';
import BeaconWrite from './BeaconWrite';

interface propsInterface {
    device: Peripheral;
    connectedStatus: (state: boolean) => void;
    handleCancel: () => void;
}

const BeaconRead: React.FC<propsInterface> = ({ device, connectedStatus, handleCancel }) => {

    const [screen, setScreen] = useState<number>(0)
    const { BleManager, bleManagerEmitter, radioState, requestRadioEnable, decodeData, downloadLog } = useBle();

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [temperature, setTemperature] = useState('--');
    const [humidity, setHumidity] = useState('--');

    const serviceUIDD = '00001809-0000-1000-8000-00805f9b34fb';
    const temperatureUIDD = '00002a1c-0000-1000-8000-00805f9b34fb';

    const { showMessage, hideMessage } = usePopup();

    useEffect(() => {

        const handleUpdateValue = (data: BleData) => {
            try {
                if (data.characteristic === temperatureUIDD) {
                    const values = decodeData(data.value)
                    setTemperature(values.temperature.toFixed(1));
                    setHumidity(values.humidity.toFixed(1));
                }
            } catch (error) {
                console.warn('Erro ao decodificar notify:', error);
            }
        };

        const handleDisconnect = (peripheral: { peripheral: string, status: number }) => {
            console.log('Dispositivo desconectado:', peripheral.peripheral);
            if (peripheral.peripheral === device.id) {
                setIsConnected(false);
                connectedStatus(false);
                setTemperature('--');
                setHumidity('--');
                setScreen(0)
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
            disconnectDevice();
            disconnectListener.remove();
            updateValueListener.remove();
        };
    }, []);

    const connectDevice = async () => {
        try {
            console.log('Tentando conectar...');
            setIsConnecting(true);

            const connectedPeripherals = await BleManager.getConnectedPeripherals([]);
            const isAlreadyConnected = connectedPeripherals.some(
                (p) => p.id === device.id
            );

            if (isAlreadyConnected) {
                console.log('Já conectado!');
                setIsConnected(true);
                connectedStatus(true);
                await retrieveData();
                return;
            }

            await BleManager.connect(device.id);
            showMessage('Conectado com sucesso!', 'success');

            await BleManager.retrieveServices(device.id);
            console.log('Serviços descobertos');

            await BleManager.startNotification(device.id, serviceUIDD, temperatureUIDD);
            console.log('Notificações ativadas');

            setIsConnected(true);
            connectedStatus(true);
            setIsConnecting(false);

            await retrieveData();

        } catch (error) {
            console.warn('Erro ao conectar:', error);
            showMessage(`${error}`, 'error');
            if (isConnected) {
                disconnectDevice();
                setIsConnecting(false);
            }
        }
    };

    const retrieveData = async () => {

        try {
            const value = await BleManager.read(device.id, serviceUIDD, temperatureUIDD);
            const values = decodeData(value)
            console.log(values)
            setTemperature(values.temperature.toFixed(1));
            setHumidity(values.humidity.toFixed(1));

        } catch (error) {
            console.warn('Erro ao ler dados:', error);
            showMessage(`${error}`, 'error');
        }
    };

    const disconnectDevice = async () => {

        try {

            console.log('Desconectando...');
            await BleManager.disconnect(device.id);

            setScreen(0)
            setIsConnected(false);
            setIsConnecting(false)
            setTemperature('--');
            setHumidity('--');
            console.log('Dispositivo desconectado');

        } catch (error) {
            console.warn('Erro ao desconectar:', error);
            showMessage(`${error}`, 'error');
        }
    };

    const handleNav = (screen: number) => {
        setScreen(screen)
    }

    const handleCancelConfig = () => {
        setScreen(0)
        hideMessage()
    }

    const handleDownload = async ()  => {
        try {
            await downloadLog(device)
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        if (!radioState) {
            disconnectDevice();
            setScreen(0)
        }
    }, [radioState]);

    return (

        radioState ? (
            <View style={styles.container}>

                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{device.name || 'Beacon'}</Text>
                        <Text style={styles.id}>{device.id}</Text>
                        <Text style={isConnected ? styles.stateOn : styles.stateOff}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
                    </View>
                    <View style={styles.buttons}>
                        <Button disabled={isConnected || isConnecting} title='Cancel' onPress={handleCancel} />
                        {isConnected ? (
                            <Button title="Disconnect" onPress={disconnectDevice} />
                        ) : (
                            <Button title={isConnecting ? 'Connecting...' : 'Connect'} onPress={connectDevice} />
                        )}
                    </View>
                </View>

                {/* Read Page */}
                {screen === 0 &&
                    <>
                        <View style={styles.body}>
                            {isConnected &&
                                <>
                                    <View style={styles.bodyValues}>
                                        <View style={styles.labelContainer}>
                                            <Image
                                                source={require('../../assets/temperature_icon.png')}
                                                style={styles.icon}
                                                resizeMode="contain"
                                            />
                                            <Text style={styles.label}>
                                                {`${temperature} °C`}
                                            </Text>
                                        </View>
                                        <View style={styles.labelContainer}>
                                            <Image
                                                source={require('../../assets/humidity_icon.png')}
                                                style={styles.icon}
                                                resizeMode="contain"
                                            />
                                            <Text style={styles.label}>
                                                {`${humidity} %`}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.bodyButtons}>
                                        <Button title='Config. Sensor' onPress={() => handleNav(1)} />
                                        <Button title='Download Data' onPress={() => handleDownload()} />
                                    </View>
                                </>
                            }
                        </View>

                    </>
                }

                {/* Config Page */}
                {screen === 1 && isConnected &&
                    <BeaconWrite device={device} cancelConfig={handleCancelConfig}></BeaconWrite>
                }

            </View>
        ) : (
            <View style={styles.radioDisabledContainer}>
                <Text style={styles.text}>BLUETOOTH IS OFF!</Text>
                <Button title='Enable Bluetooth' onPress={requestRadioEnable} />
            </View>
        )
    );
}

export default BeaconRead;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        minWidth: '100%',
        gap: 20,
    },
    radioDisabledContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    header: {
        gap: 20,
        justifyContent: 'flex-start',
        alignItems: 'center',
        height: 'auto',
    },
    titleContainer: {
        width: '100%',
        gap: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#00BFFF',
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
        color: '#fff',
        textAlign: 'center'
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
    },
    bodyValues: {
        flex: 1,
        gap: 10,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    bodyButtons: {
        height: 'auto',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        minWidth: '100%',
    },
    labelContainer: {
        height: 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 20,
    },
    icon: {
        width: 50,
        height: 50,
    },
    label: {
        fontSize: 50,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'left'
    },
    text: {
        color: '#fff',
        fontSize: 20
    }
});
