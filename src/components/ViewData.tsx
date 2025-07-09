import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Button,
    StyleSheet,
    FlatList,
    ListRenderItem,
} from 'react-native';
import { SensorDataType } from '../proto/SensorData';
import { usePopup } from '../../context/PopupContext';
import LineChartWidget from './LineChartWidget';
import { getDateTime } from '../helpers/helpers';

interface propsInterface {
    data: SensorDataType[]
    cancel: () => void
}

const ViewData: React.FC<propsInterface> = ({ data, cancel }) => {

    const [screen, setScreen] = useState<number>(0)
    const { showMessage, hideMessage } = usePopup();

    const renderItem: ListRenderItem<SensorDataType> = ({ item }) => (
        <View style={styles.row}>
            <Text style={[styles.rowText]}>{getDateTime(item.timestamp)}</Text>
            <Text style={[styles.rowText]}>{item.temperature.toFixed(1)} °C</Text>
            <Text style={[styles.rowText]}>{item.humidity.toFixed(1)} %</Text>
        </View>
    );

    const handleNav = (screen: number) => {
        setScreen(screen)
        hideMessage()
    }

    useEffect(() => {
        data.sort((a, b) => b.timestamp - a.timestamp)
    },[data])

    return (
        <>
            {/* Table Page */}
            {screen === 0 &&
                <>
                    <View style={styles.body}>
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderText}>Timestamp</Text>
                            <Text style={styles.listHeaderText}>Temperature</Text>
                            <Text style={styles.listHeaderText}>Humidity</Text>
                        </View>
                        <FlatList
                            style={styles.list}
                            data={data}
                            keyExtractor={(item) => item.timestamp.toString()}
                            renderItem={renderItem}
                        />
                    </View>
                    <View style={styles.buttons}>
                        <Button title="Cancel" onPress={cancel} />
                        <Button title="Trends and Statistics" onPress={() => handleNav(1)} />
                    </View>
                </>
            }

            {/*Trend e Statistics Page */}
            {screen === 1 &&
                <>
                    <View style={styles.body}>
                        <LineChartWidget data={data}></LineChartWidget>
                    </View>
                    <View style={styles.buttons}>
                        <Button title="Cancel" onPress={() => handleNav(0)} />
                    </View>

                </>
            }

        </>
    );
};

export default ViewData;

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingVertical: 10,
    },
    buttons: {
        minWidth: '100%',
        justifyContent: 'space-between',
        height: 'auto',
        flexDirection: 'column',
        gap: 10
    },

    listHeader: {
        flexDirection: 'row',
        minWidth: '100%',
        paddingVertical: 10,
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: '#00BFFF',
        alignItems: 'center'
    },
    listHeaderText: {
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },

    list: {
        minWidth: '100%'
    },
    row: {
        flexDirection: 'row',
        minWidth: '100%',
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#00BFFF',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    rowText: {
        textAlign: 'center',
        color: '#fff',
    },
    id: {
        color: '#fff'
    },
    rssi: {
        color: '#fff'
    },
    text: {
        textAlign: 'center',
        marginTop: 5,
        color: '#fff'
    }
});
