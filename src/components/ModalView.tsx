import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, Pressable, View, SafeAreaView } from 'react-native';


interface props {
    visible: boolean
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    children?: React.JSX.Element
}

const ModalView: React.FC<props> = ({ visible, setVisible, children }) => {

    return (
        <SafeAreaView style={styles.centeredView}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={() => {
                    Alert.alert('Modal has been closed.');
                    setVisible(!visible);
                }}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Pressable
                            style={styles.button}
                            onPress={() => setVisible(!visible)}>
                            <Text style={styles.textStyle}>X</Text>
                        </Pressable>
                        {children}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        marginVertical: 20,
        marginHorizontal: 15,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    button: {
        alignSelf: 'flex-end',
        paddingVertical: 6,
        paddingHorizontal: 10,
        elevation: 2,
        borderRadius: 2,
        backgroundColor: 'red',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    }
});

export default ModalView;