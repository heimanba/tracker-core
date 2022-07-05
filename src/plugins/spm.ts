import Url from "url-parse";
import { getHost } from "../lib";

interface IConfig {
  whileAttr?: string;
  getTrackerType?: any;
}

const getRedirectUrl = (url) => {
  if (!url) return "";
  const { hostname, pathname, hash } = new Url(url);
  return `${hostname}${pathname}${hash}`;
};

const parseTrackerAttr = (attr: string) => {
  if (!attr) return {};
  const attrList = attr.split("&");
  const attrMap = {};
  if (attrList.length <= 1) {
    return attrMap;
  }
  attrList.forEach((item) => {
    const list = item.split("=");
    if (list.length > 1) {
      attrMap[list[0]] = list[1];
    } else {
      attrMap["name"] = list[0];
    }
  });
  return attrMap;
};

const htmlTreeToStr = function (rootNode, config: IConfig) {
  if (!(rootNode && rootNode.nodeType === 1)) return "";
  let currentElem = rootNode || null;
  const MAX_TRAVERSE_HEIGHT = 45;
  const out = {
    attr: [],
    tag: [],
  };
  let height = 0;
  while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
    const nextAttrStr = htmlNodeToStr(currentElem, config, true);
    const nextALinkStr = htmlNodeToStr(currentElem, config, false);
    if (nextAttrStr) {
      out.attr.push(nextAttrStr);
    }
    if (nextALinkStr) {
      out.tag.push(nextALinkStr);
    }
    currentElem = currentElem.parentNode;
  }

  return out;
};

const htmlNodeToStr = function (htmlNode, config: IConfig, isAttr) {
  let out = null;
  const { whileAttr } = config;
  if (!htmlNode || typeof htmlNode.tagName !== "string") {
    return null;
  }
  const myAttrWhitelist = ["data-tracker", "data-wrapper"]
    .concat([whileAttr])
    .filter((item) => item);

  if (isAttr) {
    for (let i = 0; i < myAttrWhitelist.length; i++) {
      const attr = htmlNode.getAttribute(myAttrWhitelist[i]);
      if (typeof attr === "string") {
        out = htmlNode;
      }
    }
  } else {
    if (htmlNode.tagName.toLowerCase() === "a") {
      return htmlNode;
    }
  }

  return out;
};

const _getDateTrackerValues = (treeNode, aNode, config: IConfig) => {
  const { getTrackerType, whileAttr } = config;
  const defaultTrackerType = getTrackerType() || null;
  const [latestNode, parentNode] = treeNode;
  let latestTrckerValue = null;
  if (latestNode) {
    latestTrckerValue =
      latestNode.getAttribute("data-tracker") ||
      latestNode.getAttribute(whileAttr);
  }
  const latestWrapperValue =
    latestNode && latestNode.getAttribute("data-wrapper");
  const parentWrapperValue =
    parentNode && parentNode.getAttribute("data-wrapper");

  if (latestTrckerValue) {
    return {
      name: latestTrckerValue,
      type: parentWrapperValue,
      ...parseTrackerAttr(latestTrckerValue),
    };
  }

  if (aNode) {
    const href = aNode.getAttribute("href");
    const redirectHost = getHost(href);
    //  外链跳转，比如http://www.baidu.com
    if (redirectHost) {
      return {
        name: getRedirectUrl(href),
        type: latestWrapperValue || defaultTrackerType || "redirect",
      };
    }
  } else {
    const tracker = {
      name: latestTrckerValue,
      type: parentWrapperValue,
      ...parseTrackerAttr(latestTrckerValue),
    };
    if (tracker.name) {
      return tracker;
    }
  }
  return null;
};

const addBehavior = (behavior, send, config) => {
  const { attr: treeAttrNode, tag: treeTagNode } = behavior.treeNode;
  const [aNode] = treeTagNode;
  const trackerObject = _getDateTrackerValues(treeAttrNode, aNode, config);
  if (trackerObject) {
    send(trackerObject);
  }
};

const bhEventHandler = (eventName: string, send, config: IConfig) => {
  let lastEvent = null;
  return function (event) {
    if (!event || event === lastEvent) return;
    lastEvent = event;
    let target;
    try {
      target = event.target;
    } catch (e) {
      target = "<unknown>";
    }
    if (target.length === 0) {
      return;
    }
    const behavior = {
      type: "ui.".concat(eventName), // e.g. ui.click, ui.input
      target,
      treeNode: htmlTreeToStr(target, config),
      timestamp: Date.now(),
    };
    if (eventName === "click") {
      addBehavior(behavior, send, config);
    } else if (eventName === "keypress") {
      addBehavior(behavior, send, config);
    }
  };
};

export default (send, config = { getTrackerType: () => null }) => {
  if (!(window.document && window.document.addEventListener)) return;
  window.document.addEventListener(
    "click",
    bhEventHandler("click", send, config),
    false
  );
  window.document.addEventListener(
    "keypress",
    bhEventHandler("keypress", send, config),
    false
  );
};
