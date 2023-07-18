import * as React from "react";
import { Glyph, clearGlyph, deserializeGlyph, serializeGlyph, shiftGlyph } from "../lib/glyph";
import { Button } from "@fluentui/react-components";
import { ArrowDown16Regular, ArrowDownload16Regular, ArrowLeft16Regular, ArrowRight16Regular, ArrowUp16Regular, ArrowUpload16Regular, ClipboardPaste16Regular, Copy16Regular, Delete16Regular, Settings16Regular, Share16Regular } from "@fluentui/react-icons";
import { Font, serializeFont } from "../lib/font";
import { SettingsDialog } from "./settingsDialog";
import { browserDownloadText } from "../lib/download";
import { ImportDialog } from "./importDialog";
import { ShareDialog } from "./shareDialog";

export interface GlyphActionsProps {
    editing: Glyph;
    onGlyphUpdate: (newValue: Glyph) => void;

    font: Font;
    onFontUpdate: (newFont: Font) => void;
}

export const GlyphActions = (props: GlyphActionsProps) => {
    const { editing, onGlyphUpdate, font, onFontUpdate } = props;

    const [copied, setCopied] = React.useState<string>();
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [importOpen, setImportOpen] = React.useState(false);
    const [shareOpen, setShareOpen] = React.useState(false);

    const onClearGlyph = React.useCallback(() => {
        onGlyphUpdate({
            ...editing,
            pixels: clearGlyph(editing),
        });
    }, [editing, onGlyphUpdate]);

    const onCopyGlyph = React.useCallback(() => {
        setCopied(serializeGlyph(editing));
    }, [editing]);

    const onPasteGlyph = React.useCallback(() => {
        if (!copied) return;

        const pasted = deserializeGlyph(copied);
        onGlyphUpdate({
            ...pasted,
            character: editing.character
        });
    }, [editing, onGlyphUpdate, copied]);

    const onSettingsClick = React.useCallback(() => {
        setSettingsOpen(true);
    }, []);

    const onImportClick = React.useCallback(() => {
        setImportOpen(true);
    }, []);

    const onUpClick = React.useCallback(() => {
        onGlyphUpdate(shiftGlyph(editing, 0, -1));
    }, [editing, onGlyphUpdate]);

    const onRightClick = React.useCallback(() => {
        onGlyphUpdate(shiftGlyph(editing, 1, 0));
    }, [editing, onGlyphUpdate]);

    const onDownClick = React.useCallback(() => {
        onGlyphUpdate(shiftGlyph(editing, 0, 1));
    }, [editing, onGlyphUpdate]);

    const onLeftClick = React.useCallback(() => {
        onGlyphUpdate(shiftGlyph(editing, -1, 0));
    }, [editing, onGlyphUpdate]);

    const onDownloadClick = React.useCallback(() => {
        browserDownloadText(serializeFont(font), "font.json");
    }, [font]);

    const onShareClick = React.useCallback(() => {
        setShareOpen(true);
    }, []);

    return (
        <>
            <div>
                <Button
                    appearance="subtle"
                    icon={<ArrowUp16Regular />}
                    title="Shift Up"
                    onClick={onUpClick} />
                <Button
                    appearance="subtle"
                    icon={<ArrowRight16Regular />}
                    title="Shift Right"
                    onClick={onRightClick} />
                <Button
                    appearance="subtle"
                    icon={<ArrowDown16Regular />}
                    title="Shift Down"
                    onClick={onDownClick} />
                <Button
                    appearance="subtle"
                    icon={<ArrowLeft16Regular />}
                    title="Shift Left"
                    onClick={onLeftClick} />
                <Button
                    appearance="subtle"
                    icon={<Copy16Regular />}
                    title="Copy"
                    onClick={onCopyGlyph} />
                <Button
                    appearance="subtle"
                    icon={<ClipboardPaste16Regular />}
                    title="Paste"
                    onClick={onPasteGlyph} />
                <Button
                    appearance="subtle"
                    icon={<Delete16Regular />}
                    title="Clear"
                    onClick={onClearGlyph} />
                <Button
                    appearance="subtle"
                    icon={<Settings16Regular />}
                    title="Settings"
                    onClick={onSettingsClick} />
                <Button
                    appearance="subtle"
                    icon={<ArrowDownload16Regular />}
                    title="Download Font"
                    onClick={onDownloadClick} />
                <Button
                    appearance="subtle"
                    icon={<ArrowUpload16Regular />}
                    title="Import font from file"
                    onClick={onImportClick} />
                <Button
                    appearance="subtle"
                    icon={<Share16Regular />}
                    title="Create share link"
                    onClick={onShareClick} />

            </div>
            {settingsOpen &&
                <SettingsDialog
                    font={font}
                    onFontUpdate={onFontUpdate}
                    onOpenChange={(_, data) => setSettingsOpen(data.open)}
                    open={settingsOpen}
                />
            }
            {importOpen &&
                <ImportDialog
                    onFontUpdate={onFontUpdate}
                    onOpenChange={(_, data) => setImportOpen(data.open)}
                    open={importOpen}
                />
            }
            {shareOpen &&
                <ShareDialog
                    font={font}
                    onOpenChange={(_, data) => setShareOpen(data.open)}
                    open={shareOpen}
                />
            }
        </>
    );
}