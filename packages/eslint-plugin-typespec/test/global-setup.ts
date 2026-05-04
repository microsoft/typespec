// Preload the parser so it doesn't slow down the first test as much
import "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import * as vitest from "vitest";

RuleTester.afterAll = vitest.afterAll;

// If you are not using vitest with globals: true (https://vitest.dev/config/#globals):
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;
