import { makeStyles } from "@griffel/react";
import * as React from "react";
import { Font } from "../lib/font";
import { Glyph } from "../lib/glyph";
import { GlyphGrid } from "./glyphGrid";
import { GlyphSelector } from "./glyphSelector";

export interface GlyphEditorProps {
    font: Font;
    onFontUpdate: (newValue: Font) => void;
}

const useClasses = makeStyles({
    container: {
        display: "flex",
        flexDirection: "row"
    },
    selector: {
        flexGrow: 1,
    }
})

export const GlyphEditor = (props: GlyphEditorProps) => {
    const { font, onFontUpdate } = props;

    const classes = useClasses();
    const [currentGlyph, setCurrentGlyph] = React.useState(font.glyphs[0]);
    const [currentFont, setCurrentFont] = React.useState(font);

    const onGlyphChange = React.useCallback((glyph: Glyph) => {
        setCurrentFont(currentFont.updateGlyph(glyph));
    }, [currentFont]);

    const onGlyphUpdate = React.useCallback((glyph: Glyph) => {
        const updated = currentFont.updateGlyph(glyph);
        setCurrentFont(updated);
        onFontUpdate(updated);
        setCurrentGlyph(glyph);
    }, [currentFont]);

    return (
        <div className={classes.container}>
            <div>
                <GlyphGrid
                    font={currentFont.meta}
                    editing={currentGlyph}
                    onGlyphChange={onGlyphChange}
                    onGlyphUpdate={onGlyphUpdate}
                />
            </div>
            <div className={classes.selector}>
                <GlyphSelector
                    font={currentFont}
                    selected={currentGlyph}
                    onGlyphSelected={setCurrentGlyph} />
            </div>
        </div>
    );
}