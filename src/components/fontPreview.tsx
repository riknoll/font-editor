import React from "react";
import { Font, trimGlyph } from "../lib/font";
import { Glyph, createGlyph, getPixel } from "../lib/glyph";

export interface FontPreviewProps {
    text: string;
    font: Font;
}

const CHARACTERS_PER_LINE = 10;

export const FontPreview = (props: FontPreviewProps) => {
    const { text, font } = props;

    const ref = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = ref.current!;

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

        const maxWidth = (font.meta.defaultWidth + font.meta.letterSpacing) * CHARACTERS_PER_LINE;
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
        canvas.height = lines.length * lineHeight;

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

    }, [text, font])

    return <canvas ref={ref} style={{imageRendering: "pixelated"}} />
};

function drawGlyph(glyph: Glyph, x: number, y: number, context: CanvasRenderingContext2D) {
    for (let ix = 0; ix < glyph.width; ix++) {
        for (let iy = 0; iy < glyph.height; iy++) {
            if (getPixel(glyph, ix, iy)) {
                context.fillRect(x + ix, y + iy, 1, 1);
            }
        }
    }
}