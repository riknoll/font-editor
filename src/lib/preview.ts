import { Font, trimGlyph } from "./font";
import { Glyph, createGlyph, getPixel } from "./glyph";

const CHARACTERS_PER_LINE = 10;

export function renderPreview(font: Font, text: string, canvas: HTMLCanvasElement, width?: number, height?: number) {
    const trimmedGlyphs: {[index: string]: Glyph} = {};
    const placeHolderGlyph = createGlyph(font.meta, "");

    for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);

        if (char === " ") {
            continue;
        }
        if (!trimmedGlyphs[char]) {
            const glyph = font.glyphs.find(g => g.character === char);

            if (!glyph) {
                trimmedGlyphs[char] = placeHolderGlyph;
                continue;
            }
            const trimmed = trimGlyph(glyph, font);

            if (!trimmed) {
                trimmedGlyphs[char] = placeHolderGlyph;
                continue;
            }

            trimmedGlyphs[char] = trimmed[0];
        }
    }

    const maxWidth = width || ((font.meta.defaultWidth + font.meta.letterSpacing) * CHARACTERS_PER_LINE);
    canvas.width = maxWidth;

    const lines: string[] = [];
    let lineStart = 0;
    let lineWidth = 0;
    let lastSpace = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);

        if (char === " ") {
            lineWidth += font.meta.wordSpacing;
            lastSpace = i;
        }
        else {
            const glyph = trimmedGlyphs[char]!;
            lineWidth += glyph.width + glyph.xOffset + font.meta.letterSpacing;
        }


        if (lineWidth > maxWidth - 10) {
            if (lastSpace > lineStart) {
                lines.push(text.substring(lineStart, lastSpace));
                lineStart = lastSpace + 1;
            }
            else {
                lines.push(text.substring(lineStart, i));
                lineStart = i;
            }
            lineWidth = 0;
        }
    }

    lines.push(text.substring(lineStart));

    const lineHeight = font.meta.ascenderHeight + font.meta.descenderHeight + font.meta.defaultHeight;

    canvas.width = maxWidth;
    canvas.height = height || (lines.length * lineHeight);

    const context = canvas.getContext("2d")!;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";

    let x = 0;
    let y = 0;
    for (const line of lines) {
        for (const char of line) {
            if (char === " ") {
                x += font.meta.wordSpacing;
                continue;
            }
            const glyph = trimmedGlyphs[char];
            drawGlyph(glyph, x + glyph.xOffset, y + glyph.yOffset + font.meta.ascenderHeight + font.meta.defaultHeight, context);
            x += glyph.width + glyph.xOffset + font.meta.letterSpacing
        }
        x = 0;
        y += lineHeight;
    }
}

function drawGlyph(glyph: Glyph, x: number, y: number, context: CanvasRenderingContext2D) {
    for (let ix = 0; ix < glyph.width; ix++) {
        for (let iy = 0; iy < glyph.height; iy++) {
            if (getPixel(glyph, ix, iy)) {
                context.fillRect(x + ix, y + iy, 1, 1);
            }
        }
    }
}


export function createPreviewThumbnail(font: Font, text: string) {
    const canvas = document.createElement("canvas");
    renderPreview(font, text, canvas, 160, 120);
    return canvas.toDataURL("png");
}