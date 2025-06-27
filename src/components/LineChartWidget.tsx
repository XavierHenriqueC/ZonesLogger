import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
} from 'react-native';
import { SensorDataType } from '../proto/SensorData';
import { getMinMaxAvg, getDateTime } from '../helpers/helpers';

import { Chart, Line, HorizontalAxis, VerticalAxis, XYValue, Tooltip } from 'react-native-responsive-linechart'
import DatePicker from './DatePicker';
import ModalView from './ModalView';

interface propsInterface {
    data: SensorDataType[]
}

const LineChartWidget: React.FC<propsInterface> = ({ data }) => {

    const [datePickerVisible, setDatePickerVisible] = useState<boolean>(false)

    const [tempData, setTempData] = useState<XYValue[]>([])
    const [humdData, setHumdData] = useState<XYValue[]>([])

    const handleData = (filterDates?: { initial: number | null, final: number | null }) => {

        console.log(filterDates)

        const tempArr = []
        const humdArr = []

        for (const dt of data) {

            if (filterDates && filterDates.initial && filterDates.final) {
                if (dt.timestamp < filterDates.initial || dt.timestamp > filterDates.final) {
                    continue
                }
            }

            const tempObj: XYValue = {
                x: dt.timestamp,
                y: dt.temperature
            }

            const humdObj: XYValue = {
                x: dt.timestamp,
                y: dt.humidity
            }

            tempArr.push(tempObj)
            humdArr.push(humdObj)
        }

        setTempData(tempArr)
        setHumdData(humdArr)
    }

    const handleFilterDate = (dates: { initial: number | null, final: number | null }) => {
        handleData(dates)
    }

    useEffect(() => {
        handleData()
    }, [])

    return (

        <View style={styles.container}>

            <>
                <View style={styles.chartContainer}>
                    <Chart
                        style={styles.chart}
                        padding={{ left: 40, bottom: 20, right: 40, top: 20 }}
                        xDomain={{ min: tempData.length > 0 ? getMinMaxAvg(tempData).minX : 0, max: tempData.length > 0 ? getMinMaxAvg(tempData).maxX : 0 }}
                        yDomain={{ min: 0, max: 100 }}
                    // viewport={{ initialOrigin: { x: 0, y: 0 }, size: { width: (getMinMaxAvg(tempData).minX + getMinMaxAvg(tempData).maxX / 2), height: 100 } }}
                    >
                        <VerticalAxis tickCount={5} theme={{ labels: { formatter: (v) => v.toFixed(1) } }} />
                        {tempData.length > 0 && <HorizontalAxis tickCount={3} theme={{ labels: { formatter: (v) => getDateTime(v) } }} />}
                        {
                            tempData.length > 0 &&
                            <Line
                                tooltipComponent={
                                    <Tooltip theme={{ label: { color: 'white' }, shape: { color: '#0f0' } }} />
                                }
                                data={tempData}
                                theme={{ stroke: { color: '#0f0', width: 2 }, scatter: { default: { width: 4, height: 4, rx: 2 } } }}
                                smoothing='bezier'
                            />
                        }
                        {
                            humdData.length > 0 &&
                            <Line
                                tooltipComponent={
                                    <Tooltip theme={{ label: { color: 'white' }, shape: { color: '#ffa502' } }} />
                                }
                                data={humdData}
                                theme={{ stroke: { color: '#ffa502', width: 2 }, scatter: { default: { width: 4, height: 4, rx: 2 } } }}
                                smoothing='bezier'
                            />
                        }
                    </Chart>

                    <View style={styles.legends}>
                        <View style={styles.legendUnit}>
                            <View style={[styles.tint, { backgroundColor: '#0f0' }]}></View>
                            <Text style={styles.legendLabel}>Temperature</Text>
                        </View>
                        <View style={styles.legendUnit}>
                            <View style={[styles.tint, { backgroundColor: '#ffa502' }]}></View>
                            <Text style={styles.legendLabel}>Humidity</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.statisticsContainer}>
                    <Text style={styles.statisticsHeader}>Statistics</Text>
                    <View style={styles.statisticsBody}>
                        <View style={styles.statisticsUnit}>
                            <Text style={styles.statisticsLabel}>Temperature</Text>
                            <Text style={styles.statisticsValue}>Min: {getMinMaxAvg(tempData).minY} °C</Text>
                            <Text style={styles.statisticsValue}>Max: {getMinMaxAvg(tempData).maxY} °C</Text>
                            <Text style={styles.statisticsValue}>Avg: {getMinMaxAvg(tempData).avgY} °C</Text>
                        </View>
                        <View style={styles.statisticsUnit}>
                            <Text style={styles.statisticsLabel}>Humidity</Text>
                            <Text style={styles.statisticsValue}>Min: {getMinMaxAvg(tempData).minY} %</Text>
                            <Text style={styles.statisticsValue}>Max: {getMinMaxAvg(tempData).maxY} %</Text>
                            <Text style={styles.statisticsValue}>Avg: {getMinMaxAvg(tempData).avgY} %</Text>
                        </View>
                    </View>
                </View>
                <Button title="Filter" onPress={() => setDatePickerVisible(true)} />
            </>

            <ModalView
                visible={datePickerVisible}
                setVisible={setDatePickerVisible}
                children={<DatePicker handleGetDate={(dates) => handleFilterDate(dates)} close={() => setDatePickerVisible(false)} ></DatePicker>}
            ></ModalView>
        </View>
    );
};

export default LineChartWidget;

const styles = StyleSheet.create({
    container: {
        minWidth: '100%',
    },
    chartContainer: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderRadius: 5,
    },
    chart: {
        height: 180,
        maxWidth: '100%',
        padding: 0,
        margin: 0
    },
    legends: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around'
    },
    legendUnit: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    tint: {
        width: 12,
        height: 12
    },
    legendLabel: {

    },

    statisticsContainer: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'column',
        minWidth: '100%'
    },
    statisticsHeader: {
        textAlign: 'center',
        minWidth: '100%',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    statisticsBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        minWidth: '100%'
    },
    statisticsUnit: {
        alignItems: 'center'
    },
    statisticsLabel: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    },
    statisticsValue: {
        color: '#fff',
        fontSize: 14
    },


});
