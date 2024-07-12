import https from "https";

const AZP_USERID = "azure-pipelines[bot]";
const TRY_ID_COMMENT_IDENTIFIER = "_TSP_TRYIT_COMMENT_";
main().catch((e) => {
  console.error(e);
  // @ts-ignore
  process.exit(1);
});

async function main() {
  const folderName = process.argv.length > 2 ? `/${process.argv[2]}` : "";
  const repo = process.env["BUILD_REPOSITORY_ID"];
  const prNumber = process.env["SYSTEM_PULLREQUEST_PULLREQUESTNUMBER"];
  const ghToken = process.env.GH_TOKEN;
  if (repo === undefined) {
    throw new Error("BUILD_REPOSITORY_ID environment variable is not set");
  }
  if (prNumber === undefined) {
    throw new Error("SYSTEM_PULLREQUEST_PULLREQUESTNUMBER environment variable is not set");
  }
  if (ghToken === undefined) {
    throw new Error("GH_TOKEN environment variable is not set");
  }
  const ghAuth = `Bearer ${ghToken}`;

  console.log("Looking for comments in", { repo, prNumber });
  const data = await listComments(repo, prNumber, ghAuth);
  const azoComments = data.filter((x) => x.user?.login === AZP_USERID);
  console.log(`Found ${azoComments.length} comment(s) from Azure Pipelines.`);

  const tryItComments = data.filter((x) => x.body.includes(TRY_ID_COMMENT_IDENTIFIER));
  console.log(`Found ${azoComments.length} Cadl Try It comment(s)`);
  if (tryItComments.length > 0) {
    console.log("##vso[task.setvariable variable=SKIP_COMMENT;]true");
    return;
  }

  const comment = [
    `<!-- ${TRY_ID_COMMENT_IDENTIFIER} -->`,
    `You can try these changes here`,
    "",
    `| [🛝 Playground]( https://cadlplayground.z22.web.core.windows.net${folderName}/prs/${prNumber}/") | [🌐 Website](https://tspwebsitepr.z22.web.core.windows.net${folderName}/prs/${prNumber}/) |`,
    "|---|---|",
  ].join("\n");
  await writeComment(repo, prNumber, comment, ghAuth);
}

async function listComments(repo: string, prNumber: string, ghAuth: string): Promise<any[]> {
  const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments?per_page=100`;
  const result = await request("GET", url, { ghAuth });
  return JSON.parse(result);
}

async function writeComment(repo: string, prNumber: string, comment: string, ghAuth: string) {
  const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  const body = {
    body: comment,
  };
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await request("POST", url, {
    headers,
    body: JSON.stringify(body),
    ghAuth,
  });

  console.log("Comment created", response);
}

async function request(method: string, url: string, data: any): Promise<string> {
  const lib = https;
  const value = new URL(url);

  const params = {
    method,
    host: value.host,
    port: 443,
    path: value.pathname,
    headers: {
      "User-Agent": "nodejs",
      ...data.headers,
    },
  };

  console.log("Params", params);

  params.headers.Authorization = data.ghAuth;

  return new Promise((resolve, reject) => {
    const req = lib.request(params, (res) => {
      const data: Buffer[] = [];

      res.on("data", (chunk) => {
        data.push(chunk);
      });

      res.on("end", () => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          return reject(
            new Error(
              `Status Code: ${res.statusCode}, statusMessage: ${
                res.statusMessage
              }, headers: ${JSON.stringify(res.headers, null, 2)}, body: ${Buffer.concat(
                data
              ).toString()}`
            )
          );
        } else {
          resolve(Buffer.concat(data).toString());
        }
      });
    });

    req.on("error", reject);

    if (data.body) {
      req.write(data.body);
    }

    req.end();
  });
}
