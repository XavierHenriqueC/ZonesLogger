
// BleContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';


interface BleContextType {
    bleManagerEmitter: NativeEventEmitter;
    BleManager: typeof BleManager;
    radioState: boolean;
    requestRadioEnable: () => void;
}

const BleContext = createContext<BleContextType | undefined>(undefined);

export const BleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [radioState, setRadioState] = useState<boolean>(false)

    const BleManagerModule = NativeModules.BleManager;
    const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

    useEffect(() => {

        // Checa se bluetooth esta ligado
        BleManager.checkState();

        //Inicia Serviço
        BleManager.start({ showAlert: false });

        //Função para verificar estado do radio
        const handleRadioStateChange = (args: { state: string }) => {
            if (args.state === 'on') {
                setRadioState(true)
            } else {
                setRadioState(false)
            }
        }

        //Evento para verificar estado do radio
        const updateState = bleManagerEmitter.addListener(
            'BleManagerDidUpdateState',
            handleRadioStateChange
        );

        return () => {
            updateState.remove();
        };
    }, []);

    useEffect(() => {
        requestRadioEnable()
    },[radioState])

    const requestRadioEnable = () => {
        if(!radioState){
            BleManager.enableBluetooth()
        }
    }


    return (
        <BleContext.Provider value={{
            //Insira as variveis disponiveis aqui
            BleManager,
            bleManagerEmitter,
            radioState,
            requestRadioEnable,
        }}>
            {children}
        </BleContext.Provider>
    );
};

export const useBle = () => {
    const context = useContext(BleContext);
    if (!context) throw new Error('useBle must be used within a BleProvider');
    return context;
};
