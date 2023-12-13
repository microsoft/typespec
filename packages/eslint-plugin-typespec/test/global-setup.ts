import { RuleTester } from "@typescript-eslint/rule-tester";
import * as mocha from "mocha";

export async function mochaGlobalSetup() {
  RuleTester.afterAll = mocha.after;
}
