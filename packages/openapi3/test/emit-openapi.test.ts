import { describe, expect, it } from "vitest";
import { emitOpenApiWithDiagnostics } from "./test-host.js";

describe("Scalar formats of serialized document in YAML", () => {
  it("should add single quote for y|Y|yes|Yes|YES|n|N|no|No|NO|true|True|TRUE|false|False|FALSE|on|On|ON|off|Off|OFF", async () => {
    const [_, __, content] = await emitOpenApiWithDiagnostics(`
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
});
