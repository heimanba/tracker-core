import SlsWebLogger from "js-sls-logger";
import { slsSendObject, processPlugins } from "./lib";
declare global {
  interface Window {
    CN_TRACKER: {
      version?: string;
      init?: any;
      send?: (options: ISendConfig, params) => void;
      __slsInstance?: any;
    };
  }
}

export interface IInitConfig {
  enable?: boolean;
  plugins?: Record<string, string>;
  slsRegion?: string;
  slsProject?: string;
  excludes?: string[];
  [key: string]: any;
}

export interface ISendConfig {
  name: string;
  type: string;
  [key: string]: any;
}

let initialized = false;
window.CN_TRACKER = window.CN_TRACKER || {
  version: "0.1.5",
};

export const send = (options: ISendConfig) => {
  const slsOptions = slsSendObject(options);
  const { name, type = "event", ...params } = slsOptions;
  const slsInstance = window.CN_TRACKER.__slsInstance;
  if (!slsInstance.enable) return;
  if (
    Array.isArray(slsInstance.excludes) &&
    slsInstance.primaryKey &&
    slsInstance.excludes.includes(slsInstance.primaryKey)
  ) {
    return;
  }
  slsInstance.send(
    slsSendObject({
      trackerName: name,
      trackerType: type,
      ...slsInstance.initOptions,
      ...params,
    })
  );
};

export const init = (productName: string, options: IInitConfig = {}) => {
  const {
    enable = true,
    plugins,
    slsRegion,
    slsProject,
    excludes,
    primaryKey,
    ...initOptions
  } = options;

  if (initialized) {
    return window.CN_TRACKER;
  }
  initialized = true;

  const SLS_OPT = {
    host: `${slsRegion}.log.aliyuncs.com`,
    project: slsProject,
    logstore: productName,
    time: 1,
    count: 10,
  };

  const slsLogger = new SlsWebLogger(SLS_OPT);
  Object.assign(slsLogger, {
    enable,
    excludes,
    primaryKey,
    initOptions: initOptions || {},
  });

  window.CN_TRACKER.__slsInstance = slsLogger;
  window.CN_TRACKER.send = send;

  processPlugins(send, plugins);
  return window.CN_TRACKER;
};

export default { init, send };
