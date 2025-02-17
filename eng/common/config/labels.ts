// cspell:ignore bfff
import { defineConfig, defineLabels } from "../scripts/labels/config.js";
import { repo } from "../scripts/utils/common.js";
import { AreaPaths } from "./area.js";

/**
 * Labels that are used to categorize issue for which area they belong to.
 */
export const AreaLabels = defineLabels({
  "compiler:core": {
    color: "453261",
    description: "Issues for @typespec/compiler",
  },
  "compiler:emitter-framework": {
    color: "453261",
    description: "Issues for the emitter framework",
  },
  ide: {
    color: "846da1",
    description: "Issues for VS, VSCode, Monaco, etc.",
  },
  "lib:http": {
    color: "c7aee6",
    description: "",
  },
  "lib:openapi": {
    color: "c7aee6",
    description: "",
  },
  "lib:rest": {
    color: "c7aee6",
    description: "",
  },
  "lib:versioning": {
    color: "c7aee6",
    description: "",
  },
  "lib:http-specs": {
    color: "c7aee6",
    description: "For issues/prs related to the @typespec/http-specs package",
  },
  "meta:blog": {
    color: "007dc8",
    description: "Blog updates",
  },
  "meta:website": {
    color: "007dc8",
    description: "TypeSpec.io updates",
  },
  tspd: {
    color: "004185",
    description: "Issues for the tspd tool",
  },
  "emitter:client:csharp": {
    color: "e1b300",
    description: "Issue for the C# client emitter: @typespec/http-client-csharp",
  },
  "emitter:client:java": {
    color: "e1b300",
    description: "Issue for the Java client emitter: @typespec/http-client-java",
  },
  "emitter:client:python": {
    color: "e1b300",
    description: "Issue for the Python client emitter: @typespec/http-client-python",
  },
  "emitter:client:js": {
    color: "e1b300",
    description: "Issue for the JavaScript client emitter: @typespec/http-client-js",
  },
  "emitter:graphql": {
    color: "957300",
    description: "Issues for @typespec/graphql emitter",
  },
  "emitter:json-schema": {
    color: "957300",
    description: "",
  },
  "emitter:protobuf": {
    color: "957300",
    description: "The protobuf emitter",
  },
  "emitter:openapi3": {
    color: "957300",
    description: "Issues for @typespec/openapi3 emitter",
  },
  "openapi3:converter": {
    color: "957300",
    description: "Issues for @typespec/openapi3 openapi to typespec converter",
  },
  "emitter:service:csharp": {
    color: "967200",
    description: "",
  },
  "emitter:service:js": {
    color: "967200",
    description: "",
  },
  "emitter:service:java": {
    color: "967200",
    description: "Issue for Java service emitter",
  },
  spector: {
    color: "65bfff",
    description: "Issues related to spector and the spec sets",
  },
  eng: {
    color: "65bfff",
    description: "",
  },
  "ui:playground": {
    color: "3256a8",
    description: "",
  },
  "ui:type-graph-viewer": {
    color: "3256a8",
    description: "",
  },
});

export const CommonLabels = {
  issue_kinds: {
    description: "Issue kinds",
    labels: defineLabels({
      bug: {
        color: "d93f0b",
        description: "Something isn't working",
      },
      feature: {
        color: "cccccc",
        description: "New feature or request",
      },
      docs: {
        color: "cccccc",
        description: "Improvements or additions to documentation",
      },
      epic: {
        color: "cccccc",
        description: "",
      },
    }),
  },
  "breaking-change": {
    description:
      "Labels around annotating issues and PR if they contain breaking change or deprecation",
    labels: {
      "breaking-change": {
        color: "B60205",
        description: "A change that might cause specs or code to break",
      },
      deprecation: {
        color: "760205",
        description:
          "A previously supported feature will now report a warning and eventually be removed",
      },
    },
  },
  "design-issues": {
    description: "Design issue management",
    labels: {
      "design:accepted": {
        color: "1a4421",
        description: "Proposal for design has been discussed and accepted.",
      },
      "design:needed": {
        color: "96c499",
        description: "A design request has been raised that needs a proposal",
      },
      "design:proposed": {
        color: "56815a",
        description: "Proposal has been added and ready for discussion",
      },
    },
  },
  process: {
    description: "Process labels",
    labels: {
      "needs-area": {
        color: "ffffff",
        description: "",
      },
      "needs-info": {
        color: "ffffff",
        description:
          "Mark an issue that needs reply from the author or it will be closed automatically",
      },
      stale: {
        color: "ffffff",
        description: "Mark a PR that hasn't been recently updated and will be closed.",
      },
      "triaged:core": {
        color: "5319e7",
        description: "",
      },
    },
  },
};

export default defineConfig({
  repo,
  labels: {
    area: {
      description: "Area of the codebase",
      labels: AreaLabels,
    },
    ...CommonLabels,
    misc: {
      description: "Misc labels",
      labels: {
        "1_0_E2E": {
          color: "5319E7",
          description: "",
        },
        "Client Emitter Migration": {
          color: "FD92F0",
          description: "",
        },
        "good first issue": {
          color: "7057ff",
          description: "Good for newcomers",
        },
        mq: {
          color: "0969da",
          description: "Good candidate for MQ",
        },
      },
    },
  },
  areaPaths: AreaPaths,
});
