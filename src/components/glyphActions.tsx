import * as React from "react";
import { Glyph, clearGlyph } from "../lib/glyph";
import { Icon } from '@fluentui/react/lib/Icon';

export interface GlyphActionsProps {
    editing: Glyph;
    onGlyphChange: (newValue: Glyph) => void;
    onGlyphUpdate: (newValue: Glyph) => void;
}

export const GlyphActions = (props: GlyphActionsProps) => {
    const { editing, onGlyphChange, onGlyphUpdate } = props;
    const [ clipboardGlyph, setClipboardGlyph ] = React.useState(editing);
    const [ currentGlyph, setCurrentGlyph ] = React.useState(editing);

    React.useEffect(() => {
        onGlyphChange(currentGlyph);
        onGlyphUpdate(currentGlyph);
    }, [currentGlyph]);

    React.useEffect(() => {
        setCurrentGlyph(editing);
    }, [editing]);

    const onClearGlyph = () => {
        setCurrentGlyph({
            ...currentGlyph,
            pixels: clearGlyph(currentGlyph),
        });
    }

    const onCopyGlyph = () => {
        setClipboardGlyph(editing);
    }

    const onPasteGlyph = () => {
        setCurrentGlyph({
            ...clipboardGlyph,
            character: editing.character
        });
    }

    return (
        <div>
            <button onClick={onCopyGlyph} aria-label="Copy" title="Copy"><Icon iconName="Copy" /></button>
            <button onClick={onPasteGlyph} aria-label="Paste" title="Paste"><Icon iconName="Paste" /></button>
            <button onClick={onClearGlyph} aria-label="Clear" title="Clear"><Icon iconName="Delete" /></button>
        </div>
    );
}