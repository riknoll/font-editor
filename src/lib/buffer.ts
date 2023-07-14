// Copied from libgeneric.ts in pxt

export enum NumberFormat {
    Int8LE = 1,
    UInt8LE,
    Int16LE,
    UInt16LE,
    Int32LE,
    Int8BE,
    UInt8BE,
    Int16BE,
    UInt16BE,
    Int32BE,
    UInt32LE,
    UInt32BE,
    Float32LE,
    Float64LE,
    Float32BE,
    Float64BE,
};

function fmtInfoCore(fmt: NumberFormat) {
    switch (fmt) {
        case NumberFormat.Int8LE: return -1;
        case NumberFormat.UInt8LE: return 1;
        case NumberFormat.Int16LE: return -2;
        case NumberFormat.UInt16LE: return 2;
        case NumberFormat.Int32LE: return -4;
        case NumberFormat.UInt32LE: return 4;
        case NumberFormat.Int8BE: return -10;
        case NumberFormat.UInt8BE: return 10;
        case NumberFormat.Int16BE: return -20;
        case NumberFormat.UInt16BE: return 20;
        case NumberFormat.Int32BE: return -40;
        case NumberFormat.UInt32BE: return 40;

        case NumberFormat.Float32LE: return 4;
        case NumberFormat.Float32BE: return 40;
        case NumberFormat.Float64LE: return 8;
        case NumberFormat.Float64BE: return 80;
    }
}

function fmtInfo(fmt: NumberFormat) {
    let size = fmtInfoCore(fmt)
    let signed = false
    if (size < 0) {
        signed = true
        size = -size
    }
    let swap = false
    if (size >= 10) {
        swap = true
        size /= 10
    }
    let isFloat = fmt >= NumberFormat.Float32LE
    return { size, signed, swap, isFloat }
}

export function getNumber(buf: Uint8Array, fmt: NumberFormat, offset: number) {
    let inf = fmtInfo(fmt)
    if (inf.isFloat) {
        let subarray = buf.slice(offset, offset + inf.size)
        if (inf.swap) {
            let u8 = new Uint8Array(subarray)
            u8.reverse()
        }
        if (inf.size == 4) return new Float32Array(subarray)[0]
        else return new Float64Array(subarray)[0]
    }

    let r = 0
    for (let i = 0; i < inf.size; ++i) {
        r <<= 8
        let off = inf.swap ? offset + i : offset + inf.size - i - 1
        r |= buf[off]
    }
    if (inf.signed) {
        let missingBits = 32 - (inf.size * 8)
        r = (r << missingBits) >> missingBits;
    } else {
        r = r >>> 0;
    }
    return r
}

export function setNumber(buf: Uint8Array, fmt: NumberFormat, offset: number, r: number) {
    let inf = fmtInfo(fmt)
    if (inf.isFloat) {
        let arr = new Uint8Array(inf.size)
        if (inf.size === 4)
            new Float32Array(arr.buffer)[0] = r
        else
            new Float64Array(arr.buffer)[0] = r
        if (inf.swap)
            arr.reverse()
        for (let i = 0; i < inf.size; ++i) {
            buf[offset + i] = arr[i]
        }
        return
    }

    for (let i = 0; i < inf.size; ++i) {
        let off = !inf.swap ? offset + i : offset + inf.size - i - 1
        buf[off] = (r & 0xff)
        r >>= 8
    }
}

export function hexToUint8Array(hex: string) {
    let r = new Uint8ClampedArray(hex.length >> 1);
    for (let i = 0; i < hex.length; i += 2)
        r[i >> 1] = parseInt(hex.slice(i, i + 2), 16)
    return r
}

export function uint8ArrayToHex(data: Uint8ClampedArray | Uint8Array) {
    const hex = "0123456789abcdef";
    let res = "";
    for (let i = 0; i < data.length; ++i) {
        res += hex[data[i] >> 4];
        res += hex[data[i] & 0xf];
    }
    return res;
}

export function uint8ArrayToString(input: ArrayLike<number>) {
    let len = input.length;
    let res = ""
    for (let i = 0; i < len; ++i)
        res += String.fromCharCode(input[i]);
    return res;
}

export function stringToUint8Array(input: string) {
    let len = input.length;
    let res = new Uint8Array(len)
    for (let i = 0; i < len; ++i)
        res[i] = input.charCodeAt(i) & 0xff;
    return res;
}