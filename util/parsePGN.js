'use strict';

module.exports = function parsePGN(pgnText) {

  const regText = /(\d+)\. ?([^ ]+ )(\{([^}]+)\} )?([^ ]+ )(\{([^}]+)\} )?/g;
  const regText2 = new RegExp(regText.source);
  const regProp = /\[(\w+) "([^"]+)"\]/g;
  const regProp2 = new RegExp(regProp.source);

  const pgn = {};
  const temp = pgnText.split(']');
  const text = temp.pop().trim().replace(/\s$/mg, '').replace(/\n ?/g, ' ');
  const ret = text.match(regText);

  const notes = [];
  ret.forEach(item => {
    const itemParse = item.match(regText2);
    if (itemParse[4]) {
      notes.push((itemParse[1] - 1) * 2);
      notes.push(itemParse[4].trim());
    }
    if (itemParse[7]) {
      notes.push((itemParse[1] - 1) * 2 + 1);
      notes.push(itemParse[7].trim());
    }
  });

  const props = pgnText.match(regProp);
  props.forEach(prop => {
    const propParse = prop.match(regProp2);
    pgn[propParse[1]] = propParse[2];
  });

  pgn.notes = JSON.stringify(notes).replace(/'/g, '&rsquo;');

  pgn.origText = pgnText;
  // pgn.pgnText = pgnText.replace(/\{[^}]+\} ?/g, '');

  pgn.steps = text.replace(/\{[^}]+\} ?/g, '');

  temp.push('\n\n' + pgn.steps);
  pgn.pgnText = temp.join(']');

  // pgn.result = pgnText.match(/([^ ]+)\s*$/)[1].trim();

  return pgn;
}
