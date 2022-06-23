import Url from "url-parse";
import { pluginConfig } from "./constants";
import defaultPlugins from "./plugins";

export const getHost = (url) => {
  if (!url) return undefined;
  const { hostname } = new Url(url);
  const curUrl = new Url(document.location.href);
  if (curUrl.hostname === hostname) return undefined;
  return hostname;
};

export const slsSendObject = (params) => {
  for (const key in params) {
    if (!params[key]) {
      delete params[key];
    }
  }
  return params;
};

/**
 * defaultPlugins格式为
 * xhr: {
 *  enable: true,
 *  package: './xhr'
 * }
 * @param defaultPlugins
 * @param plugins
 */
const mergePlugins = (defaultPlugins = {}, plugins = {}) => {
  for (const key in plugins) {
    if (typeof plugins[key] === "boolean") {
      defaultPlugins[key].enable = plugins[key];
      delete plugins[key];
    }
  }
  return Object.assign({}, defaultPlugins, plugins);
};

const isDefaultPlugin = (key, value) => {
  for (const prop in pluginConfig) {
    if (key === prop) {
      // 用户传递了package字段，则代表非默认插件
      if (value.package) {
        return false;
      }
      return true;
    }
  }
  return false;
};

export const processPlugins = (send, plugins) => {
  const initPlugins = mergePlugins(pluginConfig, plugins);
  for (const key in initPlugins) {
    const plugin = initPlugins[key];
    if (plugin.enable) {
      if (isDefaultPlugin(key, initPlugins[key])) {
        defaultPlugins[key](send, plugin.config || {});
      } else {
        // eslint-disable-next-line
        const module = require(plugin.package);
        module(send, plugin.config);
      }
    }
  }
};
