import Url from "url-parse";
import { parse } from "query-string";
import UAParser from "ua-parser-js";
import { slsSendObject, getHost } from "../lib";

const parseSpm = (url: string, names: string[]) => {
  const { query } = new Url(url);
  const queryObject = parse(query);
  for (const name of names) {
    if (queryObject[name]) {
      return queryObject[name];
    }
  }
  return undefined;
};

export default (
  send,
  {
    ua = true,
    referrer = false,
    spm = {
      enable: true,
      names: ["spm"],
    },
  }: {
    ua: boolean;
    referrer: boolean;
    spm: {
      enable: true;
      names: string[];
    };
  }
) => {
  const uaParser = new UAParser();
  const { browser, os } = uaParser.getResult() || {};
  const uaPayload = ua
    ? {
        browser: browser
          ? `${browser.name}:${browser.major || browser.version}`
          : "",
        os: os ? `${os.name}:${os.version}` : "",
      }
    : {};

  const referrerHost = referrer ? getHost(document.referrer) : undefined;

  send(
    slsSendObject({
      type: "uv",
      spm: parseSpm(document.location.href, spm.names),
      referrer: referrerHost,
      ...uaPayload,
    })
  );
};
