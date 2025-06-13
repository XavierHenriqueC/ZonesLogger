import React, { useState } from 'react';
import { SafeAreaView, View, StyleSheet, Text } from 'react-native';
import BLEPermissions from './src/components/BLEPermissions';
import BLEScanner from './src/components/BLEScanner';
import TemperatureSensor from './src/components/TemperatureSensor';

const App: React.FC = () => {
  
  const [hasPermission, setHasPermission] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.textHeader}>ZonesLogger</Text>
      </View>
      <BLEPermissions onGranted={() => setHasPermission(true)} />
      {hasPermission && (
        <View style={styles.body}>
          <TemperatureSensor></TemperatureSensor>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: "#00f",
    height: 'auto',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textHeader: {
    color: "#fff",
    fontSize: 20
  },
  body: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
})

export default App;
