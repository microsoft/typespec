import { npmForEach, run } from "./helpers.js";
run("rush", ["build"]);
npmForEach("dogfood");
