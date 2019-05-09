'use strict';

const getHTML = require('./util/getHTML');
const wFile = require('./util/wFile');

const pgn = require('./pgn.json');

const fs = require('fs');
const path = require('path');

const list = pgn.list;

if (!fs.existsSync('pgn')) {
  fs.mkdirSync('pgn');
}

list.forEach(item => {
  const curFile = path.join(__dirname, 'pgn', `${item.date}-${item.id}.pgn`);

  if (!fs.existsSync(curFile)) {
    console.log(curFile)
    getHTML(`http://www.chessgames.com/perl/nph-chesspgn?text=1&gid=${item.id}`).then((data) => {
      wFile(curFile, data);
    });
  }

})
