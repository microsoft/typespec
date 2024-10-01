import abstractionCode from "@site/src/assets/tsp-samples/openapi3/abstraction.tsp?raw";
import heroMainTsp from "@site/src/assets/tsp-samples/openapi3/hero/main.tsp?raw";
import heroOpenAPIYaml from "@site/src/assets/tsp-samples/openapi3/hero/out/openapi.yaml?raw";
import { Links } from "@site/src/constants";
import { CodeBlock } from "../../code-block/code-block";
import { IllustrationCard } from "../../illustration-card/illustration-card";
import { OpenAPI3InteroperateIllustration } from "../../interoperate-illustration/interoperate-illustration";
import { LearnMoreCard } from "../../learn-more-card/learn-more-card";
import { TabItem, Tabs } from "../../react-tabs";
import { Section } from "../../section/section";
import { SectionedLayout } from "../../sectioned-layout/sectioned-layout";
import { UseCaseOverview } from "../../use-case-overview/use-case-overview";
import style from "./openapi.module.css";

export const OpenApiContent = () => {
  return (
    <div>
      <UseCaseOverview
        title="Write TypeSpec, emit OpenAPI"
        subtitle="Emitting OpenAPI from TypeSpec enables seamless cross-language interaction, automates API-related tasks, and simplifies API management and evolution."
        link={Links.gettingStartedOpenAPI}
        illustration={<OpenAPI3HeroIllustration />}
      />
      <SectionedLayout>
        <Section
          header="Ecosystem"
          title="Interoperate with the OpenAPI ecosystem"
          description="Benefit from a huge ecosystem of OpenAPI tools for configuring API gateways, generating code, and validating your data."
          illustration={<OpenAPI3InteroperateIllustration />}
        >
          <LearnMoreCard
            title="Linters"
            description="Integrate with spectral to lint your OpenAPI."
            image="shield-blue"
            link={Links.spectral}
          />
        </Section>

        <Section
          layout="text-right"
          header="Ecosystem"
          title="Abstract recurring patterns"
          description="Transform API patterns into reusable elements to enhance both the quality and uniformity of your API interface."
          illustration={<OpenAPI3AbstractCode />}
        >
          <LearnMoreCard
            title="Example: TypeSpec Azure Library"
            description="The TypeSpec library for Azure allows multiple teams to reuse pre-approved patterns."
            image="document-cloud"
            link={Links.typespecAzure}
          />
        </Section>
      </SectionedLayout>
    </div>
  );
};

export const OpenAPI3HeroIllustration = () => {
  return (
    <IllustrationCard>
      <Tabs>
        <TabItem value="main.tsp">
          <CodeBlock language="tsp">{heroMainTsp}</CodeBlock>
        </TabItem>
        <TabItem value="openapi.yaml">
          <div className={style["hero-openapi"]}>
            <CodeBlock language="yaml">{heroOpenAPIYaml}</CodeBlock>
          </div>
        </TabItem>
      </Tabs>
    </IllustrationCard>
  );
};

export const OpenAPI3AbstractCode = () => {
  return (
    <IllustrationCard>
      <CodeBlock language="tsp">{abstractionCode}</CodeBlock>
    </IllustrationCard>
  );
};
