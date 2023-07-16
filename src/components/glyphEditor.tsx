import { makeStyles } from "@griffel/react";
import * as React from "react";
import { Font } from "../lib/font";
import { Glyph } from "../lib/glyph";
import { GlyphGrid } from "./glyphGrid";
import { GlyphSelector } from "./glyphSelector";
import { GlyphActions } from "./glyphActions";
import { FontPreview } from "./fontPreview";
import { Textarea } from "@fluentui/react-components";

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
});

const DEFAULT_TEXT = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG the quick brown fox jumps over the lazy dog"

export const GlyphEditor = (props: GlyphEditorProps) => {
    const { font, onFontUpdate } = props;

    const classes = useClasses();
    const [currentGlyph, setCurrentGlyph] = React.useState(font.glyphs[0]);
    const [currentFont, setCurrentFont] = React.useState(font);
    const [testText, setTestText] = React.useState(DEFAULT_TEXT)

    const onGlyphChange = React.useCallback((glyph: Glyph) => {
        setCurrentFont(currentFont.updateGlyph(glyph));
    }, [currentFont]);

    const onGlyphUpdate = React.useCallback((glyph: Glyph) => {
        const updated = currentFont.updateGlyph(glyph);
        setCurrentFont(updated);
        onFontUpdate(updated);
        setCurrentGlyph(glyph);
    }, [currentFont, onFontUpdate]);

    const onFontSettingsChange = React.useCallback((newFont: Font) => {
        setCurrentFont(newFont);
        onFontUpdate(newFont);
        setCurrentGlyph(newFont.glyphs.find(g => g.character === currentGlyph.character)!)
    }, [onFontUpdate, currentGlyph]);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <div className={classes.container}>
                <div>
                    <GlyphActions
                        editing={currentGlyph}
                        onGlyphUpdate={onGlyphUpdate}
                        font={currentFont}
                        onFontUpdate={onFontSettingsChange}
                    />
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
            <div className={classes.container} style={{flexGrow: 1}}>
                <Textarea
                    defaultValue={testText}
                    onChange={(ev, data) => setTestText(data.value)}
                />
                <FontPreview
                    text={testText}
                    font={currentFont} />
            </div>
        </div>
    );
}