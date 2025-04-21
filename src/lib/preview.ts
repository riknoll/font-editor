import { Font, trimSortKern } from "./font";
import { Glyph, createGlyph, getPixel } from "./glyph";

const CHARACTERS_PER_LINE = 10;

export function renderPreview(font: Font, text: string, canvas: HTMLCanvasElement, width?: number, height?: number, backgroundFill?: string) {
    const trimmedGlyphs: {[index: string]: Glyph} = {};
    const placeHolderGlyph = createGlyph(font.meta, "");

    font = trimSortKern(font);

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

            trimmedGlyphs[char] = glyph;
        }
    }

    const maxWidth = width || ((font.meta.defaultWidth + font.meta.letterSpacing) * CHARACTERS_PER_LINE);

    const lines: string[] = [];
    let lineStart = 0;
    let lineWidth = 0;
    let widthSinceLastSpace = 0;
    let lastSpace = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        const nextChar = text.charAt(i + 1);

        if (char === " ") {
            lineWidth += font.meta.wordSpacing;
            lastSpace = i;
            widthSinceLastSpace = 0;
        }
        else if (!trimmedGlyphs[char]) {
            continue;
        }
        else {
            const glyph = trimmedGlyphs[char]!;
            lineWidth += glyph.width + glyph.xOffset + font.meta.letterSpacing;
            widthSinceLastSpace += glyph.width + glyph.xOffset + font.meta.letterSpacing
        }

        if (lineWidth > maxWidth) {
            if (lastSpace > lineStart) {
                lines.push(text.substring(lineStart, lastSpace));
                lineStart = lastSpace + 1;
                lineWidth = widthSinceLastSpace;
            }
            else {
                lines.push(text.substring(lineStart, i));
                lineStart = i;
                lineWidth = 0;
            }
            widthSinceLastSpace = 0;
        }
        else if (nextChar && char !== " ") {
            const kernEntry = trimmedGlyphs[char].kernEntries.find(c => c.character === nextChar);
            if (kernEntry) {
                lineWidth += kernEntry.offset;
                widthSinceLastSpace += kernEntry.offset;
            }
        }
    }

    lines.push(text.substring(lineStart));

    const lineHeight = font.meta.ascenderHeight + font.meta.descenderHeight + font.meta.defaultHeight;

    canvas.width = maxWidth;
    canvas.height = height || (lines.length * lineHeight);

    const context = canvas.getContext("2d")!;

    if (backgroundFill) {
        context.fillStyle = backgroundFill;
        context.fillRect(0, 0, canvas.width, canvas.height,)
    }
    else {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    context.fillStyle = "black";

    let x = 0;
    let y = 0;
    for (const line of lines) {
        for (let i = 0; i < line.length; i++) {
            const char = line.charAt(i);
            const nextChar = line.charAt(i + 1);

            if (char === " ") {
                x += font.meta.wordSpacing;
                continue;
            }
            const glyph = trimmedGlyphs[char];

            if (!glyph) continue;

            drawGlyph(
                glyph,
                x + glyph.xOffset,
                y + glyph.yOffset + font.meta.ascenderHeight + font.meta.defaultHeight,
                font.meta.twoTone,
                context
            );
            x += glyph.width + glyph.xOffset + font.meta.letterSpacing;

            if (nextChar) {
                const kernEntry = glyph.kernEntries.find(c => c.character === nextChar);
                if (kernEntry) {
                    x += kernEntry.offset;
                }
            }
        }
        x = 0;
        y += lineHeight;
    }
}

const LAYER_1_COLOR = "#000000";
const LAYER_2_COLOR = "#FF0000"

function drawGlyph(glyph: Glyph, x: number, y: number, twoTone: boolean, context: CanvasRenderingContext2D) {
    for (let ix = 0; ix < glyph.width; ix++) {
        for (let iy = 0; iy < glyph.height; iy++) {
            if (twoTone && getPixel(glyph, ix, iy, 1)) {
                context.fillStyle = LAYER_2_COLOR;
                context.fillRect(x + ix, y + iy, 1, 1);
            }
            else if (getPixel(glyph, ix, iy, 0)) {
                context.fillStyle = LAYER_1_COLOR;
                context.fillRect(x + ix, y + iy, 1, 1);
            }
        }
    }
}


export function createPreviewThumbnail(font: Font, text: string) {
    const canvas = document.createElement("canvas");
    renderPreview(font, text, canvas, 160, 120, "white");
    return canvas.toDataURL("png");
}