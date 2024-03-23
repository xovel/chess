'use strict';

const puppeteer = require('puppeteer');

const path = require('path');
const fs = require('fs');

const wFile = require('./util/wFile');

const pgn = require('./pgn.json');

const list = pgn.list;

if (!fs.existsSync('pgn')) {
  fs.mkdirSync('pgn');
}

async function fetchList() {
  const browser = await puppeteer.launch({
    headless: false,
  });

  let page;
  const pages = await browser.pages();

  if (pages[0]) {
    page = pages[0]
  } else {
    page = await browser.newPage();
  }

  for (const item of list) {

    const curFile = path.join(__dirname, 'pgn', `${item.date}-${item.id}.pgn`);

    if (fs.existsSync(curFile)) {
      continue;
    }

    const p = `https://www.chessgames.com/perl/nph-chesspgn?text=1&gid=${item.id}`;
    await page.goto(p);

    const text = await page.evaluate(() => {
      return document.querySelector('html').innerText;
    });

    await wFile(curFile, text);
  }

  await browser.close();
};

fetchList();
