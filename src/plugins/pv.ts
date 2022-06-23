/* eslint-disable prefer-rest-params */
import Url from "url-parse";

declare global {
  interface Window {
    chrome: any;
  }
}

const supportsHistory = () => {
  const chrome = window.chrome;
  const isChromePackagedApp = chrome && chrome.app && chrome.app.runtime;
  const hasHistoryApi =
    "history" in window &&
    !!window.history.pushState &&
    !!window.history.replaceState;
  return !isChromePackagedApp && hasHistoryApi;
};

export function onHashChange(callback) {
  window.addEventListener("hashchange", () => {
    callback(new Url(window?.location?.href));
  });
}

export function onHistoryChange(callback) {
  if (!supportsHistory()) {
    return;
  }
  // window.addEventListener("popstate", function () {
  //   callback(window.location.href);
  // });

  const originPushState = window?.history?.pushState;
  if (originPushState) {
    history.pushState = function () {
      originPushState.apply(this, arguments);
      const url = arguments.length > 2 ? arguments[2] : undefined;
      if (url) {
        callback(new Url(url));
      }
    };
  }

  const originReplaceState = window?.history?.replaceState;
  if (originReplaceState) {
    history.replaceState = function () {
      originReplaceState.apply(this, arguments);
      const url = arguments.length > 2 ? arguments[2] : undefined;
      if (url) {
        callback(new Url(url));
      }
    };
  }
}

export default (send, { filter }) => {
  onHashChange((object) => {
    send({
      type: "page",
      name: filter(object),
    });
  });
  onHistoryChange((object) => {
    send({
      type: "page",
      name: filter(object),
    });
  });
};
