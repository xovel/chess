'use strict';

const fs = require('fs');
const path = require('path');

const cheerio = require('cheerio');

const getHTML = require('./util/getHTML');
const wFile = require('./util/wFile');
const dateFormat = require('./util/dateFormat');

const now = new Date();

const mapMonth = {
  'Jan': 0,
  'Feb': 1,
  'Mar': 2,
  'Apr': 3,
  'May': 4,
  'Jun': 5,
  'Jul': 6,
  'Aug': 7,
  'Sep': 8,
  'Oct': 9,
  'Nov': 10,
  'Dec': 11
};

let prePGN = {};
if (fs.existsSync('./pgn.json')) {
  try {
    prePGN = require('./pgn.json');
  } catch (e) {
    prePGN = {};
  }
}

const ret = [];

const update = prePGN.update;

const curDate = dateFormat(now);
const yesterday = dateFormat(now.getTime() - 24 * 60 * 60 * 1000);

if (curDate === update || yesterday === update) {
  console.log('Neither yesterday nor today would be ignored.');
  process.exit(0);
}

getHTML('http://www.chessgames.com/perl/gamesoftheday').then(data => {
  const $ = cheerio.load(data);
  const $list = $('a[href^="/perl/chessgame"]');
  let nowYear = now.getFullYear();
  let prevMonth = now.getMonth();
  let diffYear = 0;
  let yearFlag = false;

  $list.each((index, item) => {
    const $item = $(item);
    const curDate = $item.prevAll('font').eq(-1).html();
    const curNote = $item.prevAll('font').eq(-2).html().replace(/<\/?b>/g, '');
    const curHref = $item.attr('href');
    const curText = $item.html();
    const curId = curHref.split('=')[1];
    const tempArr = curDate.split('-');
    const curMonth = mapMonth[tempArr[0]];
    const curMonth2 = curMonth < 9 ? '0' + (curMonth + 1) : (curMonth + 1);
    let curYear = nowYear;

    // [FIX] some special date is not exist.
    if (curMonth === 11 && prevMonth === 0 && !yearFlag) {
      diffYear++;
      yearFlag = true;
    } else if (prevMonth === 11) {
      yearFlag = false;
    }

    const curDate2 = `${curYear - diffYear}-${curMonth2}-${tempArr[1]}`;

    if (update === curDate2) {
      return false;
    }

    ret.push({
      date: curDate2,
      year: (curText.match(/\d{4}$/) || [])[0] || 0,
      players: curText.split(',')[0],
      link: curHref,
      id: curId,
      note: curNote
    });

    prevMonth = curMonth;
  });

  if (ret.length > 0) {
    const pgn = {
      update: ret[0].date,
      list: ret.concat(prePGN.list || [])
    };
    wFile('pgn.json', JSON.stringify(pgn, null, '  '), () => {
      console.log(`Record data(s): ${ret.length}`);
    });

  } else {
    console.log('No need to update.')
  }
});
