import { resolveVirtualPath } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { worksFor } from "./works-for.js";

describe("Scalar formats of serialized document in YAML", () => {
  worksFor(["3.0.0", "3.1.0"], (helper) => {
    it("should add single quote for y|Y|yes|Yes|YES|n|N|no|No|NO|true|True|TRUE|false|False|FALSE|on|On|ON|off|Off|OFF", async () => {
      const [_, __, content] = await helper.emitOpenApiWithDiagnostics(`
          enum TestEnum {
            y: "y",
            Y: "Y",
            yes: "yes",
            Yes: "Yes",
            YES: "YES",
            yEs: "yEs",
            n: "n",
            N: "N",
            no: "no",
            No: "No",
            NO: "NO",
            nO: "nO",
            "true": "true",
            True: "True",
            TRUE: "TRUE",
            tRUE: "tRUE",
            "false": "false",
            False: "False",
            FALSE: "FALSE",
            fALSE: "fALSE",
            on: "on",
            On: "On",
            ON: "ON",
            oN: "oN",
            off: "off",
            Off: "Off",
            OFF: "OFF",
            oFF: "oFF"
          }
          `);
      expect(content).toBe(`openapi: 3.0.0
    info:
      title: (title)
      version: 0.0.0
    tags: []
    paths: {}
    components:
      schemas:
        TestEnum:
          type: string
          enum:
            - 'y'
            - 'Y'
            - 'yes'
            - 'Yes'
            - 'YES'
            - yEs
            - 'n'
            - 'N'
            - 'no'
            - 'No'
            - 'NO'
            - nO
            - 'true'
            - 'True'
            - 'TRUE'
            - tRUE
            - 'false'
            - 'False'
            - 'FALSE'
            - fALSE
            - 'on'
            - 'On'
            - 'ON'
            - oN
            - 'off'
            - 'Off'
            - 'OFF'
            - oFF
    `);
    });

    interface ServiceNameCase {
      description: string;
      code: string;
      outputFilePattern: string;
      expectedOutputFiles: string[];
    }
    it.each([
      // {service-name} cases
      {
        description: "{service-name} for one service",
        code: "@service namespace AAA { model M {a: string} }",
        outputFilePattern: "{service-name}.yaml",
        expectedOutputFiles: [resolveVirtualPath("AAA.yaml")],
      },
      {
        description: "{service-name} for multiple services",
        code:
          "@service namespace AAA { model M {a: string} }" +
          "@service namespace BBB { model N {b: string} }",
        outputFilePattern: "{service-name}.yaml",
        expectedOutputFiles: [resolveVirtualPath("AAA.yaml"), resolveVirtualPath("BBB.yaml")],
      },
      // {service-name-if-multiple} cases
      {
        description: "{service-name-if-multiple} for one service",
        code: "@service namespace AAA { model M {a: string} }",
        outputFilePattern: "{service-name-if-multiple}.yaml",
        expectedOutputFiles: [resolveVirtualPath("yaml")],
      },
      {
        description: "{service-name-if-multiple} for multiple services",
        code:
          "@service namespace AAA { model M {a: string} }" +
          "@service namespace BBB { model N {b: string} }",
        outputFilePattern: "{service-name-if-multiple}.yaml",
        expectedOutputFiles: [resolveVirtualPath("AAA.yaml"), resolveVirtualPath("BBB.yaml")],
      },
      // fixed name cases
      {
        description: "fixed name for one service",
        code: "@service namespace AAA { model M {a: string} }",
        outputFilePattern: "fixed-name.yaml",
        expectedOutputFiles: [resolveVirtualPath("fixed-name.yaml")],
      },
    ])("$description", async (c: ServiceNameCase) => {
      const options = {
        "output-file": c.outputFilePattern,
        "emitter-output-dir": "{output-dir}",
      };
      const [diag, load, _] = await helper.emitOpenApi(c.code, options);
      expect(diag.length).toBe(0);
      for (const outputFile of c.expectedOutputFiles) expect(load(outputFile)).toBeDefined();
    });
  });
});
