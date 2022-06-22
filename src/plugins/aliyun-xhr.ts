import { proxy } from "ajax-hook";
import Url from "url-parse";

// sls 请求不走proxy代理
const isAliyunCsUrl = (url) => {
  const { hostname } = new Url(url);
  return hostname.indexOf("aliyuncs.com") > 0;
};

const isAliyunConsoleUrl = (url) => {
  const { hostname } = new Url(url);
  return hostname.indexOf("console.aliyun.com") > 0;
};

const isSuccessCode = (res) => {
  if (res.code !== undefined) {
    return (
      res.code === 200 ||
      res.code === "200" ||
      res.Code === "Success" ||
      res.code === "Success"
    );
  }
  if (res.successResponse !== undefined) {
    return res.successResponse === 200 || res.successResponse === "200";
  }

  if (res.success !== undefined) {
    return res.success;
  }

  if (res.Success !== undefined) {
    return res.Success;
  }
  return true;
};

const errorMessage = (res) => {
  return JSON.stringify({
    message: res.message || res.Message,
    traceId: res.traceId || res.TraceId || res.requestId || res.RequestId,
  });
};

const formatExposeUrl = (url) => {
  try {
    return url.replace(/^\//, "");
  } catch (error) {
    return undefined;
  }
};

const XHR_ERROR = "xhrError";

export default (send) => {
  proxy({
    onRequest: (config, handler) => {
      handler.next(config);
    },
    //请求发生错误时进入，比如超时；注意，不包括http状态码错误，如404仍然会认为请求成功
    onError: (err, handler) => {
      const url = formatExposeUrl(err.config.url);
      if (isAliyunCsUrl(url) || !url) return handler.next(err);
      const errorObj: any = err;
      const errorMsg = errorObj?.error?.message;
      if (errorMsg) {
        send({
          name: url,
          type: XHR_ERROR,
          payload: errorMsg,
        });
      }
      handler.next(err);
    },
    //请求成功后进入
    onResponse: (res, handler) => {
      const url = formatExposeUrl(res.config.url);
      if (isAliyunCsUrl(url) || !url) return handler.next(res);
      // 状态码
      if (res.status !== 200) {
        try {
          const responseData = JSON.parse(res.response);
          send({
            name: url,
            type: XHR_ERROR,
            errorCode: responseData.code || responseData.Code,
            payload: errorMessage(responseData),
          });
        } catch (error) {
          send({
            name: url,
            type: XHR_ERROR,
            payload: res.response,
          });
        }
      } else {
        if (isAliyunConsoleUrl(url)) {
          try {
            const resJson = JSON.parse(res.response);
            const { data } = resJson || {};
            // 非200直接报错
            if (!isSuccessCode(resJson)) {
              send({
                name: url,
                type: XHR_ERROR,
                errorCode: data.code || data.Code,
                payload: errorMessage(data),
              });
            }
            if (!isSuccessCode(data)) {
              send({
                name: url,
                type: XHR_ERROR,
                errorCode: data.code || data.Code,
                payload: errorMessage(data),
              });
            }
          } catch (error) {}
        }
      }
      handler.next(res);
    },
  });
};
