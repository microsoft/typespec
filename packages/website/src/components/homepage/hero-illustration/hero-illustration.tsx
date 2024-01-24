import openapiTsp from "!!raw-loader!@site/static/tsp-samples/openapi3/hero/main.tsp";
import openapiYaml from "!!raw-loader!@site/static/tsp-samples/openapi3/hero/out/openapi.yaml";

import jsonSchemaTsp from "!!raw-loader!@site/static/tsp-samples/json-schema/hero/main.tsp";
import jsonSchemaOutput from "!!raw-loader!@site/static/tsp-samples/json-schema/hero/out/schema.yaml";

import protobufTsp from "!!raw-loader!@site/static/tsp-samples/protobuf/hero/main.tsp";
import protobufOutput from "!!raw-loader!@site/static/tsp-samples/protobuf/hero/out/addressbook.proto";

import CodeBlock from "@theme/CodeBlock";
import { HeroTabs } from "../../hero-tabs/hero-tabs";
import { Window } from "../../window/window";

import clsx from "clsx";
import style from "./hero-illustration.module.css";

export const HeroIllustration = () => {
  return (
    <HeroTabs
      tabs={[
        {
          value: "Http",
          content: <OpenAPI3Illustration />,
        },
        { value: "Json Schema", content: <JsonSchemaIllustration /> },
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
