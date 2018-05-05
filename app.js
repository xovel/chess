'use strict';

const fs = require('fs');
const path = require('path');
// const os = require('os');

const express = require('express');
const app = express(); // express instance

// static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const list = require('./pgn.json').list;
const pgn = {};

list.forEach(item => {
  pgn[item.date] = item;
});

const chessTemplate = fs.readFileSync(path.join(__dirname, 'template', 'chess.html'), 'utf-8');
const indexTemplate = fs.readFileSync(path.join(__dirname, 'template', 'index.html'), 'utf-8');

const genIndexHTML = require('./util/genIndexHTML');
const parsePGN = require('./util/parsePGN');

const eco = require('./eco.json');

const strIndexHTML = genIndexHTML(list);

app.get('/:date', (req, res) => {
  const date = req.params.date;
  if (pgn[date]) {
    const item = pgn[date];
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
        // replace sigle quote to avoid parse error
        if (name === 'pgn') return data.pgn.replace(/'/g, '&rsquo;');
        return data[name] || '';
      });

      res.send(ret)
    } else {
      res.send('PGN file not found.');
    }
  } else {
    res.send('404');
  }
});

app.get('/', (req, res) => {
  let ret = indexTemplate.replace('${content}', strIndexHTML);
  res.send(ret);
});

// listen local port 2000
const server = app.listen(2000, function () {
  const port = server.address().port;
  console.log('Project listening at http://localhost:%s', port);
});
