import { stringToUint8Array, uint8ArrayToString } from "./buffer";
import { FontMeta } from "./font";

export interface Glyph {
    character: string;

    width: number;
    height: number;

    xOffset: number;
    yOffset: number;

    layers: Uint8Array[];

    kernEntries: KernTableEntry[]
}

interface KernTableEntry {
    character: string;
    offset: number;
}

export function createGlyph(font: FontMeta, character: string): Glyph {
    const bufferLength = (((font.kernWidth + font.defaultWidth) * (font.ascenderHeight + font.defaultHeight + font.descenderHeight)) >> 3) + 1;
    return {
        character,
        width: font.kernWidth + font.defaultWidth,
        height: font.ascenderHeight + font.descenderHeight + font.defaultHeight,
        xOffset: 0,
        yOffset: 0,
        layers: [new Uint8Array(bufferLength), new Uint8Array(bufferLength)],
        kernEntries: []
    };
}

export function clearGlyph(g: Glyph) {
    return g.layers.map(l => new Uint8Array(l.length));
}

export function getPixel(g: Glyph, x: number, y: number, layer: number) {
    const cellIndex = x + g.width * y;
    const index = cellIndex >> 3;
    const offset = cellIndex & 7;
    const pixels = g.layers[layer];
    return !!((pixels[index] >> offset) & 1);
}

export function setPixel(g: Glyph, x: number, y: number, layer: number, on: boolean) {
    if (x < 0 || x >= g.width || y < 0 || y >= g.height) return;

    const cellIndex = x + g.width * y;
    const index = cellIndex >> 3;
    const offset = cellIndex & 7;

    const pixels = g.layers[layer];

    if (on) {
        pixels[index] |= (1 << offset);
    }
    else {
        pixels[index] &= ~(1 << offset);
    }
}

export function serializeGlyph(glyph: Glyph) {
    return JSON.stringify({
        ...glyph,
        layers: glyph.layers.map(pixels => btoa(uint8ArrayToString(pixels)))
    });
}

export function deserializeGlyph(encoded: string): Glyph {
    const parsed = JSON.parse(encoded);
    const result: Glyph = {
        ...parsed,
    };

    if (parsed.pixels) {
        result.layers = [stringToUint8Array(atob(parsed.pixels))];
        result.layers.push(new Uint8Array(result.layers[0].length));
        delete (result as any).pixels;
    }
    else if (parsed.layers) {
        result.layers = parsed.layers.map((l: string) => stringToUint8Array(atob(l)))
    }

    if (!result.kernEntries) {
        result.kernEntries = [];
    }

    return result;
}

export function shiftGlyph(glyph: Glyph, xShift: number, yShift: number) {
    const newGlyph = {
        ...glyph,
        layers: glyph.layers.map(l => new Uint8Array(l.length))
    };

    for (let x = 0; x < glyph.width; x++) {
        for (let y = 0; y < glyph.height; y++) {
            for (let i = 0; i < glyph.layers.length; i++) {
                if (getPixel(glyph, x, y, i)) {
                    setPixel(newGlyph, x + xShift, y + yShift, i, true);
                }
            }
        }
    }

    return newGlyph;
}