import { CodeBlock } from "../components/code-block/code-block";
import { FluentLayout } from "../components/fluent-layout";
import { Section } from "../components/homepage/section/section";
import { SectionedLayout } from "../components/sectioned-layout/sectioned-layout";
import { UseCaseOverview } from "../components/use-case-overview/use-case-overview";
import style from "./tooling.module.css";

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
        title="Syntax highlighting, autocomplete, formatter and more"
        subtitle="Typespec comes out of the box with many crucial tooling that will improve your productivity."
        link={Links.tooling.formatter}
      />
      <SectionedLayout>
        <Section
          header="Style consitency"
          title="Built-in formatter"
          description="TypeSpec provide an opinionated formatter that enables you to enforce a consistent style in your codebase."
          illustration={<FormatterIllustration />}
          items={[
            {
              title: "Formatter usage",
              description: "See documentation on how to use the formatter.",
              image: "text-edit",
              link: Links.tooling.formatter,
            },
            {
              title: "Style guide",
              description: "See our recommended styles when writing TypeSpec.",
              image: "document-add",
              link: Links.tooling.styleGuide,
            },
          ]}
        />
      </SectionedLayout>
    </div>
  );
};

import notFormattedTsp from "!!raw-loader!@site/static/tsp-samples/tooling/formatter/file.noformat.tsp";
import formattedTsp from "!!raw-loader!@site/static/tsp-samples/tooling/formatter/formatted.tsp";
import { Links } from "../constants";

const FormatterIllustration = () => {
  return (
    <div className={style["formatter-illustration"]}>
      <div className={style["formatter-illustration-unformatted"]}>
        <div className={style["badge"]}>Unformatted</div>
        <CodeBlock language="tsp">{notFormattedTsp}</CodeBlock>
      </div>
      <div className={style["formatter-illustration-formatted"]}>
        <div className={style["badge"]}>Formatted</div>
        <CodeBlock language="tsp">{formattedTsp}</CodeBlock>
      </div>
    </div>
  );
};
