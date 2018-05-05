'use strict';

const fs = require('fs');
const path = require('path');

const wFile = require('./util/wFile');
const parsePGN = require('./util/parsePGN');

const list = require('./pgn.json').list;
const pgn = {};

list.forEach(item => {
  pgn[item.date] = item;
});

const chessTemplate = fs.readFileSync(path.join(__dirname, 'template', 'chess.html'), 'utf-8');
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

del(distFolder + '/**/*').then(() => {
  // 复制资源文件
  copy('assets/**', './' + distFolder + '/assets', () => {
    console.log('copy assets done!')
  });

  // 生成首页
  wFile(path.join(__dirname, distFolder, 'index.html'), indexTemplate.replace('${content}', strIndexHTML.replace(/href="\/(\d{4}-\d{2}-\d{2})"/g, (a, b) => {
    return `href="./${b}.html"`;
  })));

  // 生成页面文件
  list.forEach(item => {
    const pgnPath = path.join(__dirname, 'pgn', `${item.date}-${item.id}.pgn`);
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
        // pgn 需要替换单引号，避免解析错误
        if (name === 'pgn') return data.pgn.replace(/'/g, '&rsquo;');
        return data[name] || '';
      });

      wFile(path.join(__dirname, distFolder, `${item.date}.html`), ret);
    }
  });
})
