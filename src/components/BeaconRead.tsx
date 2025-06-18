import React, { useEffect, useState } from 'react';
import { useBle } from '../../context/BleContext';
import {
    View,
    Text,
    Button,
    StyleSheet,
    Image
} from 'react-native';

import { Buffer } from 'buffer';
import { Peripheral } from 'react-native-ble-manager';
import { usePopup } from '../../context/PopupContext';

interface propsInterface {
    device: Peripheral;
    connectedStatus: (state: boolean) => void;
    handleCancel: () => void;
}

const BeaconRead: React.FC<propsInterface> = ({ device, connectedStatus, handleCancel }) => {

    const { BleManager, bleManagerEmitter, radioState, requestRadioEnable } = useBle()

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [temperature, setTemperature] = useState('--');
    const [humidity, setHumidity] = useState('--');

    const serviceUIDD = '00001809-0000-1000-8000-00805f9b34fb'; //1809
    const temperatureUIDD = '00002a1c-0000-1000-8000-00805f9b34fb';  // Temperatura (READ + NOTIFY)

    const { showMessage } = usePopup()

    useEffect(() => {

        const handleUpdateValue = (data: any) => {

            const value = Buffer.from(data.value).toString();

            if (data.characteristic === temperatureUIDD) {
                setTemperature(value);
            }
        };

        const handleDisconnect = (peripheral: any) => {
            console.log('Dispositivo desconectado:', peripheral.peripheral);
            if (peripheral.peripheral === device.id) {
                setIsConnected(false);
                connectedStatus(false)
                setTemperature('--');
                setHumidity('--');
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

            //Verifica se já esta conectado
            const connectedPeripherals = await BleManager.getConnectedPeripherals([]);
            const isAlreadyConnected = connectedPeripherals.some(
                (p) => p.id === device.id
            );

            if (isAlreadyConnected) {
                console.log('Já conectado!');
                setIsConnected(true);
                connectedStatus(true)
                await retrieveData();
                return;
            }

            //Conecta, requisita serviços e inicia notificações
            await BleManager.connect(device.id);
            showMessage('Conectado com sucesso!', 'success')

            await BleManager.retrieveServices(device.id).then((value) => console.log(value));
            console.log('Serviços descobertos');

            await BleManager.startNotification(device.id, serviceUIDD, temperatureUIDD);
            console.log('Notificações ativadas');

            setIsConnected(true);
            connectedStatus(true)

            //Recebe os dados
            await retrieveData();

        } catch (error) {
            console.warn('Erro ao conectar:', error);
            showMessage(`${error}`, 'error')
            disconnectDevice()
        } finally {
            setIsConnecting(false)
        }
    };

    const retrieveData = async () => {
        try {
            const data = await BleManager.read(device.id, serviceUIDD, temperatureUIDD);
            const value = Buffer.from(data).toString();
            setTemperature(value);

            console.log('Dados lidos:', { value });
        } catch (error) {
            console.warn('Erro ao ler dados:', error);
            showMessage(`${error}`, 'error')
        }
    };

    const disconnectDevice = async () => {
        try {
            console.log('Parando notificações...');
            await BleManager.stopNotification(device.id, serviceUIDD, temperatureUIDD);
            console.log('Notificações paradas');
        } catch (error) {
            console.warn('Erro ao parar as notificações:', error);
            showMessage(`${error}`, 'error')
        }

        try {
            console.log('Desconectando...');
            await BleManager.disconnect(device.id);
            setIsConnected(false);
            setTemperature('--');
            console.log('Dispositivo desconectado');
        } catch (error) {
            console.warn('Erro ao desconectar:', error);
            showMessage(`${error}`, 'error')
        }
    };

    useEffect(() => {
        if (!radioState) {
            disconnectDevice()
        }
    }, [radioState])

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
                        <Button disabled={isConnected || isConnecting} title='Cancel' onPress={handleCancel}></Button>
                        {isConnected ? (
                            <Button title="Disconnect" onPress={disconnectDevice} />
                        ) : (
                            <Button title={isConnecting ? 'Connecting...' : 'Connect'} onPress={connectDevice} />
                        )}
                    </View>
                </View>

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
                                <Button title='Download Data'></Button>
                            </View>
                        </>
                    }
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

export default BeaconRead;

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
        justifyContent: 'flex-end',
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
