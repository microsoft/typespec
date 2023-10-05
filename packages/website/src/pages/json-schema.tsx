import { FluentLayout } from "../components/fluent-layout";
import { Section } from "../components/homepage/section/section";
import { SectionedLayout } from "../components/sectioned-layout/sectioned-layout";
import { UseCaseOverview } from "../components/use-case-overview/use-case-overview";
import { Links } from "../constants";

export default function Home() {
  return (
    <FluentLayout>
      <JsonRpcContent />
    </FluentLayout>
  );
}

const JsonRpcContent = () => {
  return (
    <div>
      <UseCaseOverview
        title="Use Json Schema to validate your data"
        subtitle="Benefit from the Json Schema ecosystem to validate your data while writing a much more concise and readable code."
        link={Links.libraryReferences.jsonSchema}
      />
      <SectionedLayout>
        <Section
          header="Ecosystem"
          title="Test API endpoints as you code"
          description="Build a complete JSON RPC interface for your service, call it from your web browser, and test out endpoints in a breeze."
          illustration="illustrations/openapi3.png"
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
          illustration="illustrations/openapi3.png"
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
