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
