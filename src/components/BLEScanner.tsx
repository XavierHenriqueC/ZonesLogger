import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Button,
    NativeEventEmitter,
    NativeModules,
    StyleSheet,
    Platform,
    ListRenderItem,
} from 'react-native';

import BleManager, { Peripheral } from 'react-native-ble-manager';

const BleManagerModule = NativeModules.BleManager;
const bleEmitter = new NativeEventEmitter(BleManagerModule);

const BLEScanner: React.FC = () => {

    const [scanning, setScanning] = useState(false);
    const [devices, setDevices] = useState<Peripheral[]>([]);

    useEffect(() => {

        BleManager.start({ showAlert: false }).then(() => {
            console.log('BLE Manager iniciado');
        });

        const handleDiscover = (peripheral: Peripheral) => {
            setDevices(prev => {
                const exists = prev.find(p => p.id === peripheral.id);
                return exists ? prev : [...prev, peripheral];
            });
        };

        bleEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscover);

        return () => {
            bleEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
        };

    }, []);

    const startScan = () => {
        
        if (!scanning) {
            setDevices([]);
            setScanning(true);

            BleManager.scan([], 5, true)
                .then(() => console.log('Scan iniciado'))
                .catch(err => console.error(err));

            setTimeout(() => {
                setScanning(false);
                console.log('Scan finalizado');
            }, 5000);
        }
    };

    const renderItem: ListRenderItem<Peripheral> = ({ item }) => (
        <View style={styles.device}>
            <Text style={styles.name}>{item.name || 'Desconhecido'}</Text>
            <Text>ID: {item.id}</Text>
            <Text>RSSI: {item.rssi}</Text>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <Button title={scanning ? 'Escaneando...' : 'Iniciar Scan'} onPress={startScan} />
            <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 10 }}
            />
        </View>
    );
};

export default BLEScanner;

const styles = StyleSheet.create({
    device: {
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    name: {
        fontWeight: 'bold',
    },
});