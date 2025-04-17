import { Font, FontMeta } from "./font";
import { createGlyph, Glyph, setPixel } from "./glyph";

export async function parsePlaydateFont(font: string) {
    const lines = font.split("\n");

    let metrics: any;
    let data: string | undefined;
    let width: number | undefined;
    let height: number | undefined;
    let tracking: number | undefined;

    const characters: {char: string, width: number}[] = [];
    const kernEntries: { char1: string, char2: string, offset: number }[] = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        const eqIndex = line.indexOf("=");
        if (eqIndex > 0) {
            const key = line.substring(0, eqIndex);
            const value = line.substring(eqIndex + 1);

            switch (key) {
                case "--metrics":
                    metrics = JSON.parse(value);
                    break;
                case "width":
                    width = Number(value);
                    break;
                case "height":
                    height = Number(value);
                    break;
                case "tracking":
                    tracking = Number(value);
                    break;
                case "datalen":
                    break;
                case "data":
                    data = value;
                    break;
                default:
                    console.warn(`Unknown .fnt key '${key}'`)
            }
        }
        else if (line.startsWith("--")) {
            // ignore comments
            continue;
        }

        const parts = line.split(/\s+/);

        let char = parts[0];
        if (char === "space") {
            char = " ";
        }
        else if (char.length > 1) {
            // kern table entry
            let char1: string;
            let char2: string;

            if (char.length > 2) {
                if (char.startsWith("space")) {
                    char1 = " ";
                    char2 = char.substring("space".length);
                }
                else {
                    char1 = char.charAt(0);
                    char2 = " ";
                }
            }
            else {
                char1 = char.charAt(0);
                char2 = char.charAt(1);
            }
            kernEntries.push({
                char1,
                char2,
                offset: Number(parts[1])
            });
            continue;
        }

        const charWidth = Number(parts[1]);

        characters.push({
            char,
            width: charWidth
        });
    }

    if (!data || !width || !height) {
        throw new Error("Invalid .fnt file");
    }

    tracking = tracking || 1;

    const spriteSheet = await loadImage("data:image/png;base64," + data);

    const meta: FontMeta = {
        defaultWidth: width,
        defaultHeight: height,
        descenderHeight: 0,
        ascenderHeight: 0,
        kernWidth: 0,
        xHeight: 0,
        letterSpacing: tracking,
        wordSpacing: characters.find(c => c.char === " ")?.width || tracking,
        lineSpacing: 1,
        twoTone: isTwoToneFont(spriteSheet),
    }

    const glyphs: Glyph[] = [];

    let left = 0;
    let top = 0;
    for (const character of characters) {
        const glyph = createGlyph(meta, character.char);
        glyphs.push(glyph);

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const color = getColor(spriteSheet, left + x, top + y);
                if (color === 1) {
                    setPixel(glyph, x, y, 0, true);
                }
                else if (color === 2) {
                    setPixel(glyph, x, y, 1, true);
                }
            }
        }

        for (const entry of kernEntries) {
            if (entry.char1 === character.char) {
                glyph.kernEntries.push({
                    character: entry.char2,
                    offset: entry.offset
                });
            }
        }

        left += width;
        if (left + width > spriteSheet.width) {
            left = 0;
            top += height;
        }
    }

    return new Font(meta, glyphs);
}

function loadImage(uri: string) {
    return new Promise<ImageData>((resolve, reject) => {
        const image = document.createElement("img") as HTMLImageElement;
        image.onerror = reject;
        image.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                const context = canvas.getContext("2d")!;
                context.drawImage(image, 0, 0);

                resolve(context.getImageData(0, 0, canvas.width, canvas.height));
            }
            catch (e) {
                reject(e);
            }
        }

        image.src = uri;
    });
}

function isTwoToneFont(data: ImageData) {
    for (let x = 0; x < data.width; x++) {
        for (let y = 0; y < data.height; y++) {
            if (getColor(data, x, y) === 2) {
                return true;
            }
        }
    }
    return false;
}

function getColor(data: ImageData, x: number, y: number) {
    const index = (x + y * data.width) * 4;
    const r = data.data[index];
    const g = data.data[index + 1];
    const b = data.data[index + 2];
    const a = data.data[index + 3];

    if (a === 0) {
        return 0;
    }
    else if (r > 0 || g > 0 || b > 0) {
        // white
        return 2;
    }
    // black
    return 1;
}