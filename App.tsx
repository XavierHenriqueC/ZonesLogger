// import React, { useEffect } from 'react';
// import {
//   SafeAreaView,
//   View,
//   Text,
//   StyleSheet
// } from 'react-native';

// function App(): React.JSX.Element {

//   useEffect(() => {
//     console.log('Teste')
//   },[])

//   return (
//     <SafeAreaView >
//       <View>
//         <Text>Hello</Text>
//       </View>
//     </SafeAreaView>
//   );
// }

// export default App;

import React, { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import BLEPermissions from './src/components/BLEPermissions';
import BLEScanner from './src/components/BLEScanner';
import TemperatureSensor from './src/components/TemperatureSensor';

const App: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BLEPermissions onGranted={() => setHasPermission(true)} />
      {hasPermission && (
        <TemperatureSensor></TemperatureSensor>
      )}
    </SafeAreaView>
  );
};

export default App;
