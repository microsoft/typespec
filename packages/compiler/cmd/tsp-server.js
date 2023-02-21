#!/usr/bin/env node
import { runScript } from "../dist/cmd/runner.js";
await runScript("entrypoints/server.js", "dist/server/server.js");
