import React, { useEffect, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  Alert,
  Text,
  View,
  Button,
  StyleSheet
} from 'react-native';

type Props = {
  onGranted?: () => void;
};

const PermissionsPage: React.FC<Props> = ({ onGranted }) => {
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
      <View style={styles.container}>

        <View style={styles.center}>
          <View style={styles.logo}>
            <Text style={styles.textLogo}>ZONES</Text>
            <Text style={styles.textLogo}>LOGGER</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.text}>
            Aguardando permissões Bluetooth...
          </Text>

          <Button title='Verify Permissions' onPress={requestPermissions}></Button>
        </View>
      </View>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#006494',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 'auto',
    height: 'auto',
    padding: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10
  },
  textLogo: {
    color: "#fff",
    fontSize: 40,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  text: {
    textAlign: 'center',
    color: '#fff'
  },
  footer: {
    height: 'auto',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  }
})

export default PermissionsPage;