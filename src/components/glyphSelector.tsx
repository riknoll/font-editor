import * as React from "react";
import { makeStyles, shorthands } from "@fluentui/react-components";
import { Font } from "../lib/font";
import { Glyph } from "../lib/glyph";
import { GlyphPreview } from "./glyphPreview";

export interface GlyphSelectorProps {
    font: Font;
    selected: Glyph;
    onGlyphSelected: (selected: Glyph) => void;
}

const useClasses = makeStyles({
    grid: {
        ...shorthands.gap("2px"),
        display: "grid",
        gridTemplateColumns: "repeat(13, 1fr)",
        height: "100%"
    }
});

export const GlyphSelector = (props: GlyphSelectorProps) => {
    const { font, selected, onGlyphSelected } = props;
    const classes = useClasses();

    return <div className={classes.grid}>
        {font.glyphs.map(g =>
            <GlyphPreview
                key={g.character}
                glyph={g}
                onClick={onGlyphSelected}
                selected={g.character === selected.character}
                twoTone={font.meta.twoTone}
            />
        )}
    </div>
}