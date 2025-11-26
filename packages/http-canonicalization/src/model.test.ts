import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Visibility } from "@typespec/http";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../test/test-host.js";
import { HttpCanonicalizer } from "./http-canonicalization.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("applies friendly name", async () => {
  const { Foo, program } = await runner.compile(t.code`
    @friendlyName("Bar")
    model ${t.model("Foo")} {
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  const canonicalized = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Read,
  });

  expect(canonicalized.languageType.name).toBe("Bar");
  expect(canonicalized.wireType.name).toBe("Bar");
});
