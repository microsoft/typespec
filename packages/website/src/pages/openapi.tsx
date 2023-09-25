import { FluentLayout } from "../components/fluent-layout";
import { UseCaseFeature, UseCaseFeatureGroup } from "../components/use-case-feature/use-case-feature";
import { UseCaseLayout } from "../components/use-case-layout/use-case-layout";
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
      <UseCaseLayout>
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
      </UseCaseLayout>
    </div>
  );
};
