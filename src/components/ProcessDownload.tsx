import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Button,
    StyleSheet,
    TextInput,
} from 'react-native';

interface propsInterface {
    process: { current: number, total: number }
    error: string | null
}

const ProcessDownload: React.FC<propsInterface> = ({ process, error }) => {

    return (
        <>
            <View style={styles.background}></View>
            <View style={styles.center}>
                <Text>{`Download Logs`}</Text>
                <Text>{`${process.current} / ${process.total}`}</Text>
            </View>
        </>
        

    );
};

export default ProcessDownload;

const styles = StyleSheet.create({
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        minWidth: '120%',
        minHeight: '120%',
        backgroundColor: '#fff',
        opacity: 0.7,
        zIndex: 100,
    },
    center: {
        position: 'absolute',
        top: '50%',
        left: "50%",
        transform: 'translate(-47%, -50%)',
        minWidth: 300,
        minHeight: 100,
        borderRadius: 10,
        backgroundColor: '#fff',
        zIndex: 101,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
