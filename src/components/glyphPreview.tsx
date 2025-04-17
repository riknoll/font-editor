import { makeStyles, mergeClasses, shorthands, tokens } from "@fluentui/react-components";
import * as React from "react";
import { getPixel, Glyph } from "../lib/glyph";

export interface GlyphPreviewProps {
    glyph: Glyph;
    twoTone: boolean;
    onClick: (glyph: Glyph) => void;
    selected?: boolean;
}

const useClasses = makeStyles({
    button: {
        ...shorthands.padding(0),
        backgroundColor: tokens.colorNeutralBackground1,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",

        ":focus-visible": {
            outlineColor: "-webkit-focus-ring-color"
        }
    },
    character: {
        backgroundColor: tokens.colorNeutralForeground1,
        color: tokens.colorNeutralBackground1,
        width: "100%"
    },
    selected: {
        backgroundColor: tokens.colorPaletteRedForeground1
    },
    canvasContainer: {
        ...shorthands.padding("2px"),
        flexGrow: 1
    },
    canvas: {
        imageRendering: "pixelated",
        height: "100%",
        maxWidth: "100%",
        objectFit: "contain"
    }
})

export const GlyphPreview = (props: GlyphPreviewProps) => {
    const { glyph, onClick, selected, twoTone } = props;
    const classes = useClasses();

    const ref = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = ref.current!;

        const context = canvas.getContext("2d")!;

        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        if (!glyph) return;

        for (let x = 0; x < glyph.width; x++) {
            for (let y = 0; y < glyph.height; y++) {
                if (twoTone && getPixel(glyph, x, y, 1)) {
                    context.fillStyle = "red";
                    context.fillRect(x, y, 1, 1);
                }
                else if (getPixel(glyph, x, y, 0)) {
                    context.fillStyle = "black";
                    context.fillRect(x, y, 1, 1);
                }
            }
        }
    }, [glyph, twoTone]);

    const onButtonClick = React.useCallback(() => {
        onClick(glyph);
    }, [onClick, glyph]);

    return (
        <div
            className={classes.button}
            onClick={onButtonClick}
            role="button"
            tabIndex={0}
            title={`Select character '${glyph.character}'`}
        >
            <div className={selected ? mergeClasses(classes.character, classes.selected) : classes.character}>
                {glyph.character}
            </div>
            <div className={classes.canvasContainer}>
                <canvas
                    ref={ref}
                    className={classes.canvas}
                    width={glyph.width}
                    height={glyph.height} />
            </div>
        </div>
    );
}
