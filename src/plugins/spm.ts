import Url from "url-parse";
import { getHost } from "../lib";


const getRedirectUrl = (url) => {
  if (!url) return "";
  const { hostname, pathname } = new Url(url);
  return `${hostname}${pathname}`;
};

const parseTrackerAttr = (attr: string) => {
  const attrList = attr.split("&");
  const attrMap = {};
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

const htmlTreeToStr = function (rootNode) {
  if (!(rootNode && rootNode.nodeType === 1)) return "";
  let currentElem = rootNode || null;
  const MAX_TRAVERSE_HEIGHT = 20;
  const out = [];
  let height = 0;
  let nextStr = [];
  while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
    nextStr = htmlNodeToStr(currentElem);
    if (nextStr) {
      out.push(nextStr);
    }
    currentElem = currentElem.parentNode;
  }

  return out;
};

const htmlNodeToStr = function (htmlNode) {
  let out = null;
  let key;
  let attr;
  let i;
  if (!htmlNode || typeof htmlNode.tagName !== "string") {
    return null;
  }
  const attrWhitelist = ["type", "data-tracker"];
  for (i = 0; i < attrWhitelist.length; i++) {
    key = attrWhitelist[i];
    attr = htmlNode.getAttribute(key);
    if (typeof attr === "string") {
      out = htmlNode;
    }
  }
  return out;
};

const addBehavior = (behavior, send) => {
  const target = behavior.target;
  if (target.nodeName.toLocaleLowerCase() === "a") {
    const href = target.getAttribute("href");
    const referrerHost = getHost(href);
    if (href && referrerHost) {
      send({
        name: getRedirectUrl(href),
        type: "redirect",
      });
    }
  }
  const treeNode = behavior.treeNode;
  if (treeNode && treeNode.length > 0) {
    const latestNode = behavior.treeNode[0];
    const dataTrckerValue = latestNode.getAttribute("data-tracker");
    if (dataTrckerValue) {
      send({
        name: dataTrckerValue,
        type: "event",
        ...parseTrackerAttr(dataTrckerValue),
      });
    }
  }
};

const bhEventHandler = (eventName: string, send) => {
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
      treeNode: htmlTreeToStr(target),
      timestamp: Date.now(),
    };
    if (eventName === "click") {
      addBehavior(behavior, send);
    } else if (eventName === "keypress") {
      addBehavior(behavior, send);
    }
  };
};

export default (send) => {
  const win = window;
  if (!(win && win.document && win.document.addEventListener)) return;
  win.document.addEventListener("click", bhEventHandler("click", send), false);
  win.document.addEventListener(
    "keypress",
    bhEventHandler("keypress", send),
    false
  );
};
