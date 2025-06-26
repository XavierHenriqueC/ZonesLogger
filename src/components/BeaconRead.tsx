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
import ViewData from './ViewData';
import { useBleLog } from '../hooks/useBleLog';

interface propsInterface {
    device: Peripheral;
    connectedStatus: (state: boolean) => void;
    handleCancelConnect: () => void;
}

const BeaconRead: React.FC<propsInterface> = ({ device, connectedStatus, handleCancelConnect }) => {

    const [screen, setScreen] = useState<number>(0)
    const { showMessage, hideMessage } = usePopup();

    const { BleManager, bleManagerEmitter, radioState, requestRadioEnable, decodeData } = useBle();
    const [demo, setDemo] = useState(false)
    const { downloadLog, logs, clearLogs, demoLogs } = useBleLog()

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [temperature, setTemperature] = useState('--');
    const [humidity, setHumidity] = useState('--');

    const serviceUIDD = '00001809-0000-1000-8000-00805f9b34fb';
    const temperatureUIDD = '00002a1c-0000-1000-8000-00805f9b34fb';

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

            if (demo) {
                return
            }

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
            disconnectListener.remove();
            updateValueListener.remove();
        };
    }, []);

    const connectDevice = async () => {
        try {

            //Demo
            if (demo) {
                setIsConnected(true);
                connectedStatus(true);
                setTemperature('23.5');
                setHumidity('48.2');
                return
            }


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

        setScreen(0)
        setIsConnected(false);
        setIsConnecting(false)
        setTemperature('--');
        setHumidity('--');

        if (demo) {
            return
        }

        try {

            console.log('Desconectando...');
            await BleManager.disconnect(device.id);
            console.log('Dispositivo desconectado');

        } catch (error) {
            console.warn('Erro ao desconectar:', error);
            showMessage(`${error}`, 'error');
        }
    };

    const handleNav = (screen: number) => {
        setScreen(screen)
    }

    const handleCancelButton = async () => {
        try {
           await disconnectDevice()
           handleCancelConnect()
        } catch (e) {
            console.log(e)
        }
    }

    const handleCancel = () => {
        setScreen(0)
        hideMessage()
    }

    const handleDownload = async () => {
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

    useEffect(() => {
        if (device.name === 'DEMO') {
            setDemo(true)
        }
    }, [device])

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
                        <Button disabled={isConnected || isConnecting} title='Cancel' onPress={handleCancelButton} />
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
                                    <View style={styles.buttons}>
                                        <Button title='Config. Sensor' onPress={() => handleNav(1)} />
                                        <Button title='Download Data' onPress={() => handleDownload()} />
                                        {demo ? (
                                            demoLogs.length > 0 && <Button title='View Data' onPress={() => handleNav(2)} />
                                        ) : (
                                            logs.length > 0 && <Button title='View Data' onPress={() => handleNav(2)} />
                                        )}
                                    </View>
                                </>
                            }
                        </View>

                    </>
                }

                {/* Config Page */}
                {screen === 1 && isConnected &&
                    <BeaconWrite device={device} cancel={handleCancel}></BeaconWrite>
                }

                {/* View Data Page */}
                {screen === 2 && isConnected &&
                    <ViewData data={demo ? demoLogs : logs} cancel={handleCancel}></ViewData>
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
        minWidth: '100%',
        gap: 20,
    },
    radioDisabledContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    header: {
        gap: 10,
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
        padding: 5
    },
    buttons: {
        minWidth: '100%',
        justifyContent: 'space-between',
        height: 'auto',
        flexDirection: 'column',
        gap: 10
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
