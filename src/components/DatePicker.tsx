import React, { useEffect, useState } from 'react';
import { View, Button, Platform, Text, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface props {
  handleGetDate?: (dates: { initial: number | null, final: number | null }) => void
  close: () => void
}

const DatePicker: React.FC<props> = ({ handleGetDate, close }) => {

  const [custom, setCustom] = useState(false)

  const [initialDate, setInitialDate] = useState(new Date());
  const [finalDate, setFinalDate] = useState(new Date());
  const [input, setInput] = useState<'initial' | 'final'>('initial');
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const [error, setError] = useState(false)


  const handleLastTime = (code: "last_hour" | "last_day" | "last_week" | "last_month") => {

    let initial: number | null = null
    let final: number = parseInt((new Date().getTime() / 1000).toString())

    switch (code) {
      case 'last_hour':

        initial = Math.floor((Date.now() - 1 * 60 * 60 * 1000) / 1000) //Segundos
        break;

      case 'last_day':

        initial = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000) //Segundos
        break;
        
      case 'last_week':

        initial = Math.floor((Date.now() - 168 * 60 * 60 * 1000) / 1000) //Segundos
        break;

      case 'last_month':

        initial = Math.floor((Date.now() - 720 * 60 * 60 * 1000) / 1000) //Segundos
        break;

      default:
        break;
    }

    if (handleGetDate) {
      handleGetDate({ initial, final })
      close()
    }
  }

  const onChange = (event: any, selectedDate?: Date) => {
    setError(false)
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      if (input === 'initial') {
        setInitialDate(selectedDate);
      } else {
        setFinalDate(selectedDate);
      }
    }
  };

  const showMode = (currentMode: 'date' | 'time', input: 'initial' | 'final') => {
    setInput(input)
    setShow(true);
    setMode(currentMode);
  };

  const handleSave = () => {

    const initial = parseInt((new Date(initialDate).getTime() / 1000).toString()) //Segundos
    const final = parseInt((new Date(finalDate).getTime() / 1000).toString())  //Segundos

    if (initial > final) {
      setError(true)
      return
    }

    if (handleGetDate) {
      handleGetDate({ initial, final })
      close()
    }

  }

  const handleClarAllFilters = () => {
    if (handleGetDate) {
      handleGetDate({ initial: null, final: null })
      close()
    }
  }

  useEffect(() => {

    const timeout = setTimeout(() => {
      if (error) {
        setError(false)
      }
    }, 5000)

    return () => clearTimeout(timeout)

  }, [error])

  return (
    <View style={styles.container}>

      {!custom ? (
        <View style={styles.mainButtons}>
          <Button title="Last hour" onPress={() => handleLastTime('last_hour')} />
          <Button title="Last day" onPress={() => handleLastTime('last_day')} />
          <Button title="Last week" onPress={() => handleLastTime('last_week')} />
          <Button title="Last month" onPress={() => handleLastTime('last_month')} />
          <Button title="Custom" onPress={() => setCustom(true)} />
          <Button title="Clear all filters" onPress={handleClarAllFilters} />
        </View>
      ) : (
        <>
          <View style={styles.unit}>
            <Text style={{ fontWeight: 'bold' }}>Initial:</Text>
            <Text style={styles.text}>{initialDate.toLocaleString('br-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={styles.buttons}>
              <Button title="Change Date" onPress={() => showMode('date', 'initial')} />
              <Button title="Change Time" onPress={() => showMode('time', 'initial')} />
            </View>
          </View>
          <View style={styles.unit}>
            <Text style={{ fontWeight: 'bold' }}>Final:</Text>
            <Text style={styles.text}>{finalDate.toLocaleString('br-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={styles.buttons}>
              <Button title="Change Date" onPress={() => showMode('date', 'final')} />
              <Button title="Change Time" onPress={() => showMode('time', 'final')} />
            </View>
          </View>
          <View style={styles.mainButtons}>
            <Button title="Save" onPress={handleSave} />
            <Button title="Cancel" onPress={() => close()} />
          </View>
          <View style={{ minWidth: 180, minHeight: 30 }}>
            {error && <Text style={styles.error}>{"Invalid date: Initial > Final!"}</Text>}
          </View>
        </>
      )

      }

      {
        show && (
          <DateTimePicker
            value={input === 'initial' ? initialDate : finalDate}
            mode={mode}
            display={mode === 'time' ? "spinner" : 'calendar'}
            onChange={onChange}
          />
        )
      }
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    gap: 20
  },
  mainButtons: {
    gap: 8,
    paddingVertical: 10
  },
  unit: {
    gap: 5
  },
  buttons: {
    flexDirection: 'row',
    gap: 10
  },
  text: {
    fontSize: 18,
    marginBottom: 5,
    textAlign: 'center',
  },
  clearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  error: {
    color: 'red'
  }
});

export default DatePicker;
