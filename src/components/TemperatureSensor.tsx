import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Button,
    NativeModules,
    NativeEventEmitter,
    Platform,
    StyleSheet,
    Alert,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { Peripheral } from 'react-native-ble-manager';
import { Buffer } from 'buffer';

const BleManagerModule = NativeModules.BleManager;
const bleEmitter = new NativeEventEmitter(BleManagerModule);

// Atualize com os UUIDs reais do ESP32
const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcdef01-1234-1234-1234-abcdefabcdef';

const TemperatureSensor: React.FC = () => {
    const [connectedPeripheral, setConnectedPeripheral] = useState<Peripheral | null>(null);
    const [temperature, setTemperature] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        BleManager.start({ showAlert: false });

        bleEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
        bleEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral);
        bleEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValue);

        return () => {
            bleEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
            bleEmitter.removeAllListeners('BleManagerDisconnectPeripheral');
            bleEmitter.removeAllListeners('BleManagerDidUpdateValueForCharacteristic');
        };
    }, []);

    const handleDiscoverPeripheral = (peripheral: Peripheral) => {
        // Faça seu filtro por nome, MAC ou UUID do ESP32 aqui
        if (peripheral.name?.toLowerCase().includes('esp32')) {
            console.log('Encontrado:', peripheral.name);
            BleManager.stopScan();
            connectToDevice(peripheral);
        }

        console.log(peripheral)
        
    };

    const handleDisconnectedPeripheral = (data: { peripheral: string }) => {
        console.log('Dispositivo desconectado:', data.peripheral);
        setConnectedPeripheral(null);
        setTemperature(null);
    };

    const handleUpdateValue = (data: {
        value: number[];
        peripheral: string;
        characteristic: string;
        service: string;
    }) => {
        const raw = Buffer.from(data.value);
        const tempString = raw.toString(); // ex: "23.5"

        console.log('Temperatura recebida:', tempString);
        setTemperature(tempString);
    };

    const scanAndConnect = () => {
        if (scanning) return;

        setScanning(true);
        BleManager.scan([], 30, true)
            .then(() => {
                console.log('Scan iniciado...');
            })
            .catch((err) => {
                console.error('Erro no scan:', err);
                setScanning(false);
            });

        setTimeout(() => setScanning(false), 30000);
    };

    const connectToDevice = async (peripheral: Peripheral) => {
        try {
            console.log('Conectando a', peripheral.id);
            await BleManager.connect(peripheral.id);
            setConnectedPeripheral(peripheral);
            await BleManager.retrieveServices(peripheral.id);
            await BleManager.startNotification(peripheral.id, SERVICE_UUID, CHARACTERISTIC_UUID);
            console.log('Notificação iniciada');
        } catch (err) {
            console.error('Erro ao conectar:', err);
            Alert.alert('Erro', 'Não foi possível conectar ao sensor.');
        }
    };

    return (
        <View style={styles.container}>
            <Button title={scanning ? 'Escaneando...' : 'Conectar ao sensor'} onPress={scanAndConnect} />

            {connectedPeripheral && (
                <View style={styles.info}>
                    <Text style={styles.label}>Dispositivo conectado:</Text>
                    <Text>{connectedPeripheral.name || connectedPeripheral.id}</Text>
                </View>
            )}

            {temperature && (
                <View style={styles.info}>
                    <Text style={styles.label}>Temperatura:</Text>
                    <Text style={styles.temp}>{temperature} °C</Text>
                </View>
            )}
        </View>
    );
};

export default TemperatureSensor;

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
    },
    info: {
        marginTop: 20,
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    temp: {
        fontSize: 32,
        color: '#ff6600',
        fontWeight: 'bold',
    },
});