import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Button
} from 'react-native';
import BLEScanner from '../components/BLEScanner';
import { useBle } from '../../context/BleContext';
import BeaconRead from '../components/BeaconRead';
import { Peripheral } from 'react-native-ble-manager';
import { usePopup } from '../../context/PopupContext';

interface propsInterface {

}


const ScanPage: React.FC<propsInterface> = ({ }) => {

    const [screen, setScreen] = useState<number>(0)
    const { radioState, requestRadioEnable } = useBle()
    const [deviceSelected, setDeviceSelected] = useState<Peripheral | null>(null)
    const { hideMessage } = usePopup()

    const handleNav = (screen: number) => {
        setScreen(screen)
    }

    const handleSelectDevice = (item: Peripheral) => {
        setDeviceSelected(item)
        handleNav(1)
    }

    const checkConnectedStatus = (state: boolean) => {
        
    }

    const handleCancel = () => {
        setScreen(0)
        hideMessage()
    }

    useEffect(() => {
        setScreen(0)
    }, [])

    return (
        <View style={styles.container}>

            {/* ScanPage */}
            {screen === 0 &&
                <>
                    {radioState ? (
                        <BLEScanner handleSelectDevice={handleSelectDevice}></BLEScanner>
                    ) : (

                        <View style={styles.bluetoothOff}>
                            <Text style={styles.text}>BLUETOOTH IS OFF!</Text>
                            <Button title='Enable Bluetooth' onPress={requestRadioEnable}></Button>
                        </View>
                    )
                    }

                </>
            }

            {/* DevicePage */}
            {screen === 1 && deviceSelected &&
                <BeaconRead device={deviceSelected} connectedStatus={checkConnectedStatus} handleCancel={handleCancel}></BeaconRead>
            }


        </View >
    );
};

export default ScanPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bluetoothOff: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 10
    },
    text: {
        color: '#fff',
        fontSize: 20
    }
});