#!/usr/bin/env node
import { runScript } from "../dist/cmd/runner.js";
await runScript("entrypoints/cli.js", "dist/core/cli/cli.js");
