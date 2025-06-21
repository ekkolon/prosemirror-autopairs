# prosemirror-autopairs

Smart auto-pairing of brackets and quotes for ProseMirror editors.

👉 [**Try it live on StackBlitz**](https://stackblitz.com/edit/prosemirror-autopairs?embed=1&hideExplorer=1&hideNavigation=1&view=preview)

## Features

- 🪄 Auto-inserts matching characters like `()`, `{}`, `""`, etc.
- 🧠 Smart backspace: deletes pairs when cursor is between them
- ✍️ Wraps selected text with the typed opening/closing pair
- 🎯 Skips typing if the closing character is already present

### Auto-Paired Characters

| **Character Pair** | **Name**        |
| ------------------ | --------------- |
| `< >`              | Angle brackets  |
| `{ }`              | Curly braces    |
| `( )`              | Parentheses     |
| `[ ]`              | Square brackets |
| `" "`              | Double quotes   |
| `' '`              | Single quotes   |

## Installation

```bash
npm install prosemirror-autopairs
```

## Usage

This plugin accepts an optional `AutopairsOptions` object to enable or disable specific groups of _auto-closable_ characters.

If no options are passed, **all groups are enabled by default**.

```ts
import { autopairs } from 'prosemirror-autopairs';

const plugins = [
  ...autopairs({
    angleBrackets: true,
    curlyBrackets: true,
    roundBrackets: true,
    squareBrackets: true,
    doubleQuotes: true,
    singleQuotes: true,
  }),
];
```

## License

This project is licensed under the [MIT License](./LICENSE).
