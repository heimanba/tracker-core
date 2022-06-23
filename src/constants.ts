export const pluginConfig = {
  "aliyun-xhr": {
    enable: true,
    config: {},
  },
  spm: {
    enable: true,
  },
  pv: {
    enable: false,
    config: {
      filter(object) {
        return object.hash;
      },
    },
  },
  uv: {
    enable: true,
  },
};
