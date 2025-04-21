import { Button, Checkbox, Dialog, DialogActions, DialogBody, DialogContent, DialogProps, DialogSurface, DialogTitle, DialogTrigger, Input, Label, Title3, makeStyles, shorthands, useId } from "@fluentui/react-components";
import { Font, FontMeta, changeFontMeta } from "../lib/font";
import React from "react";
import { clearGlyph } from "../lib/glyph";

export interface SettingsDialogProps extends Partial<DialogProps> {
    font: Font;
    onFontUpdate: (newValue: Font) => void;
}

const useClasses = makeStyles({
    numberInput: {
        ...shorthands.gap("2px"),
        display: "flex",
        flexDirection: "column",
        maxWidth: "400px",
    },
});

export const SettingsDialog = (props: SettingsDialogProps) => {
    const { font, onFontUpdate } = props;

    const classes = useClasses();

    const [twoTone, setTwoTone] = React.useState(font.meta.twoTone);
    const [autoKern, setAutoKern] = React.useState(font.meta.autoKern);

    const kernWidthRef = React.useRef<HTMLInputElement>(null);
    const defaultHeightRef = React.useRef<HTMLInputElement>(null);
    const defaultWidthRef = React.useRef<HTMLInputElement>(null);
    const descenderHeightRef = React.useRef<HTMLInputElement>(null);
    const ascenderHeightRef = React.useRef<HTMLInputElement>(null);
    const xHeightRef = React.useRef<HTMLInputElement>(null);
    const letterSpacingRef = React.useRef<HTMLInputElement>(null);
    const wordSpacingRef = React.useRef<HTMLInputElement>(null);
    const lineSpacingRef = React.useRef<HTMLInputElement>(null);

    const inputs = [
        {
            label: "Max Character Width",
            ref: defaultWidthRef,
            value: font.meta?.defaultWidth,
            id: useId()
        },
        {
            label: "Character Height",
            ref: defaultHeightRef,
            value: font.meta?.defaultHeight,
            id: useId()
        },
        {
            label: "Lowercase Letter Height",
            ref: xHeightRef,
            value: font.meta?.xHeight,
            id: useId()
        },
        {
            label: "Descender Height",
            ref: descenderHeightRef,
            value: font.meta?.descenderHeight,
            id: useId()
        },
        {
            label: "Ascender Height",
            ref: ascenderHeightRef,
            value: font.meta?.ascenderHeight,
            id: useId()
        },
        {
            label: "Left Bleed",
            ref: kernWidthRef,
            value: font.meta?.kernWidth,
            id: useId()
        },
        {
            label: "Letter Spacing",
            ref: letterSpacingRef,
            value: font.meta?.letterSpacing,
            id: useId()
        },
        {
            label: "Word Spacing",
            ref: wordSpacingRef,
            value: font.meta?.wordSpacing,
            id: useId()
        },
        {
            label: "Line Spacing",
            ref: lineSpacingRef,
            value: font.meta?.lineSpacing,
            id: useId()
        }
    ];

    const onSave = () => {
        const values = inputs.map(data => parseInt(data.ref.current!.value));

        const validate = (value: number, defaultValue: number) => {
            if (value < 0 || value > 100 || Number.isNaN(value)) return defaultValue;

            return value | 0;
        }

        const newMeta: FontMeta = {
            ...font.meta,
            defaultWidth: validate(values[0], font.meta.defaultWidth),
            defaultHeight: validate(values[1], font.meta.defaultHeight),
            xHeight: validate(values[2], font.meta.xHeight),
            descenderHeight: validate(values[3], font.meta.descenderHeight),
            ascenderHeight: validate(values[4], font.meta.ascenderHeight),
            kernWidth: validate(values[5], font.meta.kernWidth),
            letterSpacing: validate(values[6], font.meta.letterSpacing),
            wordSpacing: validate(values[7], font.meta.wordSpacing),
            lineSpacing: validate(values[8], font.meta.lineSpacing),
            twoTone: twoTone,
            autoKern: autoKern
        };

        onFontUpdate(changeFontMeta(font, newMeta));
    };

    const onClearAllClick = () => {
        const newFont = new Font(font.meta, font.glyphs.map(g => ({
            ...g,
            layers: clearGlyph(g)
        })));

        onFontUpdate(newFont);
    }

    return (
        <Dialog {...props}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>
                        <Title3>Font Settings</Title3>
                    </DialogTitle>
                    <DialogContent>
                        {inputs.map((data, i) =>
                            <div key={i} className={classes.numberInput}>
                                <Label htmlFor={data.id}>
                                    {data.label}
                                </Label>
                                <Input id={data.id} defaultValue={data.value.toString()} ref={data.ref} />
                            </div>
                        )}
                        <div>
                            <Checkbox
                                labelPosition="before"
                                label="Two-Tone"
                                checked={twoTone}
                                onChange={(ev, data) => setTwoTone(data.checked as boolean)}
                            />
                        </div>
                        <div>
                            <Checkbox
                                labelPosition="before"
                                label="Auto kern"
                                checked={!!autoKern}
                                onChange={(ev, data) => setAutoKern(data.checked as boolean)}
                            />
                        </div>
                        <div>
                            <Button
                                onClick={onClearAllClick}
                            >
                                Clear all Glyphs
                            </Button>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <DialogTrigger action="close">
                            <Button
                                appearance="secondary"
                            >
                                Cancel
                            </Button>
                        </DialogTrigger>
                        <DialogTrigger action="close">
                            <Button
                                appearance="primary"
                                onClick={onSave}
                            >
                                Save
                            </Button>
                        </DialogTrigger>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    )
};