'use strict';

const fs = require('fs');
const path = require('path');

const cheerio = require('cheerio');
const wFile = require('./util/wFile');

const filePath = path.resolve('cache', `www.chessgames.com_chessecohelp.html`);

const content = fs.readFileSync(filePath, 'utf8');
const $ = cheerio.load(content);

const eco = {};

$('tr').each((index, item) => {
  const $td = $(item).find('td');
  const key = $td.eq(0).text();
  const name = $td.eq(1).find('b').text();
  const notation = $td.eq(1).find('font').find('font').text();

  eco[key] = { name, notation };

});

wFile('eco.json', JSON.stringify(eco, null, '  '), () => {
  // console.log(`eco.json 写入成功`);
});
