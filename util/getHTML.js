'use strict';

const http = require('http');
const https = require('https');

module.exports = function getHTML(url) {

  return new Promise(function (resolve, reject) {
    (/^https/i.test(url) ? https : http).get(url, function (res) {
      var html = '';

      res.on('data', function (chunk) {
        // chunk 是一个 Buffer 类的实例，为请求获得的数据，使用 toString 方法可以直接得到对应的字符串
        html += chunk;
      });

      res.on('end', function () {
        resolve(html);
      });
    }).on('error', function () {
      reject();
    });
  });
}
