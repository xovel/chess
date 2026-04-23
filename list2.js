'use strict';

const puppeteer = require('puppeteer');

const path = require('path');
const fs = require('fs');

const wFile = require('./util/wFile');

const pgn = require('./pgn.json');

const sleep = t => new Promise(r => {
  console.log('sleep...', t);
  setTimeout(() => {
    r();
  }, t);
});

function rnd(a, b) {
  return a + Math.floor(Math.random() * (b - a))
}

const list = pgn.list;

if (!fs.existsSync('pgn')) {
  fs.mkdirSync('pgn');
}

if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp');
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

  let needGotoPage = true;

  let wait = 5000;
  let n = 0;
  let retry = false;

  async function loop() {

    for (const item of list) {

      const curFile = path.join(__dirname, 'pgn', `${item.date}-${item.id}.pgn`);

      if (fs.existsSync(curFile)) {
        const fileContent = fs.readFileSync(curFile).toString();
        if (fileContent && fileContent[0] === '[') {
          console.log('file exist, ingored...', curFile);
          continue;
        }
        console.log('File exists, but content error', fileContent);
        console.log('deleting...', curFile);
        fs.unlinkSync(curFile);
        console.log('Ignored');
        continue;
      }

      const p = `https://www.chessgames.com/perl/nph-chesspgn?text=1&gid=${item.id}`;

      if (needGotoPage) {
        await page.goto(p);
        needGotoPage = false;
      }

      await sleep(wait + rnd(0, 800));
      n++;
      if (n % 5 === 0) {
        wait += rnd(0, 2000);
      }

      // const text = await page.evaluate(() => {
      //   return document.querySelector('html').innerText;
      // });

      console.log('fetch...', p);

      const text = await page.evaluate(async function (url) {
        return await fetch(url).then(res => res.text());
      }, p);

      if (text[0] !== '[') {
        console.log('file error', text);
        const tempFilePath = path.join(__dirname, 'temp', `${item.date}-${item.id}-${Date.now()}.html`);
        await wFile(tempFilePath, text);
        retry = true;
        break;
      }

      await wFile(curFile, text);
    }

    if (retry) {
      retry = false;
      wait = 5000;
      n = 0;
      console.log('retry...');
      await sleep(120000);
      await loop();
    }

  }

  await loop();

  await browser.close();
};

fetchList();
