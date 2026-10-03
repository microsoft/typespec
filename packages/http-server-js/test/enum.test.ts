import { expect, it } from "vitest";
import { HttpServerEmitterTester } from "./tester.js";

async function emitExample(code: string) {
  const { outputs } = await HttpServerEmitterTester.compile(`
    @service(#{ title: "Example" })
    @route("/")
    namespace Example {
      ${code}
    }
  `);
  return outputs;
}

it("uses the json encoded name as the value of a member without a value", async () => {
  const outputs = await emitExample(`
    enum Status {
      @encodedName("application/json", "on")
      active,
      @encodedName("application/json", "off")
      inactive: "inactive-value",
      @encodedName("application/xml", "xml-pending")
      pending,
    }

    @get op read(): { status: Status };
  `);

  expect(outputs["src/generated/models/all/example.ts"]).toContain(
    [
      "export enum Status {",
      '  Active = "on",',
      '  Inactive = "off",',
      '  Pending = "pending",',
      "}",
    ].join("\n"),
  );
});

it("uses the json encoded name for a property typed as a member", async () => {
  const outputs = await emitExample(`
    enum Status {
      @encodedName("application/json", "on")
      active,
    }

    model Cat {
      kind: Status.active;
    }

    @get op read(): Cat;
  `);

  expect(outputs["src/generated/models/all/example.ts"]).toContain('  kind: "on";');
});

it("uses the json encoded name to differentiate union variants", async () => {
  const outputs = await emitExample(`
    enum Kind {
      @encodedName("application/json", "feline")
      cat,
      dog,
    }

    model Cat {
      kind: Kind.cat;
      meow: string;
    }

    model Dog {
      kind: Kind.dog;
      bark: string;
    }

    @post op create(@body pet: Cat | Dog): Cat | Dog;
  `);

  const serverRaw = outputs["src/generated/http/operations/server-raw.ts"];
  expect(serverRaw).toMatch(/\.kind === "feline"/);
  expect(serverRaw).not.toMatch(/\.kind === "cat"/);
});
