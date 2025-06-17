import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Image,
    Animated,
    Easing,
} from 'react-native';
import { Peripheral } from 'react-native-ble-manager';

interface propsComponent {
    enableAnimation: boolean
    devices: Peripheral[]
}

const ScanAnimation: React.FC<propsComponent> = ({ enableAnimation, devices }) => {

    const [enable, setEnable] = useState(false);

    const wave1 = useRef(new Animated.Value(0)).current;
    const wave2 = useRef(new Animated.Value(0)).current;
    const wave3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (enableAnimation) {
            setEnable(true)
        } else {
            setEnable(false)
        }
    }, [enableAnimation])

    const createWaveAnimation = (animatedValue: Animated.Value, delay: number) => {
        return Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        );
    };

    useEffect(() => {
        let animations: Animated.CompositeAnimation[] = [];

        if (enable) {
            animations = [
                createWaveAnimation(wave1, 0),
                createWaveAnimation(wave2, 600),
                createWaveAnimation(wave3, 1200),
            ];
            animations.forEach((anim) => anim.start());
        } else {
            wave1.setValue(0);
            wave2.setValue(0);
            wave3.setValue(0);
        }

        return () => {
            animations.forEach((anim) => anim.stop?.());
        };
    }, [enable]);

    const renderWave = (animatedValue: Animated.Value) => {
        const scale = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 2],
        });

        const opacity = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 0],
        });

        return (
            <Animated.View
                style={[
                    styles.wave,
                    {
                        transform: [{ scale }],
                        opacity,
                    },
                ]}
            />
        );
    };

    const random = (min:number, max:number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    return (
        <View style={styles.container}>
            <View style={styles.centered}>
                {renderWave(wave1)}
                {renderWave(wave2)}
                {renderWave(wave3)}
                <Image
                    source={require('../../assets/smartphone.png')}
                    style={styles.phone}
                    resizeMode="contain"
                />
            </View>
            {devices.length > 0 && devices.map(() => (
                <Image
                source={require('../../assets/beacon.png')}
                style={[styles.beacon, {top: random(20,200), left: random(30,250)}]}
                resizeMode="contain"
            />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    centered: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    phone: {
        width: 60,
        height: 160,
        position: 'absolute',
    },
    wave: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 2,
        borderColor: '#00BFFF',
    },
    beacon: {
        width: 30,
        height: 30,
        position: 'absolute',
        top: 150, // 20 a 200
        left: 30 //30 a 250
    }
});

export default ScanAnimation;
