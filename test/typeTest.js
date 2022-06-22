// const urlTest = require("./urlTest");

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
  return Object.assign({}, defaultPlugins, plugins)
};

const plugs = mergePlugins({
  xhr: {
    enable: true,
    package: './xhr'
  }
}, {
  xhr: false,
  mongoose: {
    enable: true,
    package: 'egg-mongoose',
  }
});

console.log(plugs);