# prosemirror-autopairs

Smart auto-pairing of brackets and quotes for ProseMirror editors.

**Supported auto-pairs**:

`< >`   `{ }`   `( )`   `[]`   `"`   `'`

## Features

- 🪄 Auto-inserts matching characters like `()`, `{}`, `""`, etc.
- 🧠 Smart backspace: deletes pairs when cursor is between them
- ✍️ Wraps selected text with the typed opening/closing pair
- 🎯 Skips typing if the closing character is already present

## Usage

This plugin accepts an optional `AutopairsOptions` object to enable or disable specific groups of *auto-closable* characters.

If no options are passed, **all groups are enabled by default**.

```ts
import { autopairs } from 'prosemirror-autopairs';

const plugins = [
  autopairs({
    angleBrackets: true,      // < >
    curlyBrackets: true,      // { }
    roundBrackets: true,      // ( )
    squareBrackets: true,     // [ ]
    doubleQuotes: true,       // "
    singleQuotes: true,       // '
  }),
];
```
