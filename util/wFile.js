'use strict';

const fs = require('fs');
const log = console.log;

module.exports = function wFile(filePath, content, cb) {
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      log(`${filePath} write failed, ${err}`);
    } else {
      log(`${filePath} write success`);
      if (cb) {
        cb();
      }
    }
  });
}
