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
import ScanAnimation from './ScanAnimation'

import { Peripheral } from 'react-native-ble-manager';
import { Position, generateBeaconAnimatedPositions } from '../helpers/helpers';

interface propsInterface {
    handleSelectDevice: (item: Peripheral) => void;
}

const BLEScanner: React.FC<propsInterface> = ({ handleSelectDevice }) => {

    const [scanning, setScanning] = useState(false);
    const { BleManager, bleManagerEmitter, devicesFound, setDevicesFound } = useBle()
    const [devicesPosition, setDevicesPosition] = useState<Position[]>([])

    useEffect(() => {

        startScan()

        const handleDiscover = (peripheral: Peripheral) => {

            if (true) { //peripheral.advertising.serviceUUIDs?.includes('1809')
                
                setDevicesFound(prev => {
                    const exists = prev.find(p => p.id === peripheral.id);
                    return exists ? prev : [...prev, peripheral];
                });

                setDevicesPosition(prev => {

                    const exists = prev.find(p => p.id === peripheral.id);
                    
                    const obj: Position = {
                        id: peripheral.id,
                        x: generateBeaconAnimatedPositions().x,
                        y: generateBeaconAnimatedPositions().y
                    }

                    return exists ? prev : [...prev, obj]
                });
                //console.log(peripheral)
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

    const handleSelect = (item: Peripheral) => {
        handleSelectDevice(item)
        BleManager.stopScan().then(() => {
            setScanning(false);
        })

    }

    const startScan = () => {  
        if (!scanning) {
            setDevicesFound([]);
            setDevicesPosition([])
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
        <TouchableOpacity onPress={() => handleSelect(item)} style={styles.device}>
            <Text style={styles.name}>{item.name || 'Desconhecido'}</Text>
            <Text style={styles.id}>ID: {item.id}</Text>
            <Text style={styles.rssi}>RSSI: {item.rssi}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.animation}>
                <ScanAnimation enableAnimation={scanning} devicesPosition={devicesPosition}></ScanAnimation>
            </View>
            <View style={styles.middle}>
                <Text style={styles.text}>Sensors found: {devicesFound.length}</Text>
                <Button title={scanning ? 'Scanning...' : 'Refresh'} onPress={startScan} />
            </View>
            <FlatList
                style={styles.list}
                data={devicesFound}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 10 }}
            />

        </View>
    );
};

export default BLEScanner;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        minWidth: '100%'
    },
    animation: {
        flex: 1,
        marginBottom: 50
    },
    list: {
        flex: 1,
        marginTop: 20,
        marginBottom: 20,
        padding: 10,
        minWidth: '100%'
    },
    device: {
        width: '100%',
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#00BFFF',
    },
    name: {
        fontWeight: 'bold',
        color: '#fff'
    },
    id: {
        color: '#fff'
    },
    rssi: {
        color: '#fff'
    },
    middle: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 'auto',
        gap: 20,
    },
    text: {
        marginTop: 5,
        color: '#fff'
    }
});