#!/usr/bin/env node
import { runScript } from "../dist/cmd/runner.js";
await runScript("dist/compiler/cli.js");
