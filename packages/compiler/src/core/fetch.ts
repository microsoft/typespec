import followRedirects from "follow-redirects";
import { compilerAssert } from "./diagnostics.js";

export interface FetchResponse {
  readonly url: string;
  text(): Promise<string>;
}
/**
 * Basic implementation of fetch to fit our needs.
 * We are not using `node-fetch` due to a vulnerability and an issue in `<=3.2.8` the typing if `version >=3.2.9`
 * Node built-in fetch is still experimental as of node 19
 */
export function fetch(uri: string): Promise<FetchResponse> {
  return new Promise((resolve, reject) => {
    request(uri, resolve, reject);
  });

  function request(uri: string, resolve: (arg: FetchResponse) => void, reject: (arg: any) => void) {
    const url = new URL(uri);
    const protocol =
      url.protocol === "https:"
        ? followRedirects.https
        : url.protocol === "http:"
          ? followRedirects.http
          : undefined;
    compilerAssert(protocol, `Protocol '${url.protocol}' is not supported`);

    protocol
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve({
            url: url.href,
            text: () => Promise.resolve(data),
          });
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  }
}
