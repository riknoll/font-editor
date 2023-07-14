import { NumberFormat, hexToUint8Array, setNumber, uint8ArrayToHex } from "./buffer";
import { createGlyph, deserializeGlyph, getPixel, Glyph, serializeGlyph, setPixel } from "./glyph";

export interface FontMeta {
    monospace?: boolean;

    // Default width of a glyph, excluding the kern width
    defaultWidth: number;

    // Default height of a glyph, excluding the ascender/descender
    defaultHeight: number;

    // Number of pixels a glyph can extend past the baseline
    descenderHeight: number;

    // Number of pixels a glyph can extend past the top line
    ascenderHeight: number;

    // Number of pixels a glyph can extend past the left line
    kernWidth: number;

    // Height of lowercase letters (used for guidelines)
    xHeight: number;

    // Spacing in between letters
    letterSpacing: number;

    // The width of the space character
    wordSpacing: number;
}

const defaultCharacters = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!:;"'*+-=<>()[]{}/\\#$%&@^_\`|~`;

export class Font {
    glyphs: Glyph[];

    constructor(public meta: FontMeta, glyphs?: Glyph[]) {
        if (glyphs) {
            this.glyphs = glyphs;
            return;
        }

        this.glyphs = [];

        for (const char of defaultCharacters) {
            this.glyphs.push(createGlyph(meta, char));
        }
    }

    updateGlyph(glyph: Glyph) {
        return new Font(this.meta, this.glyphs.map(g => g.character === glyph.character ? glyph : g));
    }
}

export function serializeFont(font: Font) {
    return JSON.stringify({
        meta: font.meta,
        glyphs: font.glyphs.map(serializeGlyph)
    });
}

export function deserializeFont(data: string) {
    const parsed = JSON.parse(data);

    return new Font(parsed.meta, parsed.glyphs.map(deserializeGlyph));
}

const MAGIC = 0x68f119db;

/**
 * Encoded font format
 *
 * Follows the structure of Header -> Lookup Table -> Bitmaps
 *
 * Every character in the font gets an entry in the lookup table
 * that contains glyph metadata and points to the bitmap location.
 * The address of the entry for each character is relative to the
 * first character in the font range. Bitmaps are encoded in F4
 * 1 bpp format, but don't include the header
 *
 * Header (12 bytes):
 *  [0..3] magic
 *  [4..5] font range start
 *  [6..7] font range ended
 *  [8]    line height
 *  [9]    baseline offset
 *  [10]   letter spacing
 *  [11]   word spacing
 * LookupTableEntry (7 bytes):
 *  [0]    char width
 *  [1]    bitmap width
 *  [2]    bitmap height
 *  [3]    char x offset (signed, relative to left line)
 *  [4]    char y offset (signed, relative to baseline)
 *  [5..6] pixel data start (relative to bitmap section start)
 */
export function hexEncodeFont(font: Font) {
    let minChar = font.glyphs[0].character.charCodeAt(0);
    let maxChar = font.glyphs[0].character.charCodeAt(0);

    for (const glyph of font.glyphs) {
        minChar = Math.min(minChar, glyph.character.charCodeAt(0));
        maxChar = Math.max(maxChar, glyph.character.charCodeAt(0));
    }

    const numGlyphs = maxChar - minChar + 1;

    const headerBuf = new Uint8Array(12 + 7 * numGlyphs);

    setNumber(headerBuf, NumberFormat.UInt32LE, 0, MAGIC);
    setNumber(headerBuf, NumberFormat.UInt16LE, 4, minChar);
    setNumber(headerBuf, NumberFormat.UInt16LE, 6, maxChar);
    setNumber(headerBuf, NumberFormat.UInt8LE, 8, font.meta.ascenderHeight + font.meta.defaultHeight + font.meta.descenderHeight);
    setNumber(headerBuf, NumberFormat.UInt8LE, 9, font.meta.ascenderHeight + font.meta.defaultHeight);
    setNumber(headerBuf, NumberFormat.UInt8LE, 10, font.meta.letterSpacing);
    setNumber(headerBuf, NumberFormat.UInt8LE, 11, font.meta.wordSpacing);

    let pixelBytes = 0;
    const bitmaps = [];
    for (let i = 0; i < numGlyphs; i++) {
        const glyph = font.glyphs.find(g => g.character.charCodeAt(0) === minChar + i);
        if (!glyph) continue;

        const trimmed = trimGlyph(glyph, font);

        if (!trimmed) continue;

        const [trimmedGlyph, pixels] = trimmed;

        bitmaps.push(pixels);

        const offset = 12 + 7 * i;
        setNumber(headerBuf, NumberFormat.UInt8LE, offset, trimmedGlyph.width + trimmedGlyph.xOffset);
        setNumber(headerBuf, NumberFormat.UInt8LE, offset + 1, trimmedGlyph.width);
        setNumber(headerBuf, NumberFormat.UInt8LE, offset + 2, trimmedGlyph.height);
        setNumber(headerBuf, NumberFormat.Int8LE, offset + 3, trimmedGlyph.xOffset);
        setNumber(headerBuf, NumberFormat.Int8LE, offset + 4, trimmedGlyph.yOffset);
        setNumber(headerBuf, NumberFormat.UInt16LE, offset + 5, pixelBytes);

        pixelBytes += pixels.length;
    }

    const outBuffer = new Uint8Array(headerBuf.length + pixelBytes);
    outBuffer.set(headerBuf, 0);

    let offset = 0;
    for (const bitmap of bitmaps) {
        outBuffer.set(bitmap, headerBuf.length + offset);
        offset += bitmap.length;
    }

    return uint8ArrayToHex(outBuffer);
}

function trimGlyph(glyph: Glyph, font: Font): [Glyph, Uint8Array] | undefined {
    let minX = glyph.width;
    let maxX = 0;
    let minY = glyph.height;
    let maxY = 0;

    let hasPixel = false;
    for (let x = 0; x < glyph.width; x++) {
        for (let y = 0; y < glyph.height; y++) {
            if (getPixel(glyph, x, y)) {
                minX = Math.min(x, minX);
                minY = Math.min(y, minY);
                maxX = Math.max(x, maxX);
                maxY = Math.max(y, maxY);
                hasPixel = true;
            }
        }
    }

    if (!hasPixel) return undefined;

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    const newGlyph: Glyph = {
        character: glyph.character,
        width,
        height,
        pixels: null as any,
        xOffset: minX - font.meta.kernWidth,
        yOffset: minY - (font.meta.ascenderHeight + font.meta.defaultHeight)
    };

    const encoded = f4EncodeImg(newGlyph.width, newGlyph.height, (x, y) => getPixel(glyph, minX + x, minY + y) ? 1 : 0);

    return [newGlyph, encoded];
}

function byteHeight(h: number) {
    return (h + 7) >> 3
}


function f4EncodeImg(w: number, h: number, getPix: (x: number, y: number) => number) {
    const columnBytes = byteHeight(h);
    const out = new Uint8Array(w * columnBytes);

    for (let x = 0; x < w; x++) {
        for (let y  = 0; y < h; y++) {
            if (getPix(x, y)) {
                const index = columnBytes * x + (y >> 3);
                const mask = 1 << (y & 7)
                out[index] |= mask;
            }
        }
    }
    return out;
}