import { CodeBlock } from "../components/code-block/code-block";
import { FluentLayout } from "../components/fluent-layout";
import { Section } from "../components/section/section";
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
        link={Links.editor.home}
        illustration={<LightDarkImg src="illustrations/ide-hero" />}
      />
      <SectionedLayout>
        <Section
          header="Style consistency"
          title="Built-in formatter"
          description="TypeSpec provide an opinionated formatter that enables you to enforce a consistent style in your codebase."
          illustration={<FormatterIllustration />}
        >
          <LearnMoreCard
            title="Formatter usage"
            description="See documentation on how to use the formatter."
            image="text-edit"
            link={Links.tooling.formatter}
          />
        </Section>
        <Section
          layout="text-right"
          header="Warning"
          title="Warning and errors"
          description="Errors and warnings in your spec are reported as you type."
          illustration="illustrations/warnings-and-errors.png"
        >
          <LearnMoreCard
            title="Extension installation"
            description="See documentation on how to install editor extensions."
            image="text-edit"
            link={Links.editor.home}
          />
        </Section>
        <Section
          header="Intellisense"
          title="Autocomplete and more"
          description="IntelliSense shows you intelligent code completion, hover information, and signature help so that you can write code more quickly and correctly."
          illustration="illustrations/ide.png"
        />
        <Section
          layout="text-right"
          header="Refactor"
          title="Bulk renaming"
          description="One of the simplest refactoring is to rename a reference. You can rename a identifier and see all its reference across your TypeSpec project update."
          illustration={
            <video
              src={useBaseUrl("/img/illustrations/refactor.mp4")}
              autoPlay={true}
              loop={true}
            />
          }
        />
      </SectionedLayout>
    </div>
  );
};

import notFormattedTsp from "!!raw-loader!@site/static/tsp-samples/tooling/formatter/file.noformat.tsp";
import formattedTsp from "!!raw-loader!@site/static/tsp-samples/tooling/formatter/formatted.tsp";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { LearnMoreCard } from "../components/learn-more-card/learn-more-card";
import { LightDarkImg } from "../components/light-dark-img/light-dark-img";
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
