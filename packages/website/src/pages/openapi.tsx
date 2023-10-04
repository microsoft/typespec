import abstractionCode from "!!raw-loader!@site/static/tsp-samples/openapi3/abstraction.tsp";
import { Links } from "@site/src/constants";
import CodeBlock from "@theme/CodeBlock";
import { FluentLayout } from "../components/fluent-layout";
import { Section } from "../components/homepage/section/section";
import { SectionedLayout } from "../components/sectioned-layout/sectioned-layout";
import {
  UseCaseFeature,
  UseCaseFeatureGroup,
} from "../components/use-case-feature/use-case-feature";
import { UseCaseOverview } from "../components/use-case-overview/use-case-overview";
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
          description="Build a complete JSON RPC interface for your service, call it from your web browser, and test out endpoints in a breeze."
          illustration="illustrations/openapi3.png"
          items={[
            {
              title: "Api Gateway",
              description: "Description todo",
              image: "document-cloud",
              link: "/json-rpc",
            },
            {
              title: "Code Generators",
              description: "Use the generated OpenAPI to generate code.",
              image: "document-add",
              link: Links.spectral,
            },
            {
              title: "Linters",
              description: "Integrate with spectral to lint your OpenAPI.",
              image: "shield-blue",
              link: Links.spectral,
            },
          ]}
        />

        <Section
          layout="text-right"
          header="Ecosystem"
          title="Abstract common patterns"
          description="Codify API patterns into reusable components, improving up quality and consistency across your API surface."
          illustration={<OpenAPI3AbstractCode />}
          items={[
            {
              title: "Example: TypeSpec Azure Library",
              description:
                "Azure library for TypeSpec allows a multitude of teams to reuse approved patterns.",
              image: "document-cloud",
              link: "/json-rpc",
            },
          ]}
        />
      </SectionedLayout>
    </div>
  );
};

export const OpenAPI3AbstractCode = () => {
  return <CodeBlock language="tsp">{abstractionCode}</CodeBlock>;
};
