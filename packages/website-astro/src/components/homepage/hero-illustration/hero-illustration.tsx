import openapiTsp from "@site/src/assets/tsp-samples/homepage/hero/http/main.tsp?raw";
import openapiYaml from "@site/src/assets/tsp-samples/homepage/hero/http/out/openapi.yaml?raw";

import jsonSchemaTsp from "@site/src/assets/tsp-samples/homepage/hero/json-schema/main.tsp?raw";
import jsonSchemaOutput from "@site/src/assets/tsp-samples/homepage/hero/json-schema/out/schema.yaml?raw";

import protobufTsp from "@site/src/assets/tsp-samples/protobuf/hero/main.tsp?raw";
import protobufOutput from "@site/src/assets/tsp-samples/protobuf/hero/out/addressbook.proto?raw";

import { HeroTabs } from "../../hero-tabs/hero-tabs";
import { Window } from "../../window/window";

import clsx from "clsx";
import { CodeBlock } from "../../prism-code-block/prism-code-block";
import style from "./hero-illustration.module.css";

export const HeroIllustration = () => {
  return (
    <HeroTabs
      tabs={[
        {
          value: "Http",
          content: <OpenAPI3Illustration />,
        },
        { value: "JSON Schema", content: <JsonSchemaIllustration /> },
        { value: "Protobuf", content: <ProtobufIllustration /> },
      ]}
    ></HeroTabs>
  );
};

const OpenAPI3Illustration = () => {
  return (
    <Window className={style["hero-illustration"]}>
      <div className={style["split-windows"]}>
        <CodeBlock className={style["split-window"]} language="tsp" title="main.tsp">
          {openapiTsp}
        </CodeBlock>
        <CodeBlock
          className={clsx(style["split-window"], style["output"])}
          language="yaml"
          title="openapi.yaml"
        >
          {openapiYaml}
        </CodeBlock>
      </div>
    </Window>
  );
};
const JsonSchemaIllustration = () => {
  return (
    <Window className={style["hero-illustration"]}>
      <div className={style["split-windows"]}>
        <CodeBlock className={style["split-window"]} language="tsp" title="main.tsp">
          {jsonSchemaTsp}
        </CodeBlock>
        <CodeBlock
          className={clsx(style["split-window"], style["output"])}
          language="yaml"
          title="schema.yaml"
        >
          {jsonSchemaOutput}
        </CodeBlock>
      </div>
    </Window>
  );
};
const ProtobufIllustration = () => {
  return (
    <Window className={style["hero-illustration"]}>
      <div className={style["split-windows"]}>
        <CodeBlock className={style["split-window"]} language="tsp" title="main.tsp">
          {protobufTsp}
        </CodeBlock>
        <CodeBlock
          className={clsx(style["split-window"], style["output"])}
          language="protobuf"
          title="addressbook.proto"
        >
          {protobufOutput}
        </CodeBlock>
      </div>
    </Window>
  );
};
