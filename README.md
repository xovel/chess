# chess

Chess for fun.

## Statement

All data in this project was gathered from <http://www.chessgames.com>. Just for fun and interest.

## Dependencies

- [`express`](https://expressjs.com), run a local server.
- [`cheerio`](https://cheerio.js.org/), load content as a jQuery-DOM-like object.
- [`copy`](https://github.com/jonschlinkert/copy), copy assets files.
- [`del`](https://github.com/sindresorhus/del), delete distribute folder.

## CLI

1. `node main`. Fetch the source code of <http://www.chessgames.com/perl/gamesoftheday>.
2. `node parse`. Parse the source code, you may need to **change** the file name if necessary.
3. `node list`. Fetch `pgn` file.
4. `node app`. Run a local `express` instance.
5. Open a modern browser and visit `http://localhost:2000/`
6. `node gen`. Generate static html files to the specified folder.
7. `node update`. Update `pgn.json` directly.

## Scripts

- `npm run update`, update `pgn.json` and fetch new `pgn` file.
- `npm run dev`, run `update` and start a local server.

## File

```
├─ assets/                     #
├─ cache/                      #
├─ docs/                       #
├─ node_modules/               #
├─ pgn/                        #
├─ template/                   #
│  ├─ chess.html               #
│  └─ index.html               #
├─ util/                       #
│  ├─ dateFormat.js            #
│  ├─ genIndexHTML.js          #
│  ├─ getHTML.js               #
│  ├─ parsePGN.js              #
│  └─ wFile.js                 #
├─ .gitignore                  #
├─ .npmrc                      #
├─ app.js                      #
├─ eco.js                      #
├─ eco.json                    #
├─ gen.js                      #
├─ LICENSE                     #
├─ list.js                     #
├─ main.js                     #
├─ package.json                #
├─ parse.js                    #
├─ pgn.json                    #
├─ README.md                   #
└─ update.js                   #
```

## TODO

- [x] Add notes from `.pgn` files.
- [x] Mobile visit. ~~?~~
- [x] ECO openings.
- [x] Generate static html files.

## Lisence

MIT
