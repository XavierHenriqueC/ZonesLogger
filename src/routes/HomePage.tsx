import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Button,
    BackHandler
} from 'react-native';
import ScanPage from './ScanPage';
import HistoryPage from './HistoryPage';

interface propsInterface {

}

const HomePage: React.FC<propsInterface> = ({ }) => {

    const [screen, setScreen] = useState<number>(0)

    const handleNav = (screen: number) => {
        setScreen(screen)
    }

    useEffect(() => {
        setScreen(0)

        const backAction = () => {
            setScreen(0)
            return true
        }

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove(); // limpa o listener ao desmontar
    }, [])

    return (
        <View style={styles.container}>

            {/* HomePage */}
            {screen === 0 &&
                <>
                    <View style={styles.center}>
                        <View style={styles.logo}>
                            <Text style={styles.textLogo}>ZONES</Text>
                            <Text style={styles.textLogo}>LOGGER</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Button title='Scan Devices' onPress={() => handleNav(1)}></Button>
                        <Button title='History' onPress={() => handleNav(2)}></Button>
                    </View>
                </>
            }
            
            {/* ScanPage */}
            {screen === 1 &&
                <ScanPage></ScanPage>
            }

            {/* HistoryPage */}
            {screen === 2 &&
                <HistoryPage></HistoryPage>
            }


        </View>
    );
};

export default HomePage;

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