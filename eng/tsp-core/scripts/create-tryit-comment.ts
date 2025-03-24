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
  const vscodeDownloadUrl = process.env.VSCODE_DOWNLOAD_URL;
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
  const comment = makeComment(folderName, prNumber, vscodeDownloadUrl);
  if (tryItComments.length > 0) {
    await updateComment(repo, tryItComments[0].id, comment, ghAuth);
    return;
  }

  await writeComment(repo, prNumber, comment, ghAuth);
}

function makeComment(
  folderName: string,
  prNumber: string,
  vscodeDownloadUrl: string | undefined,
): string {
  const links = [
    `[🛝 Playground]( https://cadlplayground.z22.web.core.windows.net${folderName}/prs/${prNumber}/)`,
    `[🌐 Website](https://tspwebsitepr.z22.web.core.windows.net${folderName}/prs/${prNumber}/)`,
  ];

  if (vscodeDownloadUrl) {
    links.push(`[🛝 VSCode Extension]( ${vscodeDownloadUrl})`);
  }
  return [
    `<!-- ${TRY_ID_COMMENT_IDENTIFIER} -->`,
    `You can try these changes here`,
    "",
    `| ${links.join("|")} |`,
    `| ${links.map(() => "---").join("|")} |`,
  ].join("\n");
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

async function updateComment(repo: string, commentId: string, comment: string, ghAuth: string) {
  const url = `https://api.github.com/repos/${repo}/issues/comments/${commentId}`;
  const body = {
    body: comment,
  };
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await request("PATCH", url, {
    headers,
    body: JSON.stringify(body),
    ghAuth,
  });

  console.log("Comment updated", response);
}

async function request(method: string, url: string, data: any): Promise<string> {
  const response = await fetch(url, {
    method,
    headers: {
      "User-Agent": "nodejs",
      ...data.headers,
      Authorization: data.ghAuth,
    },
    body: data.body,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}\n\n` + (await response.text()));
  }
  return response.text();
}
