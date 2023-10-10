import { CodeBlock } from "../components/code-block/code-block";
import { FluentLayout } from "../components/fluent-layout";
import { Section } from "../components/homepage/section/section";
import { SectionedLayout } from "../components/sectioned-layout/sectioned-layout";
import { UseCaseOverview } from "../components/use-case-overview/use-case-overview";

export default function Home() {
  return (
    <FluentLayout>
      <DataValidationContent />
    </FluentLayout>
  );
}

const DataValidationContent = () => {
  return (
    <div>
      <UseCaseOverview
        title="Action-oriented use case description over two lines"
        subtitle="Meet TypeSpec, a language for describing APIs. Compile to OpenAPI, JSON RPC, client and server code, docs, and more."
        link=""
      />
      <SectionedLayout>
        <Section
          header="Standard library"
          title="Use built-in decorators"
          description="TypeSpec standard library provides decorators for common validation patterns."
          illustration={<ValidationDecoratorsIllustration />}
          items={[
            {
              title: "Standard library reference",
              description: "Browse the standard library reference documentation for details.",
              image: "people-shield",
              link: Links.standardLibrary.decorators,
            },
          ]}
        />
      </SectionedLayout>
    </div>
  );
};

import validationDecoratorsTsp from "!!raw-loader!@site/static/tsp-samples/data-validation/validation-decorators.tsp";
import { Links } from "../constants";

const ValidationDecoratorsIllustration = () => {
  return <CodeBlock language="tsp">{validationDecoratorsTsp}</CodeBlock>;
};
