import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { BleProvider } from './context/BleContext';
import { PopupProvider } from './context/PopupContext';

import PermissionsPage from './src/routes/PermissionsPage';
import HomePage from './src/routes/HomePage';

const App: React.FC = () => {

  const [hasPermission, setHasPermission] = useState(false);

  return (
    <PopupProvider>
      <BleProvider>
        <SafeAreaView style={styles.container}>
          {hasPermission ? (
            <HomePage></HomePage>
          ) : (
            <PermissionsPage onGranted={() => setHasPermission(true)} />
          )
          }
        </SafeAreaView>
      </BleProvider >
    </PopupProvider>
  );

};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#006494',
    flex: 1,
  }
})

export default App;
