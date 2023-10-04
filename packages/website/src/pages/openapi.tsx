import { Links } from "@site/src/constants";
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
            subtitle="Codify API patterns into reusable components, diving up quality and consistency across your API surface"
            link={Links.spectral}
          />
        </UseCaseFeatureGroup>

        <Section
          header="Ecosystem"
          title="Interoperate with the OpenAPI ecosystem"
          description="Build a complete JSON RPC interface for your service, call it from your web browser, and test out endpoints in a breeze."
          image="illustrations/openapi3.png"
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
          title="Test API endpoints as you code"
          description="Build a complete JSON RPC interface for your service, call it from your web browser, and test out endpoints in a breeze."
          image="illustrations/openapi3.png"
          items={[
            {
              title: "TypeSpec for JSON RPC developer",
              description: "Description todo",
              image: "design",
              link: "/json-rpc",
            },
          ]}
        />
      </SectionedLayout>
    </div>
  );
};
