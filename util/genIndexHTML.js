'use strict';

const pgn = {};

// Generate static files
function genListHTML(list) {
  const first = {};
  const last = {};
  first.item = list[0];
  last.item = list[list.length - 1];

  first.year = +first.item.date.split('-')[0];
  first.month = +first.item.date.split('-')[1];

  last.year = +last.item.date.split('-')[0];
  last.month = +last.item.date.split('-')[1];

  let ret = [];

  for (let i = first.year; i >= last.year; i--) {
    if (i === first.year) {
      for (let j = first.month; j >= 1; j--) {
        ret.push(genMonthHTML(i, j));
      }
    } else if (i === last.year) {
      for (let j = 12; j >= last.month; j--) {
        ret.push(genMonthHTML(i, j));
      }
    } else {
      for (let j = 12; j >= 1; j--) {
        ret.push(genMonthHTML(i, j));
      }
    }
  }

  return `<ul>${ret.join('')}
</ul>`;
}

function genMonthHTML(year, month) {
  const title = `${year}-${month < 10 ? '0' + month : month}`;
  const date = new Date();
  date.setFullYear(year);
  date.setMonth(month);
  date.setDate(0); // Get days in specified month, ~~it's a black tech~~.

  const days = date.getDate();

  date.setMonth(month - 1);
  date.setDate(1);
  const startDay = date.getDay();

  // Calender of month
  const weeks = [];
  let curIndex = 0;
  while (curIndex < days) {
    let num = startDay + curIndex;
    let curCount = Math.floor(num / 7);
    weeks[curCount] = weeks[curCount] || [];
    weeks[curCount][num % 7] = curIndex + 1;

    curIndex++;
  }

  const cells = [];
  for (let i = 0; i < weeks.length; i++) {
    let rows = [];
    for (let j = 0; j < 7; j++) {
      rows.push(`
          <td>${genCellHTML(year, month, weeks[i][j])}</td>`);
    }

    cells.push(`
        <tr>${rows.join('')}
        </tr>`);
  }

  return `
  <li class="item">
    <h3>${title}</h3>
    <table class="table" cellspacing=0 cellpadding=5 border=1>
      <thead>
        <tr>
          <th>S</th>
          <th>M</th>
          <th>T</th>
          <th>W</th>
          <th>T</th>
          <th>F</th>
          <th>S</th>
        </tr>
      </thead>
      <tbody>${cells.join('')}
      </tbody>
    </table>
  </li>`;

}

function genCellHTML(year, month, date) {
  let ret = '';
  if (date) {
    const name = `${year}-${month < 10 ? '0' + month : month}-${date < 10 ? '0' + date : date}`;
    if (pgn[name]) {
      ret = `<a href="/${name}" title="${name} ${pgn[name].players}">${date}</a>`;
    } else {
      ret = date;
    }
  }
  return ret;
}

module.exports = function genIndexHTML(list) {

  list.forEach(item => {
    pgn[item.date] = item;
  });

  return genListHTML(list);
}
