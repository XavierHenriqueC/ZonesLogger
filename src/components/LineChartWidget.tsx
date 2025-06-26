import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Button,
    StyleSheet,
    ScrollView
} from 'react-native';
import { SensorDataType } from '../proto/SensorData';
import { getMinMaxAvg } from '../helpers/helpers';

import { Chart, Line, HorizontalAxis, VerticalAxis, XYValue, Tooltip } from 'react-native-responsive-linechart'

interface propsInterface {
    data: SensorDataType[]
}

const LineChartWidget: React.FC<propsInterface> = ({ data }) => {

    const [tempData, setTempData] = useState<XYValue[]>([])
    const [humdData, setHumdData] = useState<XYValue[]>([])

    const handleData = () => {

        const tempArr = []
        const humdArr = []

        for (const dt of data) {

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




    useEffect(() => {
        handleData()
    }, [])

    return (

        <View style={styles.container}>
            {tempData.length > 0 &&
                <>
                    <View style={styles.chartContainer}>
                        <Chart
                            style={styles.chart}
                            padding={{ left: 40, bottom: 20, right: 20, top: 20 }}
                            xDomain={{ min: getMinMaxAvg(tempData).minX, max: getMinMaxAvg(tempData).maxX }}
                            yDomain={{ min: 0, max: 100 }}
                            viewport={{ initialOrigin: { x: 0, y: 0 }, size: { width: (getMinMaxAvg(tempData).minX + getMinMaxAvg(tempData).maxX / 2), height: 100 } }}
                        >
                            <VerticalAxis tickCount={5} theme={{ labels: { formatter: (v) => v.toFixed(1) } }} />
                            <HorizontalAxis tickCount={5} />
                            <Line
                                tooltipComponent={
                                    <Tooltip theme={{ label: { color: 'white' }, shape: { color: '#0f0' } }} />
                                }
                                data={tempData}
                                theme={{ stroke: { color: '#0f0', width: 2 }, scatter: { default: { width: 4, height: 4, rx: 2 } } }}
                                smoothing='cubic-spline'
                            />
                            {
                                humdData && humdData.length > 0 &&
                                <Line
                                    tooltipComponent={
                                        <Tooltip theme={{ label: { color: 'white' }, shape: { color: '#ffa502' } }} />
                                    }
                                    data={humdData}
                                    theme={{ stroke: { color: '#ffa502', width: 2 }, scatter: { default: { width: 4, height: 4, rx: 2 } } }}
                                    smoothing='cubic-spline'
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
                </>
            }
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
        height: 220,
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
        paddingVertical: 10,
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
