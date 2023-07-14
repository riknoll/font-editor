import { FontMeta } from "./font";

export interface Glyph {
    character: string;

    width: number;
    height: number;

    xOffset: number;
    yOffset: number;

    pixels: Uint8Array;
}

export function createGlyph(font: FontMeta, character: string): Glyph {
    return {
        character,
        width: font.kernWidth + font.defaultWidth,
        height: font.ascenderHeight + font.descenderHeight + font.defaultHeight,
        xOffset: 0,
        yOffset: 0,
        pixels: new Uint8Array((((font.kernWidth + font.defaultWidth) * (font.ascenderHeight + font.defaultHeight, font.descenderHeight)) << 3) + 1)
    };
}

export function getPixel(g: Glyph, x: number, y: number) {
    const cellIndex = x + g.width * y;
    const index = cellIndex >> 3;
    const offset = cellIndex & 7;
    return !!((g.pixels[index] >> offset) & 1);
}

export function setPixel(g: Glyph, x: number, y: number, on: boolean) {
    if (x < 0 || x >= g.width || y < 0 || y >= g.height) return;
    
    const cellIndex = x + g.width * y;
    const index = cellIndex >> 3;
    const offset = cellIndex & 7;

    if (on) {
        g.pixels[index] |= (1 << offset);
    }
    else {
        g.pixels[index] &= ~(1 << offset);
    }
}

export function serializeGlyph(glyph: Glyph) {
    return JSON.stringify({
        ...glyph,
        pixels: btoa(uint8ArrayToString(glyph.pixels))
    });
}

export function deserializeGlyph(encoded: string): Glyph {
    const parsed = JSON.parse(encoded);
    return {
        ...parsed,
        pixels: stringToUint8Array(atob(parsed.pixels))
    };
}

function uint8ArrayToString(input: ArrayLike<number>) {
    let len = input.length;
    let res = ""
    for (let i = 0; i < len; ++i)
        res += String.fromCharCode(input[i]);
    return res;
}

function stringToUint8Array(input: string) {
    let len = input.length;
    let res = new Uint8Array(len)
    for (let i = 0; i < len; ++i)
        res[i] = input.charCodeAt(i) & 0xff;
    return res;
}