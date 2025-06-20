import React, { useEffect, useState } from 'react';
import { useBle, BleData } from '../../context/BleContext';
import {
    View,
    Text,
    Button,
    StyleSheet,
    TextInput,
} from 'react-native';

import Slider from '@react-native-community/slider';

import { Buffer } from 'buffer';
import { Peripheral } from 'react-native-ble-manager';
import { usePopup } from '../../context/PopupContext';

import { SensorData, SensorDataType } from '../proto/SensorData';

interface propsInterface {
    device: Peripheral;
    cancelConfig: () => void
}

const BeaconWrite: React.FC<propsInterface> = ({ device, cancelConfig }) => {

    const { BleManager, bleManagerEmitter, decodeData } = useBle();
    const [interval, setInterval] = useState<number>();
    const [inputInterval, setInputInterval] = useState<number>();

    const { showMessage } = usePopup();

    const serviceUIDD = '00001809-0000-1000-8000-00805f9b34fb'; //1809
    const intervalUIDD = '00002a1e-0000-1000-8000-00805f9b34fb';  // interval (READ + WRITE)

    useEffect(() => {

        const handleUpdateValue = (data: BleData) => {
            try {
                if (data.characteristic === intervalUIDD) {
                    const values = decodeData(data.value)

                    if (values.interval) {
                        setInterval(values.interval);
                        setInputInterval(values.interval)
                    }
                }

            } catch (error) {
                console.warn('Erro ao decodificar notify:', error);
            }
        };

        const updateValueListener = bleManagerEmitter.addListener(
            'BleManagerDidUpdateValueForCharacteristic',
            handleUpdateValue
        );

        return () => {
            updateValueListener.remove();
        };
    }, []);

    const retrieveData = async () => {

        try {
            const value = await BleManager.read(device.id, serviceUIDD, intervalUIDD);
            const values = decodeData(value)

            if (values.interval) {
                setInterval(values.interval);
                setInputInterval(values.interval)
            }

        } catch (error) {
            console.warn('Erro ao ler dados:', error);
            showMessage(`${error}`, 'error');
        }
    };

    const writeData = async () => {

        try {

            // Cria mensagem com o campo interval preenchido
            const message = SensorData.create({
                interval: inputInterval,
            });

            // Serializa com protobuf
            const buffer = SensorData.encode(message).finish();

            await BleManager.write(
                device.id,
                serviceUIDD,
                intervalUIDD,
                Array.from(buffer)
            );

            setInterval(inputInterval);
            setInputInterval(inputInterval);
            showMessage('Salvo com sucesso!', 'success');

        } catch (error) {
            console.warn('Erro ao enviar interval:', error);
            showMessage(`${error}`, 'error');
        } finally {
            retrieveData()
        }
    };

    useEffect(() => {
        retrieveData()
    }, [])

    return (
        <>

            <View style={styles.body}>
                <View style={styles.bodyValues}>
                    <Text style={styles.text}>
                        Interval (Seconds)
                    </Text>
                    <View style={styles.sliderContainer}>
                        <Slider
                            style={{ width: '85%', height: 40 }}
                            minimumValue={60}
                            maximumValue={3600}
                            step={10}
                            minimumTrackTintColor="#1fb28a"
                            maximumTrackTintColor="#d3d3d3"
                            thumbTintColor="#1fb28a"
                            value={inputInterval}
                            onValueChange={setInputInterval}
                        />
                        <Text style={styles.text}>{inputInterval}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.bodyButtons}>
                <Button title="Read Sensor" onPress={cancelConfig} />
                <Button title="Save Changes" onPress={writeData} />
            </View>

        </>
    );
};

export default BeaconWrite;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: 10
    },
    body: {
        flex: 1,
        padding: 10,
    },
    bodyValues: {
        flexDirection: 'column',
        maxWidth: '100%',
        borderBottomWidth: 1,
        borderColor: '#00BFFF',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    bodyButtons: {
        height: 'auto',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        minWidth: '100%',
    },
    input: {
        width: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 4,
        height: 40,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#fff',
    },
    text: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
});
