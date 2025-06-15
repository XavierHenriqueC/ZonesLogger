import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, StyleSheet, Text, Button } from 'react-native';
import { BleProvider } from './context/BleContext';

import BLEPermissions from './src/components/BLEPermissions';
import BeaconRead from './src/components/BeaconRead';
import BLEScanner from './src/components/BLEScanner';

const App: React.FC = () => {

  const [scanScreen, setScanScreen] = useState<boolean>(true)
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [ isConnected, setIsConnected ] = useState<boolean>(false)

  const handleSelectDevice = (id: string) => {
    setSelectedDeviceId(id)
    setScanScreen(false)
  }

  const handleScan =() => {
    setScanScreen(true)
  }

  return (
    <BleProvider>
      <SafeAreaView style={{ flex: 1 }}>

        <View style={styles.header}>
          <Text style={styles.textHeader}>ZONES LOGGER</Text>
          {!isConnected && <Button title={'Scan Devices'} onPress={() => handleScan()}></Button>}
        </View>

        <BLEPermissions onGranted={() => setHasPermission(true)} />

        {hasPermission && scanScreen ? (
          <View style = {styles.body}>
            <BLEScanner handleSelectDevice={handleSelectDevice}></BLEScanner>
          </View>
        ):(
          <View style = {styles.body}>
            <BeaconRead deviceId={selectedDeviceId} connectedStatus={setIsConnected}></BeaconRead>
          </View>
        )}
    </SafeAreaView>
    </BleProvider >
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: "#00f",
    height: 'auto',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
  },

  textHeader: {
    color: "#fff",
    fontSize: 20,
    fontWeight: 'bold'
  },

  body: {
    flex: 1,
    backgroundColor: "#fff"
  },
})

export default App;
