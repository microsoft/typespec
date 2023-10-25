import useBaseUrl from "@docusaurus/useBaseUrl";
import { Links } from "@site/src/constants";
import { DataValidationHeroIllustration } from "@site/src/pages/data-validation";
import { OpenAPI3HeroIllustration } from "@site/src/pages/openapi";
import { Button } from "../button/button";
import { CodeBlock } from "../code-block/code-block";
import { FeatureList } from "../feature-list/feature-list";
import { HeroTabs } from "../hero-tabs/hero-tabs";
import { LearnMoreCard } from "../learn-more-card/learn-more-card";
import { LightDarkImg } from "../light-dark-img/light-dark-img";
import { Section } from "../section/section";
import { SectionedLayout } from "../sectioned-layout/sectioned-layout";
import { DescriptionText, PrimaryText } from "../text/text";
import style from "./homepage.module.css";
import { OverviewIllustration } from "./overview-illustration/overview-illustration";

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
          <DescriptionText size="large" className={style["hero-description"]}>
            Describe your data up front and generate schemas, API specifications, client / server
            code, docs, and more.
          </DescriptionText>
          <div className={style["hero-buttons"]}>
            <Button as="a" appearance="primary" href={useBaseUrl(Links.docs)}>
              Get Started
            </Button>
            <Button as="a" appearance="outline" href={useBaseUrl(Links.playground)}>
              Try it out
            </Button>
          </div>
        </div>
        <div className={style["hero-demo"]}>
          <HeroTabs
            tabs={[
              {
                value: "OpenAPI",
                content: (
                  <DotLottiePlayer src={useBaseUrl(`/lottie/openapi-hero.lottie`)} autoplay loop />
                ),
              },
              { value: "Json Schema", content: <></> },
              { value: "Protobuf", content: <></> },
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
                description: "Description TBU",
                image: "document-add",
                link: "/docs/standard-library/openapi3/reference",
              },
              {
                title: "Multi-protocol support",
                description:
                  "TypeSpec's standard library includes support for OpenAPI 3.0, JSON Schema 2020-12, Protobuf, and JSON RPC.",
                image: "tasks",
                link: "/docs/standard-library/openapi3/reference",
              },
            ]}
          />
        </Section>
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
    >
      <LearnMoreCard
        title="Generate OpenAPI from TypeSpec"
        image="design"
        link={Links.useCases.openapi}
      />
    </Section>
  );
};

const DataValidationSection = () => {
  return (
    <Section
      header="Ecosystem"
      title="Ensure data consistency"
      description="Defined common models to use across your APIs, use the json schema emitter to get the json schema for your types and use them to validate your data."
      illustration={<DataValidationHeroIllustration />}
    >
      <LearnMoreCard
        title="Json schema emitter reference"
        image="people-shield"
        link={Links.useCases.dataValidation}
      />
    </Section>
  );
};

const EditorSection = () => {
  return (
    <Section
      header="Tooling"
      title="First party support for code editor"
      description="Typespec provide built-in support for many common editor features such as syntax highlighting, code completion, and more."
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

const ExtensibilitySection = () => {
  return (
    <Section
      header="Extensibility"
      title="Generate assets in many formats"
      description="Typespec is built around extensibility, one can write and plugin their own emitter or add custom metadata using a new decorator."
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

import extensibilityTs from "!!raw-loader!@site/static/tsp-samples/extensibility/custom-lib.ts";
import extensibilityTsp from "!!raw-loader!@site/static/tsp-samples/extensibility/custom-lib.tsp";
import { DotLottiePlayer } from "@dotlottie/react-player";

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
      <div className={style["closing-title"]}>Start your TypeSpec journey</div>
      <DescriptionText>
        Install the TypeSpec CLI or check out the playground to get started.
      </DescriptionText>
      <div className={style["closing-buttons"]}>
        <Button as="a" appearance="primary" href={useBaseUrl(Links.docs)}>
          Get Started
        </Button>
        <Button as="a" appearance="outline" href={useBaseUrl(Links.playground)}>
          Try it out
        </Button>
      </div>
    </div>
  );
};
