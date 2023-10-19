import useBaseUrl from "@docusaurus/useBaseUrl";
import { Button, Text, Title2 } from "@fluentui/react-components";
import { Links } from "@site/src/constants";
import openapiHeroLottie from "@site/static/lottie/openapi-hero.json";
import { CodeBlock } from "../code-block/code-block";
import { SectionedLayout } from "../sectioned-layout/sectioned-layout";
import { Feature, FeatureGroup } from "./feature/feature";
import style from "./homepage.module.css";
import { Section } from "./section/section";

export const HomeContent = () => {
  return (
    <>
      <Hero />
      <div className={style["hero-divider"]}></div>
      <SectionedLayout>
        <Overview />
        <OpenAPISection />
        <DataValidationSection />
        <EditorSection />
        <ExtensibilitySection />
        <Closing />
      </SectionedLayout>
    </>
  );
};

const Hero = () => {
  return (
    <>
      <div className={style["hero-container"]}>
        <div className={style["hero-content"]}>
          <h1 className={style["hero-title"]}>TypeSpec</h1>
          <div className={style["hero-subtitle"]}>Describe APIs at scale</div>
          <DescriptionText className={style["hero-description"]}>
            Describe your data up front and generate schemas, API specifications, client / server
            code, docs, and more.
          </DescriptionText>
          <div className={style["hero-buttons"]}>
            <Button as="a" appearance="primary" href={useBaseUrl("/docs")}>
              Getting Started
            </Button>
            <Button as="a" appearance="outline">
              Try it out
            </Button>
          </div>
        </div>
        <div className={style["hero-demo"]}>
          <HeroTabs
            tabs={[
              { value: "OpenAPI", content: openapiHeroLottie },
              { value: "Json Schema", content: openapiHeroLottie },
              { value: "Protobuf", content: openapiHeroLottie },
            ]}
          ></HeroTabs>
        </div>
      </div>
    </>
  );
};

const Overview = () => {
  return (
    <>
      <div className={style["overview"]}>
        <div className={style["overview-summary"]}>
          <Title2 block={true}>API-First for developers</Title2>
          <Text block={true} className={style["overview-description"]}>
            Don't let the nitty-gritty details of an API protocol get in the way of prioritizing
            your design. With TypeSpec, remove the handwritten files that slow you down, and
            generate standards-compliant API schemas in seconds.
          </Text>
        </div>
        <FeatureGroup>
          <Feature title="Describe complex APIs, fast" image="editor">
            Reduce the time it takes to describe complex API shapes by using a minimal language
            that's easy for developers to use and love.
          </Feature>
          <Feature title="Codify your API guidelines" image="people-shield">
            All the benefits of API review, built into your dev workflow. Codify your team's API
            guidelines and catch errors at development time.
          </Feature>
          <Feature title="Generate assets in many formats" image="firework">
            With a single line of code, generate a multitude of API assets in your preferred format
            or protocol - even all at the same time.
          </Feature>
        </FeatureGroup>
      </div>
    </>
  );
};

const OpenAPISection = () => {
  return (
    <Section
      header="Productivity"
      title="Streamline your OpenAPI workflow"
      description="Benefit from a huge ecosystem of OpenAPI tools for configuring API gateways, generating code, and validating your data."
      illustration={<OpenAPI3HeroIllustration />}
      items={[
        {
          title: "TypeSpec for OpenAPI developers",
          description: "Get started with using TypeSpec coming from OpenAPI.",
          image: "design",
          link: Links.gettingStartedOpenAPI,
        },
        {
          title: "OpenAPI emitter reference",
          description: "Reference documentation for the OpenAPI 3.0 emitter.",
          image: "document-add",
          link: "/docs/standard-library/openapi3/reference",
        },
      ]}
    />
  );
};

const DataValidationSection = () => {
  return (
    <Section
      header="Ecosystem"
      title="Ensure data consitency"
      description="Defined common models to use across your APIs, use the json schema emitter to get the json schema for your types and use them to validate your data."
      illustration={<DataValidationHeroIllustration />}
      items={[
        {
          title: "Json schema emitter reference",
          description: "Generate the JSON Schema for your types.",
          image: "people-shield",
          link: Links.libraryReferences.jsonSchema.index,
        },
      ]}
    />
  );
};

const EditorSection = () => {
  return (
    <Section
      header="IDE"
      title="First party support for code editor"
      description="Typespec provide built-in support for many common editor features such as syntax highlighting, code completion, and more."
      illustration={<LightDarkImg src="illustrations/ide-hero" />}
      items={[
        {
          title: "TypeSpec for Visual Studio Code",
          link: Links.editor.code,
        },
        {
          title: "TypeSpec for Visual Studio",
          link: Links.editor.visualStudio,
        },
      ]}
    />
  );
};

const ExtensibilitySection = () => {
  return (
    <Section
      header="Extensibility"
      title="Custom decorators and emitters"
      description="Typespec is built around extensibility, one can write and plugin their own emitter or add custom metadata using a new decorator."
      illustration={<ExtensibilityIllustration />}
      items={[
        {
          title: "Getting started with writing a library",
          description: "",
          link: Links.extensibility.gettingStarted,
        },
        {
          title: "Create a decorator",
          description: "",
          link: Links.extensibility.decorators,
        },
        {
          title: "Create an emitter",
          description: "",
          link: Links.extensibility.decorators,
        },
      ]}
    />
  );
};

import extensibilityTs from "!!raw-loader!@site/static/tsp-samples/extensibility/custom-lib.ts";
import extensibilityTsp from "!!raw-loader!@site/static/tsp-samples/extensibility/custom-lib.tsp";
import { DataValidationHeroIllustration } from "@site/src/pages/data-validation";
import { OpenAPI3HeroIllustration } from "@site/src/pages/openapi";
import { DescriptionText } from "../description-text/description-text";
import { HeroTabs } from "../hero-tabs/hero-tabs";
import { LightDarkImg } from "../light-dark-img/light-dark-img";

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

const Closing = () => {
  return (
    <div className={style["closing"]}>
      <div className={style["closing-content"]}>
        <Title2 block={true}>Ready to get started?</Title2>
        <Button as="a" appearance="secondary" href="/docs">
          Docs
        </Button>
      </div>
    </div>
  );
};
