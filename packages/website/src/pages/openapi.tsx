import { FluentLayout } from "../components/fluent-layout";
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
    </div>
  );
};
