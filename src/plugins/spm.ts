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
  const MAX_TRAVERSE_HEIGHT = 35;
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

const getDateTrackerValues = (treeNode) => {
  const [latestNode, parentNode] = treeNode;
  const dataTrckerValue = latestNode && latestNode.getAttribute("data-tracker");
  const parentTrckerValue = parentNode && parentNode.getAttribute("data-tracker");
  return [dataTrckerValue, parentTrckerValue];
};

const addBehavior = (behavior, send) => {
  const target = behavior.target;
  const treeNode = behavior.treeNode;
  if (target.nodeName.toLocaleLowerCase() === "a") {
    const href = target.getAttribute("href");
    const redirectHost = getHost(href);
    if (href && redirectHost) {
      if (treeNode && treeNode.length > 0) {
        const [dataTrckerValue] = getDateTrackerValues(behavior.treeNode);
        send({
          name: getRedirectUrl(href),
          type: dataTrckerValue,
        });
      } else {
        send({
          name: getRedirectUrl(href),
          type: "redirect",
        });
      }
    }
    return;
  }
  if (treeNode && treeNode.length > 0) {
    const [dataTrckerValue, parentTrckerValue] = getDateTrackerValues(
      behavior.treeNode
    );
    if (dataTrckerValue) {
      send({
        name: dataTrckerValue,
        type: parentTrckerValue || "event",
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
  if (!(window.document && window.document.addEventListener)) return;
  window.document.addEventListener(
    "click",
    bhEventHandler("click", send),
    false
  );
  window.document.addEventListener(
    "keypress",
    bhEventHandler("keypress", send),
    false
  );
};
