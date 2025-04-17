import { NumberFormat, setNumber, uint8ArrayToHex } from "./buffer";
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

    // The space to put in between lines of text
    lineSpacing: number;

    // If true, each glyph can use two colors
    twoTone: boolean;
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

    if (!parsed.meta.lineSpacing) {
        parsed.meta.lineSpacing = 0;
    }

    return new Font(parsed.meta, parsed.glyphs.map(deserializeGlyph));
}

export function changeFontMeta(font: Font, newMeta: FontMeta) {
    const newGlyphs: Glyph[] = [];

    const oldBase = font.meta.ascenderHeight + font.meta.defaultHeight;
    const newBase = newMeta.ascenderHeight + newMeta.defaultHeight;

    const yShift = newBase - oldBase;
    const xShift = newMeta.kernWidth - font.meta.kernWidth;

    for (const glyph of font.glyphs) {
        const newGlyph = createGlyph(newMeta, glyph.character);

        for (let x = 0; x < glyph.width; x++) {
            for (let y = 0; y < glyph.height; y++) {
                for (let i = 0; i < glyph.layers.length; i++) {
                    if (!getPixel(glyph, x, y, i)) continue;

                    setPixel(newGlyph, x + xShift, y + yShift, i, true);
                }
            }
        }

        newGlyphs.push(newGlyph);
    }

    return new Font(newMeta, newGlyphs);
}

// legacy
const V1_FONT_MAGIC = 0x68f119db;

const V2_FONT_MAGIC = 0x68f119dc;
const V2_DUAL_TONE_FONT_MAGIC = 0x68f119dd;

/**
 * Encoded font format
 *
 * Follows the structure of Header -> Lookup Table -> Bitmaps
 *
 * Every character in the font gets an entry in the lookup table
 * that contains glyph metadata and points to the bitmap location.
 * Lookup table is sorted by char code. Bitmaps are encoded in F4
 * 1 bpp format, but don't include the header
 *
 * Bitmap data length = width * ((height + 7) >> 3)
 *
 * V1 format:
 * Header (12 bytes):
 *  [0..3]   magic
 *  [4..5]   number of characters
 *  [6]      line height
 *  [7]      baseline offset
 *  [8]      letter spacing
 *  [9]      word spacing
 *  [10..11] byte length of longest bitmap
 * LookupTableEntry (4 bytes):
 *  [0..1]   character code
 *  [2..3]   bitmap entry offset
 * BitmapEntry (5 + N bytes)
 *  [0]      char width
 *  [1]      bitmap width
 *  [2]      bitmap height
 *  [3]      char x offset (signed, relative to left line)
 *  [4]      char y offset (signed, relative to baseline)
 *  [5..N]   pixel data
 *
 * V2 format:
 * Header (13 bytes):
 *  [0..3]   magic
 *  [4..5]   number of characters
 *  [6]      line height
 *  [7]      baseline offset
 *  [8]      letter spacing
 *  [9]      word spacing
 *  [10]     line spacing
 *  [11..12] byte length of longest bitmap
 * LookupTableEntry (4 bytes):
 *  [0..1]   character code
 *  [2..3]   bitmap entry offset
 * BitmapEntry (6 + N bytes)
 *  [0]      char width
 *  [1]      bitmap width
 *  [2]      bitmap height
 *  [3]      char x offset (signed, relative to left line)
 *  [4]      char y offset (signed, relative to baseline)
 *  [5]      length of kern table
 *  [6..N]   kern table entries
 *  [N..N']  pixel data (layer 0)
 *  [M..M']  pixel data (layer 1) (if two-tone font)
 * KernTableEntry (3 bytes)
 *  [0..1]   character code
 *  [2]      offset (signed)
 */

