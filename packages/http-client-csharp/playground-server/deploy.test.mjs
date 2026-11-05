// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// cspell:ignore esac

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const script = fileURLToPath(new URL("./deploy.sh", import.meta.url)).replaceAll("\\", "/");
let root;
let bin;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "playground-deploy-test-"));
  bin = join(root, "bin");
  await mkdir(bin);
  await writeFile(join(bin, "sleep"), "#!/usr/bin/env bash\nexec /usr/bin/sleep 0.02\n", {
    mode: 0o755,
  });
  await writeFile(
    join(bin, "timeout"),
    `#!/usr/bin/env bash
if [[ "$SCENARIO" == "deployment-timeout" && "$2" == "3600" ]]; then exit 124; fi
if [[ "$SCENARIO" == "acquire-timeout" && "$*" == *" lease acquire "* ]]; then exit 124; fi
exec /usr/bin/timeout "$@"
`,
    { mode: 0o755 },
  );
  await writeFile(
    join(bin, "az"),
    `#!/usr/bin/env bash
set -eu
echo "$RUN_ID $*" >> "$FAKE_STATE/commands"
case "$1 $2 $3" in
  "storage blob upload")
    if [[ "$SCENARIO" == "upload-auth" ]]; then echo AuthorizationFailure >&2; exit 1; fi
    ;;
  "storage blob lease")
    case "$4" in
      acquire)
        if [[ "$SCENARIO" == "acquire-auth" ]]; then echo AuthorizationFailure >&2; exit 1; fi
        if ! mkdir "$FAKE_STATE/lease" 2>/dev/null; then echo LeaseAlreadyPresent >&2; exit 1; fi
        echo test-lease
        ;;
      renew)
        if [[ "$SCENARIO" == "renew-failure" ]]; then echo LeaseLost >&2; exit 1; fi
        ;;
      release)
        rmdir "$FAKE_STATE/lease"
        if [[ "$SCENARIO" == "release-failure" ]]; then echo ReleaseFailed >&2; exit 1; fi
        ;;
    esac
    ;;
  "acr build --registry")
    echo "$RUN_ID build" >> "$FAKE_STATE/events"
    /usr/bin/sleep 0.2
    if [[ "$SCENARIO" == "build-failure" ]]; then exit 1; fi
    ;;
  "webapp config container")
    if [[ "$4" == "set" ]]; then
      echo "$RUN_ID deploy" >> "$FAKE_STATE/events"
      while [[ "$1" != "--container-image-name" ]]; do shift; done
      printf '[{"name":"DOCKER_CUSTOM_IMAGE_NAME","value":"DOCKER|%s"}]' "$2" > "$FAKE_STATE/image"
      if [[ "$SCENARIO" == "gateway-timeout" ]]; then echo GatewayTimeout >&2; exit 1; fi
    elif [[ "$SCENARIO" == "unconfirmed" ]]; then
      echo '[{"value":"DOCKER|wrong-image"}]'
    else
      cat "$FAKE_STATE/image"
    fi
    ;;
  *) echo "Unexpected command: $*" >&2; exit 1 ;;
esac
`,
    { mode: 0o755 },
  );
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function deploy(scenario = "success", id = "one") {
  return execute(
    "bash",
    [
      "-c",
      'export PATH="$FAKE_BIN:$PATH"; exec /usr/bin/bash "$@"',
      "test",
      script,
      root.replaceAll("\\", "/"),
      `test-${id}`,
    ],
    {
      env: {
        ...process.env,
        PATH: `${bin}${delimiter}${process.env.PATH}`,
        FAKE_BIN: bin
          .replaceAll("\\", "/")
          .replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`),
        FAKE_STATE: root.replaceAll("\\", "/"),
        SCENARIO: scenario,
        RUN_ID: id,
      },
      timeout: 20_000,
    },
  );
}

test("holds and renews a finite lease around build and verified deployment", async () => {
  await deploy();
  const commands = await readFile(join(root, "commands"), "utf8");
  assert.match(commands, /lease acquire .*--lease-duration 60/);
  assert.match(commands, /lease renew/);
  assert.match(commands, /lease release/);
  assert.match(commands, /acr build .*--no-cache/);
  assert.match(
    commands,
    /--container-image-name typespecacr.azurecr.io\/csharp-playground-server:test-one/,
  );
  assert.equal(await readFile(join(root, "events"), "utf8"), "one build\none deploy\n");
});

test("serializes separate publishers using the same lock blob", async () => {
  await Promise.all([deploy("success", "one"), deploy("success", "two")]);
  const events = (await readFile(join(root, "events"), "utf8")).trim().split("\n");
  const first = events[0].split(" ")[0];
  const second = first === "one" ? "two" : "one";
  assert.deepEqual(events, [
    `${first} build`,
    `${first} deploy`,
    `${second} build`,
    `${second} deploy`,
  ]);
});

test("verifies live image after a gateway timeout", async () => {
  const { stderr } = await deploy("gateway-timeout");
  assert.match(stderr, /verifying live configuration/);
});

for (const scenario of ["upload-auth", "acquire-auth"]) {
  test(`fails explicitly on ${scenario} before building`, async () => {
    await assert.rejects(deploy(scenario), /AuthorizationFailure/);
    await assert.rejects(readFile(join(root, "events")));
  });
}

test("reports a timed out acquisition without starting a build", async () => {
  await assert.rejects(
    deploy("acquire-timeout"),
    /Failed to acquire the playground deployment lease/,
  );
  await assert.rejects(readFile(join(root, "events")));
});

for (const scenario of ["build-failure", "renew-failure", "deployment-timeout"]) {
  test(`does not deploy after ${scenario} and releases the lease`, async () => {
    await assert.rejects(deploy(scenario));
    const commands = await readFile(join(root, "commands"), "utf8");
    assert.match(commands, /lease release/);
    assert.doesNotMatch(commands, /webapp config container set/);
  });
}

test("fails if the desired image is never confirmed", async () => {
  await assert.rejects(deploy("unconfirmed"), /Failed to confirm container image/);
  const commands = await readFile(join(root, "commands"), "utf8");
  assert.equal(commands.match(/webapp config container set/g).length, 3);
  assert.equal(commands.match(/webapp config container show/g).length, 18);
});

test("reports a release failure instead of returning success", async () => {
  await assert.rejects(deploy("release-failure"), /Failed to release playground deployment lease/);
});
