import abstractionCode from "!!raw-loader!@site/static/tsp-samples/openapi3/abstraction.tsp";
import interoperateTsp from "!!raw-loader!@site/static/tsp-samples/openapi3/interoperate/main.tsp";
import interoperateOpenapi from "!!raw-loader!@site/static/tsp-samples/openapi3/interoperate/openapi.yaml";
import interoperateSpectral from "!!raw-loader!@site/static/tsp-samples/openapi3/interoperate/spectral.txt";
import { Links } from "@site/src/constants";
import TabItem from "@theme/TabItem";
import Tabs from "@theme/Tabs";
import { AssetImg } from "../components/asset-img/asset-img";
import { CodeBlock } from "../components/code-block/code-block";
import { FluentLayout } from "../components/fluent-layout";
import { Section } from "../components/section/section";
import { SectionedLayout } from "../components/sectioned-layout/sectioned-layout";
import {
  UseCaseFeature,
  UseCaseFeatureGroup,
} from "../components/use-case-feature/use-case-feature";
import { UseCaseOverview } from "../components/use-case-overview/use-case-overview";
import style from "./openapi.module.css";
export default function Home() {
  return (
    <FluentLayout>
      <OpenApiContent />
    </FluentLayout>
  );
}

const OpenApiContent = () => {
  return (
    <div>
      <UseCaseOverview
        title="Write TypeSpec, emit OpenAPI"
        subtitle="Benefit from a huge ecosystem of OpenAPI tools for configuring API gateways, generating code, and validating your data."
        link={Links.gettingStartedOpenAPI}
        illustration={<OpenAPI3HeroIllustration />}
      />
      <SectionedLayout>
        <UseCaseFeatureGroup>
          <UseCaseFeature
            image="design"
            title="Use HTTP/REST libraries"
            subtitle="Drastically reduce the verbosity of your spec."
            link={Links.gettingStartedWithHttp}
          />
          <UseCaseFeature
            image="design"
            title="Max 50 characters"
            subtitle="Describe a specific feature and how it benefits users. One to three lines."
            link=""
          />
          <UseCaseFeature
            image="design"
            title="Abstract common patterns"
            subtitle="Codify API patterns into reusable components, improving up quality and consistency across your API surface"
            link={Links.spectral}
          />
        </UseCaseFeatureGroup>

        <Section
          header="Ecosystem"
          title="Interoperate with the OpenAPI ecosystem"
          description="Write TypeSpec, emit OpenAPI. Benefit from a huge ecosystem of OpenAPI tools for configuring API gateways, generating code, and validating your data."
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
          title="Abstract common patterns"
          description="Codify API patterns into reusable components, improving up quality and consistency across your API surface."
          illustration={<OpenAPI3AbstractCode />}
        >
          <LearnMoreCard
            title="Example: TypeSpec Azure Library"
            description="Azure library for TypeSpec allows a multitude of teams to reuse approved patterns."
            image="document-cloud"
            link={Links.typespecAzure}
          />
        </Section>
      </SectionedLayout>
    </div>
  );
};

import heroMainTsp from "!!raw-loader!@site/static/tsp-samples/openapi3/hero/main.tsp";
import heroOpenAPIYaml from "!!raw-loader!@site/static/tsp-samples/openapi3/hero/out/openapi.yaml";
import { IllustrationCard } from "../components/illustration-card/illustration-card";
import { LearnMoreCard } from "../components/learn-more-card/learn-more-card";
export const OpenAPI3HeroIllustration = () => {
  return (
    <IllustrationCard>
      <Tabs>
        <TabItem value="main.tsp">
          <CodeBlock language="tsp">{heroMainTsp}</CodeBlock>
        </TabItem>
        <TabItem value="openapi.yaml">
          <div className={style["hero-openapi"]}>
            <CodeBlock language="tsp">{heroOpenAPIYaml}</CodeBlock>
          </div>
        </TabItem>
      </Tabs>
    </IllustrationCard>
  );
};

const OpenAPI3InteroperateIllustration = () => {
  return (
    <IllustrationCard>
      <div className={style["interoperate-illustration"]}>
        <div className={style["interoperate-tsp"]}>
          <CodeBlock language="tsp">{interoperateTsp}</CodeBlock>
        </div>
        <div className={style["interoperate-openapi"]}>
          <CodeBlock language="yaml">{interoperateOpenapi}</CodeBlock>
        </div>
        <div className={style["interoperate-spectral"]}>
          <CodeBlock language="shell-session">{interoperateSpectral}</CodeBlock>
        </div>
        <AssetImg className={style["interoperate-swagger-ui"]} src="illustrations/swagger-ui.png" />
      </div>
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
