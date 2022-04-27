// @ts-check
import https from "https";

const AZP_USERID = "azure-pipelines[bot]";
main().catch((e) => {
  console.error(e);
  // @ts-ignore
  process.exit(1);
});

async function main() {
  const repo = process.env["BUILD_REPOSITORY_ID"];
  const prNumber = process.env["SYSTEM_PULLREQUEST_PULLREQUESTNUMBER"];

  console.log("Looking for comments in", { repo, prNumber });
  const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments?per_page=100`;
  const result = await request("GET", url);
  const data = JSON.parse(result);
  const azoComments = data.filter((x) => x.user?.login === AZP_USERID);
  console.log(`Found ${azoComments.length} comment(s) from Azure Pipelines.`);

  const tryItComments = data.filter((x) => x.body.includes("_CADL_TRYIT_COMMENT_"));
  console.log(`Found ${azoComments.length} Cadl Try It comment(s)`);
  if (tryItComments.length > 0) {
    console.log("##vso[task.setvariable variable=SKIP_COMMENT;]true");
  }
}

async function request(method, url, postData) {
  const lib = https;
  const value = new URL(url);

  console.log("URL", value);
  const params = {
    method,
    host: value.host,
    port: 443,
    path: value.pathname,
    headers: {
      "User-Agent": "nodejs",
    },
  };
  console.log("Params", params);

  return new Promise((resolve, reject) => {
    const req = lib.request(params, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Status Code: ${res.statusCode}`));
      }

      const data = [];

      res.on("data", (chunk) => {
        data.push(chunk);
      });

      res.on("end", () => resolve(Buffer.concat(data).toString()));
    });

    req.on("error", reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}
