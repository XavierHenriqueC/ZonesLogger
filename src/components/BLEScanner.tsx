import React, { useEffect, useState } from 'react';
import { useBle } from '../../context/BleContext';
import {
    View,
    Text,
    FlatList,
    Button,
    StyleSheet,
    ListRenderItem,
    TouchableOpacity,
} from 'react-native';

import { Peripheral } from 'react-native-ble-manager';

interface propsInterface {
    handleSelectDevice: (id: string) => void;
}

const BLEScanner: React.FC<propsInterface> = ({handleSelectDevice}) => {

    const [scanning, setScanning] = useState(false);
    const [devices, setDevices] = useState<Peripheral[]>([]);
    const { BleManager, bleManagerEmitter } = useBle()

    useEffect(() => {

        startScan()

        const handleDiscover = (peripheral: Peripheral) => {

            if (peripheral.advertising.serviceUUIDs?.includes('1809')) {
                setDevices(prev => {
                    const exists = prev.find(p => p.id === peripheral.id);
                    return exists ? prev : [...prev, peripheral];
                });
                console.log(peripheral)
            }
        };

        const discoverListener = bleManagerEmitter.addListener(
            'BleManagerDiscoverPeripheral',
            handleDiscover
        );

        return () => {
            discoverListener.remove();
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
            }, 10000);
        }
    };

    const renderItem: ListRenderItem<Peripheral> = ({ item }) => (
        <TouchableOpacity onPress={() => handleSelectDevice(item.id)} style={styles.device}>
            <Text style={styles.name}>{item.name || 'Desconhecido'}</Text>
            <Text>ID: {item.id}</Text>
            <Text>RSSI: {item.rssi}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1 }}>
            <Button title={scanning ? 'Scanning...' : 'Refresh'} onPress={startScan} />
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