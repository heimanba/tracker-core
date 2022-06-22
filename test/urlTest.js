var Url = require('url-parse');
var url = new Url('https://mse.console.aliyun.com/?spm=5176.14952521.J_5253785160.4.7d3923bcWXzguV&dankun=233#/');
console.log(url)


const qs = require('query-string');
const qq =qs.parse(url.query);
console.log(qq.spm)

