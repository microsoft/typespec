import { DataValidationHeroIllustration } from "@site/src/components/react-pages/data-validation";
import { OpenAPI3HeroIllustration } from "@site/src/components/react-pages/openapi";
import { Links } from "@site/src/constants";
import { Button } from "../button/button";
import { FeatureList } from "../feature-list/feature-list";
import { LearnMoreCard } from "../learn-more-card/learn-more-card";
import { LightDarkImg } from "../light-dark-img/light-dark-img";
import { CodeBlock } from "../prism-code-block/prism-code-block";
import { Section } from "../section/section";
import { DescriptionText, PrimaryText } from "../text/text";
import style from "./homepage.module.css";
import { OverviewIllustration } from "./overview-illustration/overview-illustration";

export const Overview = () => {
  return (
    <>
      <div className={style["overview"]}>
        <div className={style["overview-summary"]}>
          <PrimaryText>Why TypeSpec</PrimaryText>
          <div className={style["overview-subtitle"]}>API-First for developers</div>
          <DescriptionText size="large" className={style["overview-description"]}>
            With TypeSpec, remove the handwritten files that slow you down, and generate
            standards-compliant API schemas in seconds.
          </DescriptionText>
        </div>
        <Section layout="text-right" illustration={<OverviewIllustration />} itemStyle="plain">
          <FeatureList
            items={[
              {
                title: "Lightweight language for defining APIs",
                description:
                  "Inspired by TypeScript, TypeSpec is a minimal language that helps developers describe API shapes in a familiar way.",
                image: "book-pencil",
                link: Links.gettingStartedOpenAPI,
              },
              {
                title: "Easy integration with your toolchain",
                description:
                  "Write TypeSpec, emit to various formats and integrate with their ecosystems.",
                image: "document-add",
              },
              {
                title: "Multi-protocol support",
                description:
                  "TypeSpec's standard library includes support for OpenAPI 3.0, JSON Schema 2020-12 and Protobuf.",
                image: "tasks",
                link: "/multi-protocol",
              },
            ]}
          />
        </Section>
      </div>
    </>
  );
};

export const OpenAPISection = () => {
  return (
    <Section
      header="Productivity"
      title="Streamline your OpenAPI workflow"
      description="Benefit from a huge ecosystem of OpenAPI tools for configuring API gateways, generating code, and validating your data."
      illustration={<OpenAPI3HeroIllustration />}
    >
      <LearnMoreCard
        title="Generate OpenAPI from TypeSpec"
        image="design"
        link={Links.useCases.openapi}
      />
    </Section>
  );
};

export const DataValidationSection = () => {
  return (
    <Section
      header="Ecosystem"
      title="Ensure data consistency"
      description="Define common models to use across your APIs, use the JSON schema emitter to get the JSON schema for your types and use them to validate your data."
      illustration={<DataValidationHeroIllustration />}
    >
      <LearnMoreCard
        title="JSON schema emitter reference"
        image="people-shield"
        link={Links.useCases.dataValidation}
      />
    </Section>
  );
};

export const EditorSection = () => {
  return (
    <Section
      header="Tooling"
      title="Full language support in VS Code and Visual Studio"
      description="TypeSpec provides built-in support for many common editor features such as syntax highlighting, code completion, and more."
      illustration={<LightDarkImg src="illustrations/ide-hero" />}
    >
      <LearnMoreCard
        title="Check out our available tooling"
        image="data-trending"
        link={Links.useCases.tooling}
      />
    </Section>
  );
};

export const ExtensibilitySection = () => {
  return (
    <Section
      header="Extensibility"
      title="Generate assets in many formats"
      description="TypeSpec is built around extensibility - you can write your own emitter or add custom metadata using a new decorator."
      illustration={<ExtensibilityIllustration />}
    >
      <LearnMoreCard
        title="Getting started with writing a library"
        image="data-trending"
        link={Links.extensibility.gettingStarted}
      />
    </Section>
  );
};

import extensibilityTs from "@site/src/assets/tsp-samples/extensibility/custom-lib.ts?raw";
import extensibilityTsp from "@site/src/assets/tsp-samples/extensibility/custom-lib.tsp?raw";
import { link } from "@site/src/utils";

const ExtensibilityIllustration = () => {
  return (
    <div>
      <CodeBlock language="tsp" title="lib.tsp">
        {extensibilityTsp}
      </CodeBlock>
      <div className={style["codeblock-seperator"]}></div>
      <CodeBlock language="ts" title="lib.ts">
        {extensibilityTs}
      </CodeBlock>
    </div>
  );
};

export const Closing = () => {
  return (
    <div className={style["closing"]}>
      <div className={style["closing-title"]}>Start your TypeSpec journey</div>
      <DescriptionText>
        Install the TypeSpec CLI or check out the playground to get started.
      </DescriptionText>
      <div className={style["closing-buttons"]}>
        <Button as="a" appearance="primary" href={link(Links.docs)}>
          Get Started
        </Button>
        <Button as="a" appearance="outline" href={link(Links.playground)}>
          Try it out
        </Button>
      </div>
    </div>
  );
};
