import * as React from "react";
import { FontMeta } from "../lib/font";
import { getPixel, Glyph, setPixel } from "../lib/glyph";

export interface GlyphGridProps {
    font: FontMeta;
    editing: Glyph;
    onGlyphChange: (newValue: Glyph) => void;
    onGlyphUpdate: (newValue: Glyph) => void;
}

interface GestureState {
    drawing: boolean;
    erasing: boolean;
    didChange: boolean;
    lastPosition?: { x: number, y: number };
}

export const GlyphGrid = (props: GlyphGridProps) => {
    const { font, editing, onGlyphChange, onGlyphUpdate } = props;

    const ref = React.useRef(null);
    const gestureState = React.useRef<GestureState>({
        drawing: false,
        erasing: false,
        didChange: false
    })

    React.useEffect(() => {
        const canvas = ref.current!;
        let currentGlyph = editing;

        let animationRef: number | undefined;

        const redraw = () => {
            if (animationRef) cancelAnimationFrame(animationRef);

            animationRef = requestAnimationFrame(() => {
                drawCanvas(canvas, font, currentGlyph);
            });
        };

        const setPixelCore = (x: number, y: number, on: boolean) => {
            if (getPixel(currentGlyph, x, y) === on) return false;
            setPixel(currentGlyph, x, y, on);
            return true;
        }

        // https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
        const interpolate = (x0: number, y0: number, x1: number, y1: number, on: boolean) => {
            let didChange = false;
            const dx = x1 - x0;
            const dy = y1 - y0;
            if (dx === 0) {
                const startY = dy >= 0 ? y0 : y1;
                const endY = dy >= 0 ? y1 : y0;
                for (let y = startY; y <= endY; y++) {
                    didChange = setPixelCore(x0, y, on) || didChange;
                }
                return didChange;
            }

            const xStep = dx > 0 ? 1 : -1;
            const yStep = dy > 0 ? 1 : -1;
            const dErr = Math.abs(dy / dx);

            let err = 0;
            let y = y0;
            for (let x = x0; xStep > 0 ? x <= x1 : x >= x1; x += xStep) {
                didChange = setPixelCore(x, y, on) || didChange;
                err += dErr;
                while (err >= 0.5) {
                    if (yStep > 0 ? y <= y1 : y >= y1) {
                        didChange = setPixelCore(x, y, on) || didChange;
                    }
                    y += yStep;
                    err -= 1;
                }
            }
            return didChange;
        };

        const doPaint = (x: number, y: number, on: boolean) => {
            let didChange = false;

            // If we moved more than 1 pixel since the last mouse event, interpolate
            if (gestureState.current.lastPosition && (x - gestureState.current.lastPosition.x) ** 2 + (y - gestureState.current.lastPosition.y) ** 2 > 1) {
                didChange = interpolate(gestureState.current.lastPosition.x, gestureState.current.lastPosition.y, x, y, on);
            }
            else {
                didChange = setPixelCore(x, y, on);
            }

            if (didChange) {
                redraw();
                onGlyphChange({
                    ...currentGlyph
                });
                gestureState.current.didChange = true;
            }
        }

        const onPointerDown = (ev: PointerEvent) => {
            const coord = getEventCoord(ev, canvas, font);
            if (!coord) {
                gestureState.current.lastPosition = undefined;
                return;
            }

            gestureState.current.drawing = true;
            gestureState.current.didChange = false;
            gestureState.current.erasing = getPixel(currentGlyph, coord.x, coord.y);
            doPaint(coord.x, coord.y, !gestureState.current.erasing);
            gestureState.current.lastPosition = coord;
        };

        const onPointerUp = (ev: PointerEvent) => {
            if (!gestureState.current.drawing) return;

            gestureState.current.drawing = false;

            const coord = getEventCoord(ev, canvas, font);
            if (coord) {
                doPaint(coord.x, coord.y, !gestureState.current.erasing);
            }

            gestureState.current.lastPosition = undefined;

            if (gestureState.current.didChange) {
                onGlyphUpdate({
                    ...currentGlyph
                });
            }
        };

        const onPointerMove = (ev: PointerEvent) => {
            if (!gestureState.current.drawing) return;

            const coord = getEventCoord(ev, canvas, font);
            if (!coord) {
                gestureState.current.lastPosition = undefined;
                return;
            }

            doPaint(coord.x, coord.y, !gestureState.current.erasing);
            gestureState.current.lastPosition = coord;
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("pointerup", onPointerUp);
        document.addEventListener("pointerleave", onPointerUp);
        document.addEventListener("pointermove", onPointerMove);

        redraw();

        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("pointerup", onPointerUp);
            document.removeEventListener("pointerleave", onPointerUp);
            document.removeEventListener("pointermove", onPointerMove);
        };
    }, [font, editing, onGlyphUpdate, onGlyphChange]);

    let width = 500;
    width = getCellWidth(width, font) * gridColumns(font) + 1;
    const height = Math.ceil(width * (gridRows(font) / gridColumns(font))) + 1;

    return (
        <canvas
            style={{ imageRendering: "pixelated" }}
            ref={ref}
            width={width}
            height={height}
        />
    );
}

