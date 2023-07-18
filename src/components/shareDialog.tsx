import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogProps, DialogSurface, DialogTitle, DialogTrigger, Input, Label, Title3, shorthands, makeStyles, useId, Body1, InputOnChangeData, Body2, tokens } from "@fluentui/react-components";
import { Font } from "../lib/font";
import React from "react";
import { createShareLink } from "../lib/share";

export interface ShareDialogProps extends Partial<DialogProps> {
    font: Font;
}

const useClasses = makeStyles({
    nameInput: {
        ...shorthands.gap("2px"),
        display: "flex",
        flexDirection: "column",
        maxWidth: "400px",
        marginBottom: "1rem",
        marginTop: "1rem"
    },
    error: {
        color: tokens.colorPaletteRedForeground1
    }
});

export const ShareDialog = (props: ShareDialogProps) => {
    const { font } = props;
    const classes = useClasses();
    const id = useId();
    const ref = React.useRef<HTMLInputElement>(null);
    const [name, setName] = React.useState<string>();
    const [error, setError] = React.useState<string>();
    const [url, setUrl] = React.useState<string>();

    const onShare = React.useCallback(() => {
        const trimmed = name!.trim();

        (async () => {
            setUrl(await createShareLink(trimmed, font))
        })();

    }, [name, font]);

    const onChange = React.useCallback((ev: React.ChangeEvent, data: InputOnChangeData) => {
        setName(data.value);

        const trimmed = data.value.trim();
        if (!trimmed) {
            setError(undefined);
        }
        else if (/^[0-9]/.test(trimmed)) {
            setError("Font names can't start with a number.");
        }
        else if (/[^a-zA-Z _0-9]/.test(trimmed)) {
            setError("Font names can only contain letters, numbers, underscore, and space.")
        }
        else {
            setError(undefined);
        }
    }, []);

    const disabled = !!(!name?.trim() || error);

    return (
        <Dialog {...props}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>
                        <Title3>Create share link</Title3>
                    </DialogTitle>
                    <DialogContent>
                        {!url &&
                            <>
                                <div>
                                    <Body1>
                                        This will create a share link that you can use to import your font
                                        into a MakeCode Arcade project. Simply add it to your project as
                                        you would an extension and your font will appear in the dropdowns
                                        of the "Fancy Text" category.
                                    </Body1>
                                </div>
                                <div className={classes.nameInput}>
                                    <Label htmlFor={id}>
                                        Font name:
                                    </Label>
                                    <Input id={id} ref={ref}  onChange={onChange}/>
                                </div>
                                <div>
                                    {error &&
                                        <Body2 className={classes.error}>
                                            {error}
                                        </Body2>
                                    }
                                </div>
                            </>
                        }
                        {url &&
                            <div>
                                <Body1>
                                    Congrats! Here's your URL:
                                </Body1>
                                <pre>
                                    {url}
                                </pre>
                            </div>
                        }
                    </DialogContent>
                    {!url &&
                        <DialogActions>
                            <DialogTrigger action="close">
                                <Button
                                    appearance="secondary"
                                >
                                    Cancel
                                </Button>
                            </DialogTrigger>
                            <Button
                                appearance="primary"
                                onClick={onShare}
                                disabled={disabled}
                            >
                                Share
                            </Button>
                        </DialogActions>
                    }
                    {url &&
                        <DialogActions>
                            <DialogTrigger action="close">
                                <Button
                                    appearance="primary"
                                >
                                    Close
                                </Button>
                        </DialogTrigger>
                        </DialogActions>
                    }
                </DialogBody>
            </DialogSurface>
        </Dialog>
    )
};