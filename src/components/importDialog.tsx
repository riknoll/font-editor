import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogProps, DialogSurface, DialogTitle, DialogTrigger, Input, Label, Title3, shorthands, makeStyles, useId } from "@fluentui/react-components";
import { Font, deserializeFont } from "../lib/font";
import React from "react";

export interface ImportDialogProps extends Partial<DialogProps> {
    onFontUpdate: (newValue: Font) => void;
}

const useClasses = makeStyles({
    fileInput: {
        ...shorthands.gap("2px"),
        display: "flex",
        flexDirection: "column",
        maxWidth: "400px",
    },
});

export const ImportDialog = (props: ImportDialogProps) => {
    const { onFontUpdate } = props;
    const classes = useClasses();
    const id = useId();
    const ref = React.useRef<HTMLInputElement>(null);
    const [file, setFile] = React.useState<File>();

    const onImport = React.useCallback(() => {
        if (!file) return;

        (async () => {
            const text = await file.text();

            try {
                const font = deserializeFont(text);
                onFontUpdate(font);
            }
            catch(e) {
            }
        })();
    }, [onFontUpdate, file]);

    const onChange = React.useCallback((ev: React.ChangeEvent) => {
        const file = ref.current?.files?.[0];
        if (!file) return;

        setFile(file);
    }, []);

    return (
        <Dialog {...props}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>
                        <Title3>Import font from file</Title3>
                    </DialogTitle>
                    <DialogContent>
                        <div className={classes.fileInput}>
                            <Label htmlFor={id}>
                                Choose a .json file:
                            </Label>
                            <input
                                type="file"
                                id={id}
                                accept="application/json"
                                onChange={onChange}
                                ref={ref}
                            />
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
                                onClick={onImport}
                                disabled={!file}
                            >
                                Import
                            </Button>
                        </DialogTrigger>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    )
};