function getEventCoord(event: PointerEvent, canvas: HTMLCanvasElement, font: FontMeta) {
    const bounds = canvas.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
        return undefined;
    }

    const cellWidth = getCellWidth(canvas.width, font);
    return {
        x: pixelToGrid(cellWidth, event.clientX - bounds.left),
        y: pixelToGrid(cellWidth, event.clientY - bounds.top)
    };
}

function drawCanvas(canvas: HTMLCanvasElement, font: FontMeta, glyph: Glyph) {
    const context = canvas.getContext("2d")!;

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGlyph(canvas, context, font, glyph);
    drawGrid(canvas, context, font);
}

function drawGlyph(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, font: FontMeta, glyph: Glyph) {
    const columns = gridColumns(font);
    const rows = gridRows(font);
    const cellWidth = getCellWidth(canvas.width, font);

    context.fillStyle = "black";
    for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
            if (getPixel(glyph, x, y)) {
                context.fillRect(
                    gridToPixel(cellWidth, x),
                    gridToPixel(cellWidth, y),
                    cellWidth,
                    cellWidth
                );
            }
        }
    }
}

function drawGrid(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, font: FontMeta) {
    const columns = gridColumns(font);
    const rows = gridRows(font);
    const cellWidth = getCellWidth(canvas.width, font);

    // First draw solid black grid lines
    context.beginPath();
    context.setLineDash([]);
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.globalAlpha = 1;

    for (let x = 0; x < columns + 1; x++) {
        context.moveTo(gridToPixel(cellWidth, x), 0);
        context.lineTo(gridToPixel(cellWidth, x), cellWidth * rows + 1);
    }

    for (let y = 0; y < rows + 1; y++) {
        context.moveTo(0, gridToPixel(cellWidth, y));
        context.lineTo(cellWidth * columns + 1, gridToPixel(cellWidth, y));
    }

    context.stroke();

    // Next draw dotted white lines over the grid lines
    context.beginPath();
    context.strokeStyle = "white";
    context.setLineDash([1, 1]);
    context.globalAlpha = 1;
    context.lineDashOffset = 1;

    for (let x = 0; x < columns + 1; x++) {
        context.moveTo(gridToPixel(cellWidth, x), 0);
        context.lineTo(gridToPixel(cellWidth, x), cellWidth * rows + 1);
    }

    for (let y = 0; y < rows + 1; y++) {
        context.moveTo(0, gridToPixel(cellWidth, y));
        context.lineTo(cellWidth * columns + 1, gridToPixel(cellWidth, y));
    }

    context.stroke();

    // Finally draw the left and base lines in red
    context.beginPath();
    context.strokeStyle = "red";
    context.setLineDash([]);
    context.lineWidth = 3;

    context.moveTo(gridToPixel(cellWidth, font.kernWidth), 0);
    context.lineTo(gridToPixel(cellWidth, font.kernWidth), rows * cellWidth + 1);

    context.moveTo(0, gridToPixel(cellWidth, font.ascenderHeight + font.defaultHeight));
    context.lineTo(columns * cellWidth + 1, gridToPixel(cellWidth, font.ascenderHeight + font.defaultHeight));

    context.stroke();
}

function gridToPixel(cellWidth: number, value: number) {
    // Canvas draws lines on the center of coordinate, so we add 0.5
    // so that it isn't drawing them at a half pixel coordinate
    return cellWidth * value + 0.5;
}

function pixelToGrid(cellWidth: number, value: number) {
    return (value / cellWidth) | 0;
}

function getCellWidth(width: number, font: FontMeta) {
    let cellWidth = (width / gridColumns(font)) | 0;
    if (cellWidth % 2 === 1) {
        cellWidth --;
    }

    return cellWidth;
}

function gridColumns(font: FontMeta) {
    return font.kernWidth + font.defaultWidth;
}

function gridRows(font: FontMeta) {
    return font.ascenderHeight + font.descenderHeight + font.defaultHeight;
}