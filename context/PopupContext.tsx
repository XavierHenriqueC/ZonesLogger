import React, { createContext, useCallback, useContext, useState } from 'react';

type PopupType = 'success' | 'error' | 'info';

interface PopupMessage {
  message: string;
  type: PopupType;
}

interface PopupContextData {
  showMessage: (message: string, type?: PopupType) => void;
  hideMessage: () => void
}

const PopupContext = createContext<PopupContextData | undefined>(undefined);

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [popup, setPopup] = useState<PopupMessage | null>(null);

  const showMessage = useCallback((message: string, type: PopupType = 'info') => {
    setPopup({ message, type });
    setTimeout(() => setPopup(null), 3000);
  }, []);

  const hideMessage = () => {
    setPopup(null)
  }

  return (
    <PopupContext.Provider value={{ showMessage, hideMessage }}>
      {children}
      {popup && <Popup message={popup.message} type={popup.type} />}
    </PopupContext.Provider>
  );
};

export const usePopup = (): PopupContextData => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup deve ser usado dentro de um PopupProvider');
  }
  return context;
};

// Componente interno para exibir o popup
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

const Popup: React.FC<PopupMessage> = ({ message, type }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
        }).start();
      }, 2500);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, styles[type], { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -40 }],
    width: 300,
    padding: 12,
    borderRadius: 8,
    zIndex: 100,
    alignItems: 'center',
    height: 'auto'
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
