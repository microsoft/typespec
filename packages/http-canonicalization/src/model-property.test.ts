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

// skip, haven't implemented metadata stuff yet
it.skip("removes metadata properties from wire type", async () => {
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      @visibility(Lifecycle.Read)
      @header etag: string;

      id: string;
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  const write = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Read,
  });

  expect(write.languageType.properties.has("etag")).toBe(true);
  expect(write.wireType.properties.has("etag")).toBe(false);
});
