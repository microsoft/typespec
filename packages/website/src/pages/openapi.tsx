import { FluentLayout } from "../components/fluent-layout";
import { Section } from "../components/homepage/section/section";
import {
  UseCaseFeature,
  UseCaseFeatureGroup,
} from "../components/use-case-feature/use-case-feature";
import { SectionedLayout } from "../components/sectioned-layout/sectioned-layout";
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
        title="Action-oriented use case description over two lines"
        subtitle="Meet TypeSpec, a language for describing APIs. Compile to OpenAPI, JSON RPC, client and server code, docs, and more."
        link=""
      />
      <SectionedLayout>
        <UseCaseFeatureGroup>
          <UseCaseFeature
            image="design"
            title="Max 50 characters"
            subtitle="Describe a specific feature and how it benefits users. One to three lines."
            link=""
          />
          <UseCaseFeature
            image="design"
            title="Max 50 characters"
            subtitle="Describe a specific feature and how it benefits users. One to three lines."
            link=""
          />
          <UseCaseFeature
            image="design"
            title="Max 50 characters"
            subtitle="Describe a specific feature and how it benefits users. One to three lines."
            link=""
          />
        </UseCaseFeatureGroup>

        <Section
          header="Ecosystem"
          title="Test API endpoints as you code"
          description="Build a complete JSON RPC interface for your service, call it from your web browser, and test out endpoints in a breeze."
          items={[
            {
              title: "TypeSpec for JSON RPC developer",
              description: "Description todo",
              image: "design",
              link: "/json-rpc",
            },
          ]}
        />

        <Section
          layout="text-right"
          header="Ecosystem"
          title="Test API endpoints as you code"
          description="Build a complete JSON RPC interface for your service, call it from your web browser, and test out endpoints in a breeze."
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
