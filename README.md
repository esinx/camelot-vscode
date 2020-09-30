# camelot-vscode

Visual Studio Code extension for camelot. Adds linting support based on arthur.json by default!

**It's a PoC! Please make pull requests!**

## Usage

First, make sure you have all the dependencies

```sh
npm install
```

Then run tsc

```sh
npm run compile
```

Then pack the build

```sh
# npm i -g vsce
vsce package
```

You should get a `.vsix` file. Install it using `Extensions: Install from VSIX...` from the vscode menu!

## How it works

Whenever a change in an OCaml source is detected, the language server runs `camelot` and filters the warnings for this specific file. The output is set to be displayed with the `-show json`(pr in progress) option, which is then parsed to be communicated with the vscode client.

## Capabilities

-   Show inline linter warnings based on line/col

## Todo

-   [x] allow user to set `CAMELOT_PATH`
-   [ ] custom `arthur.json` configuration
-   [ ] integration with prettier to fix formatting issues (ex. 80 col)
-   [x] fix suggestion

## Credits

Many of the code is taken from the vscode extension examples repo: https://github.com/microsoft/vscode-extension-samples/tree/master/lsp-sample

## License

Copyright 2020 Eunsoo Shin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
