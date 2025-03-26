import { JSONSchemaType } from "@typespec/compiler";

export interface ClientEmitterOptions {
  "api-version"?: string;
  "examples-dir"?: string;
  "package-version"?: string;
  "package-name"?: string;
  namespace?: string;
  license?: {
    name: string;
    company?: string;
    link?: string;
    header?: string;
    description?: string;
  };
}

export const ClientEmitterOptionsSchema: JSONSchemaType<ClientEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "package-version": {
      type: "string",
      nullable: true,
      default: "0.0.1",
      description: "The version of the package.",
    },
    "package-name": {
      type: "string",
      nullable: true,
      default: "test-package",
      description: "Name of the package.",
    },
    "examples-dir": {
      type: "string",
      nullable: true,
      format: "absolute-path",
      description:
        "Specifies the directory where the emitter will look for example files. If the flag isn't set, the emitter defaults to using an `examples` directory located at the project root.",
    },
    namespace: {
      type: "string",
      nullable: true,
      description:
        "Specifies the namespace you want to override for namespaces set in the spec. With this config, all namespace for the spec types will default to it.",
    },
    "api-version": {
      type: "string",
      nullable: true,
      description:
        "Use this flag if you would like to generate the sdk only for a specific version. Default value is the latest version. Also accepts values `latest` and `all`.",
    },
    license: {
      type: "object",
      additionalProperties: false,
      nullable: true,
      required: ["name"],
      properties: {
        name: {
          type: "string",
          nullable: false,
          description:
            "License name. The config is required. Predefined license are: MIT License, Apache License 2.0, BSD 3-Clause License, MPL 2.0, GPL-3.0, LGPL-3.0. For other license, you need to configure all the other license config manually.",
        },
        company: {
          type: "string",
          nullable: true,
          description: "License company name. It will be used in copyright sentences.",
        },
        link: {
          type: "string",
          nullable: true,
          description: "License link.",
        },
        header: {
          type: "string",
          nullable: true,
          description:
            "License header. It will be used in the header comment of generated client code.",
        },
        description: {
          type: "string",
          nullable: true,
          description: "License description. The full license text.",
        },
      },
      description: "License information for the generated client code.",
    },
  },
};
