## 自定义监控探针

本探针依赖于 aliyun SLS 进行数据上报

## 使用方式

### 初始化探针

```javascript
import core from "@serverless-devs/tracker-core";
// 初始化探针
core.init(productName, {
  slsRegion: "cn-hangzhou",
  slsProject: "store",
  ...initOptions,
});
```

### 使用探针
1. 使用全局的变量
```javascript
window.CN_TRACKER.send({
  name: "create-app",
});
```
2. 使用局部的变量
```javascript
import core from "@serverless-devs/tracker-core";
core.send({
  name: "create-app",
});
```
