var Url = require('url-parse');
var url = new Url('https://mse.console.aliyun.com/#/dankun/');
console.log(url)


const qs = require('query-string');
const qq =qs.parse(url.query);
console.log(qq.spm)

