'use strict';

const fs = require('fs');
const path = require('path');

const wFile = require('./util/wFile');
const parsePGN = require('./util/parsePGN');

const list = require('./pgn.json').list;
const pgn = {};

const args = process.argv.splice(2);
const useCDN = args.indexOf('--cdn') >= 0;
const isForce = args.indexOf('--force') >=0;

list.forEach(item => {
  pgn[item.date] = item;
});

const chessTemplate = fs.readFileSync(path.join(__dirname, 'template', useCDN ? 'chess.cdn.html' : 'chess.html'), 'utf-8');
const indexTemplate = fs.readFileSync(path.join(__dirname, 'template', 'index.html'), 'utf-8');

const genIndexHTML = require('./util/genIndexHTML');

const eco = require('./eco.json');

const strIndexHTML = genIndexHTML(list);

const distFolder = 'docs';

if (!fs.existsSync(distFolder)) {
  fs.mkdirSync(distFolder);
}

const del = require('del');
const copy = require('copy');

function copyAssets() {
  // Copy assets.
  copy('assets/**', './' + distFolder + '/assets', () => {
    console.log('copy assets done!')
  });
}

function genIndex() {
  // Generate index page.
  wFile(path.join(__dirname, distFolder, 'index.html'), indexTemplate.replace('${content}', strIndexHTML.replace(/href="\/(\d{4}-\d{2}-\d{2})"/g, (a, b) => {
    return `href="./${b}.html"`;
  })));
}

async function genPGN(force) {
  // Generate static files.
  const arr = list.slice().reverse();
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const pgnPath = path.join(__dirname, 'pgn', `${item.date}-${item.id}.pgn`);
    const destPath = path.join(__dirname, distFolder, `${item.date}.html`);
    if (fs.existsSync(destPath) && !force) {
      continue;
    }
    if (fs.existsSync(pgnPath)) {
      const pgnContent = fs.readFileSync(pgnPath);
      const pgnObj = parsePGN(pgnContent.toString());
      const players = item.players.split(' vs ');
      const data = {
        title: `${item.players} (${item.year}) ${item.note}`,
        player1: players[0],
        player2: players[1],
        note: item.note,
        date: item.date,
        pgn: pgnObj.pgnText,
        notes: pgnObj.notes,
        opening: pgnObj.ECO,
        result: pgnObj.Result,
        info: `${pgnObj.Event} (${pgnObj.Date}), ${pgnObj.Site}`
      };

      if (eco[pgnObj.ECO]) {
        data.opening = `${eco[pgnObj.ECO].name}(${pgnObj.ECO})`;
      }

      const ret = chessTemplate.replace(/\${([^}]*)}/g, (content, name) => {
        // replace sigle quote to avoid parse error
        if (name === 'pgn') return data.pgn.replace(/'/g, '&rsquo;');
        return data[name] || '';
      });

      await wFile(path.join(__dirname, distFolder, `${item.date}.html`), ret);
    }
  };
}

if (isForce) {
  del(distFolder + '/**/*').then(() => {
    genIndex();
    copyAssets();
    genPGN(true);
  })
} else {
  genIndex();
  genPGN();
}
