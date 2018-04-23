module.exports = function dateFormat(v, format = 'YYYY-MM-DD') {
  let _date = v instanceof Date ? v : new Date(v);

  if (isNaN(_date.getTime())) {
    // 日期转换失败则原值返回
    return v;
  }

  let ret = format;

  var o = {
    'M+': _date.getMonth() + 1, // month
    'd+': _date.getDate(), // day
    'D+': _date.getDate(), // day
    'h+': _date.getHours(), // hour
    'm+': _date.getMinutes(), // minute
    's+': _date.getSeconds(), // second
    'S': _date.getMilliseconds() // millisecond
  };

  // 年份处理
  ret = ret.replace(/y+/i, function (year) {
    return ('' + _date.getFullYear()).substr(4 - year.length);
  });

  // 其他格式化处理
  for (var k in o) {
    ret = ret.replace(new RegExp(k), function (v) {
      // 补零操作
      if (v.length > 1) {
        return ('00' + o[k]).substr(('' + o[k]).length);
      }
      return o[k];
    });
  }

  return ret;

}
