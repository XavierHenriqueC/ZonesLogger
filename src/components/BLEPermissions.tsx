import React, { useEffect, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  Alert,
  Text,
  View,
  Button
} from 'react-native';

type Props = {
  onGranted?: () => void;
};

const BLEPermissions: React.FC<Props> = ({ onGranted }) => {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        const allGranted = Object.values(granted).every(
          value => value === PermissionsAndroid.RESULTS.GRANTED,
        );

        if (allGranted) {
          setPermissionsGranted(true);
          onGranted?.();
        } else {
          Alert.alert(
            'Permissões necessárias',
            'Você precisa conceder todas as permissões para usar o Bluetooth.',
          );
        }
      } catch (err) {
        console.warn('Erro ao solicitar permissões', err);
      }
    } else {
      setPermissionsGranted(true);
      onGranted?.();
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  return (
    !permissionsGranted && (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{ textAlign: 'center', color: '#222' }}>
          Aguardando permissões Bluetooth...
        </Text>
        <Button title='Verify Permissions' onPress={requestPermissions}></Button>
      </View>
    )
  );
};

export default BLEPermissions;