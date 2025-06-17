import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { usePopUp } from '../hooks/usePopup';

type PopupType = 'success' | 'error' | 'info';

const PopUp: React.FC = () => {
    const { subscribe } = usePopUp();
    const [message, setMessage] = useState<string>('');
    const [type, setType] = useState<PopupType>('info');
    const [visible, setVisible] = useState<boolean>(false);
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribe = subscribe(({ message, type }) => {

            setMessage(message);
            setType(type);
            setVisible(true);

            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setTimeout(() => {
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }).start(() => setVisible(false));
                }, 3000);
            });
        });

        return unsubscribe;
    }, [opacity, subscribe]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, styles[type], { opacity }]}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        alignSelf: 'center',
        padding: 12,
        borderRadius: 8,
        zIndex: 1000,
        minWidth: '60%',
        alignItems: 'center',
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
    },
    success: {
        backgroundColor: '#4CAF50',
    },
    error: {
        backgroundColor: '#F44336',
    },
    info: {
        backgroundColor: '#2196F3',
    },
});

export default PopUp;
