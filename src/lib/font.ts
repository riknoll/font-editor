import { createGlyph, deserializeGlyph, Glyph, serializeGlyph } from "./glyph";

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