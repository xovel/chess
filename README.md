# chess

Chess for fun.

## Statement

All data in this project was gathered from <http://www.chessgames.com>. Just for fun and interest.

## Dependencies

- [`express`](https://expressjs.com)
- [`cheerio`](https://cheerio.js.org/)

## File

```
├─ assets/                     #
├─ cache/                      #
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
├─ LICENSE                     #
├─ list.js                     #
├─ main.js                     #
├─ package.json                #
├─ parse.js                    #
├─ pgn.json                    #
└─ README.md                   #
```

## Run

1. `node main`. Fetch the source code of <http://www.chessgames.com/perl/gamesoftheday>.
2. `node parse`. Parse the source code, you may need to **change** the file name if necessary.
3. `node list`. Fetch `pgn` file.
4. `node app`. Run a local `express` instance.
5. Open a mordern browser and visit `http://localhost:2000/`

## TODO

- [x] Add notes from `.pgn` files.
- [x] Mobile visit. ~~?~~
- [ ] ECO openings.
- [ ] Generate static html files.

## Lisence

MIT
