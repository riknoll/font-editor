import { uint8ArrayToString, stringToUint8Array } from "./buffer";

export function browserDownloadUInt8Array(buf: Uint8Array, name: string, contentType: string = "application/octet-stream", userContextWindow?: Window, onError?: (err: any) => void): string {
    return browserDownloadBase64(btoa(uint8ArrayToString(buf)), name, contentType, userContextWindow, onError)
}

export function browserDownloadText(text: string, filename: string) {
    const encoded = btoa(text);
    browserDownloadDataUri(toDownloadDataUri(encoded, "text/plain"), filename)
}

export function isEdge(): boolean {
    return !!navigator && /Edge/i.test(navigator.userAgent);
}

export function isIE(): boolean {
    return !!navigator && /Trident/i.test(navigator.userAgent);
}

export function browserDownloadDataUri(uri: string, name: string) {
    if (isEdge() || isIE()) {
        //Fix for edge
        let byteString = atob(uri.split(',')[1]);
        let ia = stringToUint8Array(byteString);
        let blob = new Blob([ia], { type: "img/png" });
        (window.navigator as any).msSaveOrOpenBlob(blob, name);
    } else {
        let link = window.document.createElement('a');
        if (typeof link.download == "string") {
            link.href = uri;
            link.download = name;
            document.body.appendChild(link); // for FF
            link.click();
            document.body.removeChild(link);
        } else {
            document.location.href = uri;
        }
    }
}

export function browserDownloadBase64(b64: string, name: string, contentType: string = "application/octet-stream", userContextWindow?: Window, onError?: (err: any) => void): string {
    const saveBlob = (window as any).navigator.msSaveOrOpenBlob;
    const dataurl = toDownloadDataUri(b64, name);
    try {
        if (saveBlob) {
            const b = new Blob([stringToUint8Array(atob(b64))], { type: contentType })
            const result = (window as any).navigator.msSaveOrOpenBlob(b, name);
        } else browserDownloadDataUri(dataurl, name);
    } catch (e) {
        if (onError) onError(e);
    }
    return dataurl;
}

export function toDownloadDataUri(b64: string, contentType: string): string {
    let protocol = "data";
    const dataurl = protocol + ":" + contentType + ";base64," + b64
    return dataurl;
}