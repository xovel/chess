'use strict';

const fs = require('fs');
const log = console.log;

module.exports = function wFile(filePath, content, cb) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        log(`${filePath} write failed, ${err}`);
        reject(err);
      } else {
        log(`${filePath} write success`);
        if (cb) {
          cb();
        }
        resolve();
      }
    });
  });
}
