// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// cspell:ignore esac ALRM

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const script = fileURLToPath(new URL("../playground-server/deploy.sh", import.meta.url)).replaceAll(
  "\\",
  "/",
);
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
echo "$*" >> "$FAKE_STATE/timeouts"
if [[ "$SCENARIO" == "deployment-timeout" && "$2" == "3600" ]]; then exit 124; fi
if [[ "$SCENARIO" == "read-timeout" && "$*" == *" container show "* && ! -f "$FAKE_STATE/read-timeout" ]]; then
  touch "$FAKE_STATE/read-timeout"
  exit 124
fi
if [[ "$SCENARIO" == "update-timeout" && "$2" == "3600" ]]; then
  shift 2
  /usr/bin/timeout --kill-after=1 30 "$@" &
  supervisor=$!
  while [[ ! -f "$FAKE_STATE/update-started" ]]; do
    if ! kill -0 "$supervisor" 2>/dev/null; then wait "$supervisor"; exit $?; fi
    /usr/bin/sleep 0.01
  done
  kill -ALRM "$supervisor"
  wait "$supervisor"
  exit $?
fi
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
  "acr build --registry")
    echo "$RUN_ID build" >> "$FAKE_STATE/events"
    /usr/bin/sleep 0.2
    if [[ "$SCENARIO" == "build-failure" ]]; then exit 1; fi
    ;;
  "webapp config container")
    if [[ "$4" == "set" ]]; then
      echo "$RUN_ID deploy" >> "$FAKE_STATE/events"
      if [[ "$SCENARIO" == "update-timeout" ]]; then
        touch "$FAKE_STATE/update-started"
        /usr/bin/sleep 1
        touch "$FAKE_STATE/stale-update"
      fi
      while [[ "$1" != "--container-image-name" ]]; do shift; done
      printf '[{"name":"DOCKER_CUSTOM_IMAGE_NAME","value":"DOCKER|%s"}]' "$2" > "$FAKE_STATE/image"
      if [[ "$SCENARIO" == "gateway-timeout" ]]; then echo GatewayTimeout >&2; exit 1; fi
    elif [[ "$SCENARIO" == "unconfirmed" ]]; then
      echo '[{"value":"DOCKER|wrong-image"}]'
    elif [[ "$SCENARIO" == "read-auth" ]]; then
      echo AuthorizationFailed >&2
      exit 1
    elif [[ "$SCENARIO" == "read-transient" && ! -f "$FAKE_STATE/read-transient" ]]; then
      touch "$FAKE_STATE/read-transient"
      echo ServiceUnavailable >&2
      exit 1
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
      timeout: 60_000,
    },
  );
}

test("builds and verifies deployment without acquiring storage leases", async () => {
  await deploy();
  const commands = await readFile(join(root, "commands"), "utf8");
  assert.doesNotMatch(commands, /storage blob/);
  assert.match(
    commands,
    /--container-image-name typespecacr.azurecr.io\/csharp-playground-server:test-one/,
  );
  assert.equal(await readFile(join(root, "events"), "utf8"), "one build\none deploy\n");
});

test("verifies live image after a gateway timeout", async () => {
  const { stderr } = await deploy("gateway-timeout");
  assert.match(stderr, /verifying live configuration/);
});

test("does not deploy after a build failure", async () => {
  await assert.rejects(deploy("build-failure"));
  const commands = await readFile(join(root, "commands"), "utf8");
  assert.doesNotMatch(commands, /webapp config container set/);
});

test("reports the bounded deployment timeout", async () => {
  await assert.rejects(deploy("deployment-timeout"), /exit code 124/);
  await assert.rejects(readFile(join(root, "commands")));
});

test("the overall timeout stops an in-flight update instead of letting it escape", async () => {
  await assert.rejects(deploy("update-timeout"), /exit code 124/);
  await assert.rejects(readFile(join(root, "stale-update")));
  const timeouts = (await readFile(join(root, "timeouts"), "utf8")).trim().split("\n");
  assert.ok(
    timeouts
      .filter((line) => line.includes("webapp config container"))
      .every((line) => line.startsWith("--foreground ")),
  );
});

for (const scenario of ["read-transient", "read-timeout"]) {
  test(`continues verification after ${scenario}`, async () => {
    const { stderr } = await deploy(scenario);
    assert.match(stderr, /Container configuration read failed/);
    const commands = await readFile(join(root, "commands"), "utf8");
    assert.equal(commands.match(/webapp config container set/g).length, 1);
  });
}

test("fails explicitly on a configuration-read authorization error", async () => {
  await assert.rejects(deploy("read-auth"), /AuthorizationFailed/);
  const commands = await readFile(join(root, "commands"), "utf8");
  assert.equal(commands.match(/webapp config container show/g).length, 1);
  assert.equal(commands.match(/webapp config container set/g).length, 1);
});

test("fails if the desired image is never confirmed", async () => {
  await assert.rejects(deploy("unconfirmed"), /Failed to confirm container image/);
  const commands = await readFile(join(root, "commands"), "utf8");
  assert.equal(commands.match(/webapp config container set/g).length, 3);
  assert.equal(commands.match(/webapp config container show/g).length, 18);
});
