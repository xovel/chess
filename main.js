'use strict';

const fs = require('fs');
const path = require('path');

const dateFormat = require('./util/dateFormat');
const getHTML = require('./util/getHTML');
const wFile = require('./util/wFile');

function getName(str) {
  let name = str.replace(/https?:\/\//i, '').replace(/[\/\\:*?"'|<>]/g, '_').replace(/\.html?$/i, '') + '.html';
  let time = dateFormat(new Date(), 'yyyy_MM_dd_hh_mm_ss_');

  return time + name;
}

if (!fs.existsSync('cache')) {
  fs.mkdirSync('cache');
}

function fetchHTML(url) {
  getHTML(url).then((data) => {
    wFile(path.join(__dirname, 'cache', getName(url)), data);
  });
}

fetchHTML('http://www.chessgames.com/perl/gamesoftheday')
// fetchHTML('https://github.com/xovel/diary/blob/master/2018/01/2018-01-15-node-demo.md');
// fetchHTML('http://www.chessgames.com/perl/chessgame?gid=1151935')