export function hexEncodeFont(font: Font) {
    const glyphs = (font.glyphs
        .map(g => trimGlyph(g, font))
        .filter(e => !!e) as ([Glyph, Uint8Array[]])[])
        .sort((a, b) => a[0].character.charCodeAt(0) - b[0].character.charCodeAt(0));

    const numGlyphs = glyphs.length;
    const headerBuf = new Uint8Array(13 + 4 * numGlyphs);

    setNumber(headerBuf, NumberFormat.UInt32LE, 0, font.meta.twoTone ? V2_DUAL_TONE_FONT_MAGIC : V2_FONT_MAGIC);
    setNumber(headerBuf, NumberFormat.UInt16LE, 4, numGlyphs);
    setNumber(headerBuf, NumberFormat.UInt8LE, 6, font.meta.ascenderHeight + font.meta.defaultHeight + font.meta.descenderHeight);
    setNumber(headerBuf, NumberFormat.UInt8LE, 7, font.meta.ascenderHeight + font.meta.defaultHeight);
    setNumber(headerBuf, NumberFormat.UInt8LE, 8, font.meta.letterSpacing);
    setNumber(headerBuf, NumberFormat.UInt8LE, 9, font.meta.wordSpacing);
    setNumber(headerBuf, NumberFormat.UInt8LE, 10, font.meta.lineSpacing);

    let pixelBytes = 0;
    let maxLength = 0;
    const bitmaps = [];
    for (let i = 0; i < numGlyphs; i++) {
        const offset = 13 + 4 * i;
        const [trimmedGlyph, layers] = glyphs[i];

        setNumber(headerBuf, NumberFormat.UInt16LE, offset, trimmedGlyph.character.charCodeAt(0));
        setNumber(headerBuf, NumberFormat.UInt16LE, offset + 2, pixelBytes);

        const bitmapLength = trimmedGlyph.width * ((trimmedGlyph.height + 7) >> 3)
        maxLength = Math.max(bitmapLength, maxLength);

        let bitmapEntryLength = 6 + bitmapLength + trimmedGlyph.kernEntries.length * 3;

        if (font.meta.twoTone) {
            bitmapEntryLength += bitmapLength;
        }
        const bitmapEntry = new Uint8Array(bitmapEntryLength)

        bitmaps.push(bitmapEntry);

        setNumber(bitmapEntry, NumberFormat.UInt8LE, 0, trimmedGlyph.width + trimmedGlyph.xOffset);
        setNumber(bitmapEntry, NumberFormat.UInt8LE, 1, trimmedGlyph.width);
        setNumber(bitmapEntry, NumberFormat.UInt8LE, 2, trimmedGlyph.height);
        setNumber(bitmapEntry, NumberFormat.Int8LE, 3, trimmedGlyph.xOffset);
        setNumber(bitmapEntry, NumberFormat.Int8LE, 4, trimmedGlyph.yOffset);
        setNumber(bitmapEntry, NumberFormat.UInt8LE, 5, trimmedGlyph.kernEntries.length);

        for (let kernIndex = 0; kernIndex < trimmedGlyph.kernEntries.length; kernIndex++) {
            const entry = trimmedGlyph.kernEntries[kernIndex];
            const index = 6 + kernIndex * 3;
            setNumber(bitmapEntry, NumberFormat.UInt16LE, index, entry.character.charCodeAt(0));
            setNumber(bitmapEntry, NumberFormat.Int8LE, index + 2, entry.offset);
        }

        const bitmapStart = 6 + trimmedGlyph.kernEntries.length * 3;

        bitmapEntry.set(layers[0], bitmapStart);

        if (font.meta.twoTone) {
            bitmapEntry.set(layers[1], bitmapStart + bitmapLength);
        }

        pixelBytes += bitmapEntry.length;
    }

    setNumber(headerBuf, NumberFormat.UInt16LE, 11, maxLength);

    const outBuffer = new Uint8Array(headerBuf.length + pixelBytes);
    outBuffer.set(headerBuf, 0);

    let offset = 0;
    for (const bitmap of bitmaps) {
        outBuffer.set(bitmap, headerBuf.length + offset);
        offset += bitmap.length;
    }

    return uint8ArrayToHex(outBuffer);
}

export function trimGlyph(glyph: Glyph, font: Font): [Glyph, Uint8Array[]] | undefined {
    let minX = glyph.width;
    let maxX = 0;
    let minY = glyph.height;
    let maxY = 0;

    let hasPixel = false;
    for (let x = 0; x < glyph.width; x++) {
        for (let y = 0; y < glyph.height; y++) {
            for (let i = 0; i < glyph.layers.length; i++) {
                if (getPixel(glyph, x, y, i)) {
                    minX = Math.min(x, minX);
                    minY = Math.min(y, minY);
                    maxX = Math.max(x, maxX);
                    maxY = Math.max(y, maxY);
                    hasPixel = true;
                }
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
        layers: glyph.layers.map(l => new Uint8Array(width * byteHeight(height))),
        xOffset: minX - font.meta.kernWidth,
        yOffset: minY - (font.meta.ascenderHeight + font.meta.defaultHeight),
        kernEntries: glyph.kernEntries.slice()
    };

    for (let x = 0; x < glyph.width; x++) {
        for (let y = 0; y < glyph.height; y++) {
            for (let i = 0; i < glyph.layers.length; i++) {
                if (getPixel(glyph, x, y, i)) {
                    setPixel(newGlyph, x - minX, y - minY, i, true)
                }
            }
        }
    }

    const encoded = glyph.layers.map((l, i) =>
        f4EncodeImg(
            newGlyph.width,
            newGlyph.height,
            (x, y) =>
                getPixel(glyph, minX + x, minY + y, i) ? 1 : 0)
    );

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