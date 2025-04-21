import React from 'react';
import './App.css';
import { GlyphEditor } from './components/glyphEditor';
import { deserializeFont, Font, hexEncodeFont, serializeFont } from './lib/font';

const LOCAL_FONT_KEY = "LOCAL_FONT";

let font: Font | undefined;


if (localStorage[LOCAL_FONT_KEY]) {
    font = deserializeFont(localStorage[LOCAL_FONT_KEY]);
}

if (!font?.glyphs.length) {
    font = new Font({
        defaultWidth: 14,
        defaultHeight: 12,
        ascenderHeight: 1,
        descenderHeight: 4,
        kernWidth: 2,
        xHeight: 6,
        letterSpacing: 1,
        wordSpacing: 5,
        lineSpacing: 1,
        twoTone: true,
        autoKern: true
    });
}

function App() {
    const onFontUpdate = React.useCallback((newFont: Font) => {
        font = newFont;
        localStorage[LOCAL_FONT_KEY] = serializeFont(newFont);
        console.log(hexEncodeFont(font));
    }, []);

    return (
        <div className="App">
            <GlyphEditor
                font={font!}
                onFontUpdate={onFontUpdate}
            />
        </div>
    );
}

export default App;
