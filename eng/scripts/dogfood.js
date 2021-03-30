import { run, npmForEach } from "./helpers.js";
run("rush", ["build"]);
npmForEach("dogfood");
