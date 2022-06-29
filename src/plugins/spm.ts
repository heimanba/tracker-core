import Url from "url-parse";
import { getHost } from "../lib";

const getRedirectUrl = (url) => {
  if (!url) return "";
  const { hostname, pathname, hash } = new Url(url);
  return `${hostname}${pathname}${hash}`;
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
  const MAX_TRAVERSE_HEIGHT = 45;
  const out = {
    attr: [],
    tag: [],
  };
  let height = 0;
  while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
    const nextAttrStr = htmlNodeToStr(currentElem, true);
    const nextTagStr = htmlNodeToStr(currentElem, false);
    if (nextAttrStr) {
      out.attr.push(nextAttrStr);
    }
    if (nextTagStr) {
      out.tag.push(nextTagStr);
    }
    currentElem = currentElem.parentNode;
  }

  return out;
};

const htmlNodeToStr = function (htmlNode, isAttr) {
  let out = null;
  if (!htmlNode || typeof htmlNode.tagName !== "string") {
    return null;
  }
  const tagWhitelist = ["img", "a"];
  const attrWhitelist = ["type", "data-tracker", "data-wrapper"];

  if (isAttr) {
    for (let i = 0; i < attrWhitelist.length; i++) {
      const attr = htmlNode.getAttribute(attrWhitelist[i]);
      if (typeof attr === "string") {
        out = htmlNode;
      }
    }
  } else {
    for (let i = 0; i < tagWhitelist.length; i++) {
      if (htmlNode.tagName.toLowerCase() === tagWhitelist[i]) {
        return htmlNode;
      }
    }
  }

  return out;
};

const _getDateTrackerValues = (treeNode, isLink) => {
  const [latestNode, parentNode] = treeNode;
  const dataTrckerValue = isLink
    ? latestNode.getAttribute("data-tracker") ||
      latestNode.getAttribute("data-wrapper")
    : latestNode.getAttribute("data-tracker");
  const wrapperValue = parentNode && parentNode.getAttribute("data-wrapper");
  return [dataTrckerValue, wrapperValue];
};

const _getHrefTracker = (node, treeAttrNode, defaultTrackerType, send) => {
  const href = node.getAttribute("href");
  const redirectHost = getHost(href);
  if (href && redirectHost) {
    if (treeAttrNode && treeAttrNode.length > 0) {
      const [dataTrckerValue] = _getDateTrackerValues(treeAttrNode, true);
      send({
        name: getRedirectUrl(href),
        type: dataTrckerValue || defaultTrackerType,
      });
    } else {
      send({
        name: getRedirectUrl(href),
        type: defaultTrackerType || "redirect",
      });
    }
  }
};

const addBehavior = (behavior, send, getTrackerType) => {
  const target = behavior.target;
  const { attr: treeAttrNode, tag: treeTagNode } = behavior.treeNode;
  const defaultTrackerType = getTrackerType();
  //  点击图片
  if (target.nodeName.toLocaleLowerCase() === "img") {
    const [imgNode, aNode] = treeTagNode;
    if (
      imgNode &&
      aNode &&
      imgNode.tagName.toLowerCase() === "img" &&
      aNode.tagName.toLowerCase() === "a"
    ) {
      return _getHrefTracker(aNode, treeAttrNode, defaultTrackerType, send);
    }
  }
  //  点击a标签
  if (target.nodeName.toLocaleLowerCase() === "a") {
    return _getHrefTracker(target, treeAttrNode, defaultTrackerType, send);
  }
  if (treeAttrNode && treeAttrNode.length > 0) {
    // 正常节点标准是 data-tracker/data-wrapper
    const [dataTrckerValue, parentTrckerValue] = _getDateTrackerValues(
      treeAttrNode,
      false
    );
    if (dataTrckerValue) {
      send({
        name: dataTrckerValue,
        type: parentTrckerValue || defaultTrackerType || "event",
        ...parseTrackerAttr(dataTrckerValue),
      });
    }
  }
};

const bhEventHandler = (eventName: string, send, getTrackerType) => {
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
      addBehavior(behavior, send, getTrackerType);
    } else if (eventName === "keypress") {
      addBehavior(behavior, send, getTrackerType);
    }
  };
};

export default (
  send,
  config: {
    getTrackerType;
  }
) => {
  const { getTrackerType = () => null } = config || {};
  if (!(window.document && window.document.addEventListener)) return;
  window.document.addEventListener(
    "click",
    bhEventHandler("click", send, getTrackerType),
    false
  );
  window.document.addEventListener(
    "keypress",
    bhEventHandler("keypress", send, getTrackerType),
    false
  );
};
