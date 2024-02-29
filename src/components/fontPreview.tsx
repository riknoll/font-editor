import React from "react";
import { Font } from "../lib/font";
import { renderPreview } from "../lib/preview";

export interface FontPreviewProps {
    text: string;
    font: Font;
}

export const FontPreview = (props: FontPreviewProps) => {
    const { text, font } = props;

    const ref = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = ref.current!;

        renderPreview(font, text, canvas);

    }, [text, font])

    return <canvas ref={ref} style={{imageRendering: "pixelated"}} />
};
