'use strict';

const fs = require('fs');
const log = console.log;

module.exports = function wFile(filePath, content, cb) {
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      log(`${filePath} 写入失败 ${err}`);
    } else {
      log(`${filePath} 写入成功`);
      if (cb) {
        cb();
      }
    }
  });
}
