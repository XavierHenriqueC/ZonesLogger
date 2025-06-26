import { XYValue } from "react-native-responsive-linechart";

export interface Position {
    id: string;
    x: number;
    y: number;
}

export const random = (a: number, b: number, c: number, d: number) => {

    if (b >= c) {
        throw new Error("O intervalo [B, C] deve ser inválido (ou seja, B < C)");
    }

    const intervalo1 = b - a + 1;
    const intervalo2 = d - c + 1;
    const total = intervalo1 + intervalo2;

    const escolha = Math.floor(Math.random() * total);

    if (escolha < intervalo1) {
        return Number(a + escolha);
    } else {
        return Number(c + (escolha - intervalo1));
    }
}

export const generateBeaconAnimatedPositions = (): Position => {
    const minX1 = 60
    const maxX1 = 110
    const minX2 = 183
    const maxX2 = 240

    const minY1 = 40
    const maxY1 = 60
    const minY2 = 142
    const maxY2 = 200
    const position = { x: random(minX1, maxX1, minX2, maxX2), y: random(minY1, maxY1, minY2, maxY2), id: '' }
    return position
}

export const getMinMaxAvg = (points: XYValue[]) => {
    if (points.length === 0) {
        throw new Error("O array de pontos está vazio.");
    }

    let maxX = points[0].x;
    let minX = points[0].x;
    let maxY = points[0].y;
    let minY = points[0].y;

    let sumX = 0;
    let sumY = 0;

    for (const point of points) {
        if (point.x > maxX) maxX = point.x;
        if (point.x < minX) minX = point.x;
        if (point.y > maxY) maxY = point.y;
        if (point.y < minY) minY = point.y;

        sumX += point.x;
        sumY += point.y

    }

    let avgX = (sumX/points.length).toFixed(1);
    let avgY = (sumY/points.length).toFixed(1);

    return { maxX, minX, maxY, minY, avgX, avgY };
}
