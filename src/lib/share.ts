import { Font, hexEncodeFont } from "./font";
import { createPreviewThumbnail } from "./preview";

const apiRoot = "https://www.makecode.com";
const description = "A custom font for MakeCode Arcade";

export async function createShareLink(fontName: string, font: Font) {
    const thumbnail = createPreviewThumbnail(font, `Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789 .!?"'(){}[]`)

    const payload = createShareRequest(
        `${fontName} (font)`,
        createProjectFiles(fontName, font),
        thumbnail
    );
    const url = apiRoot + "/api/scripts";

    const result = await fetch(
        url,
        {
            method: "POST",
            body: new Blob([JSON.stringify(payload)], { type: "application/json" })
        }
    );

    if (result.status === 200) {
        const resJSON = await result.json();
        return "https://arcade.makecode.com/" + resJSON.shortid;
    }

    return "ERROR"
}


function createShareRequest(projectName: string, files: {[index: string]: string}, screenshotUri: string) {
    let thumbnailBuffer: string | undefined;
    let thumbnailMimeType: string | undefined;
    const m = /^data:(image\/(png|gif));base64,([a-zA-Z0-9+/]+=*)$/.exec(screenshotUri);
    if (m) {
        thumbnailBuffer = m[3];
        thumbnailMimeType = m[1];
    }

    const header = {
        "name": projectName,
        "meta": {
        },
        "editor": "tsprj",
        "pubId": undefined,
        "pubCurrent": false,
        "target": "arcade",
        "id": crypto.randomUUID(),
        "recentUse": Date.now(),
        "modificationTime": Date.now(),
        "path": projectName,
        "saveId": {},
        "githubCurrent": false,
        "pubVersions": []
    }

    return {
        id: header.id,
        name: projectName,
        target: header.target,
        description: description,
        editor: "tsprj",
        header: JSON.stringify(header),
        text: JSON.stringify(files),
        meta: {
        },
        thumbnailBuffer,
        thumbnailMimeType
    }
}

function createProjectFiles(fontName: string, font: Font) {
    const files: {[index: string]: string} = {};

    const config = {
        "name": `${fontName} (font)`,
        "description": description,
        "dependencies": {
            "device": "*",
            "arcade-fancy-text": "github:riknoll/arcade-fancy-text"
        },
        "files": [
            "main.ts",
        ],
        "preferredEditor": "tsprj"
    };
    files["pxt.json"] = JSON.stringify(config, null, 4);
    const escapedName = fontName.replace(/ /g, "_");
    const encoded = hexEncodeFont(font);

    files["main.ts"] = `
namespace customFont {
    //% whenUsed
    //% block="${fontName}"
    //% blockIdentity=fancy_text__fontPicker
    //% fixedInstance
    export const ${escapedName}: fancyText.BaseFont = new fancyText.Font(hex\`${encoded}\`);
}
`;

    return files;
}