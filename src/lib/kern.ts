import { Font } from "./font";
import { getPixel } from "./glyph";

export function autoKernFont(font: Font) {
    const limit = font.meta.defaultHeight < 9 ? 0 : 1
    for (const glyph of font.glyphs) {
        glyph.kernEntries = [];
        for (const other of font.glyphs) {
            let maxOffset = -9999999;


            for (let y = 0; y < other.height; y++) {
                for (let x = 0; x < other.width; x++) {
                    if (getPixel(other, x, y, 0) || getPixel(other, x, y, 1)) {
                        const screenX = x + other.xOffset + glyph.xOffset + glyph.width;
                        const screenY = y + other.yOffset;

                        let offset = 0;

                        while (screenX + offset > 0) {
                            offset--;
                            if (
                                getPixel(glyph, screenX + offset - glyph.xOffset, screenY - glyph.yOffset, 0) ||
                                getPixel(glyph, screenX + offset - glyph.xOffset, screenY - glyph.yOffset, 1) ||
                                getPixel(glyph, screenX + offset - glyph.xOffset, screenY - glyph.yOffset + 1, 0) ||
                                getPixel(glyph, screenX + offset - glyph.xOffset, screenY - glyph.yOffset + 1, 1) ||
                                getPixel(glyph, screenX + offset - glyph.xOffset, screenY - glyph.yOffset - 1, 0) ||
                                getPixel(glyph, screenX + offset - glyph.xOffset, screenY - glyph.yOffset - 1, 1)
                            ) {
                                break;
                            }
                        }

                        maxOffset = Math.max(maxOffset, offset + 1, -other.width - 1);

                        break;
                    }
                }
            }

            if (maxOffset < -limit) {
                glyph.kernEntries.push({
                    character: other.character,
                    offset: maxOffset + limit
                })
            }
        }
    }
}