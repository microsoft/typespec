import SectionedLayout from "@site/src/components/sectioned-layout.astro";
import { CodeBlock } from "../prism-code-block/prism-code-block";
import { Section } from "../section/section";
import { UseCaseOverview } from "../use-case-overview/use-case-overview";
import style from "./tooling.module.css";

export const ToolingContent = () => {
  return (
    <div>
      <UseCaseOverview
        title="Syntax highlighting, autocomplete, formatting, and more"
        subtitle="TypeSpec is supported by a variety of readily available tools, designed to boost your productivity right from the start."
        link={Links.editor.home}
        illustration={<LightDarkImg src="illustrations/ide-hero" />}
      />
      <SectionedLayout>
        <Section
          header="Style consistency"
          title="Built-in formatter"
          description="TypeSpec provides an opinionated formatter that enables you to enforce a consistent style in your codebase."
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
          illustration={<LightDarkImg src="illustrations/warnings-and-errors" />}
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
          description="IntelliSense shows you intelligent code completion, hover information, and signature help so that you can quickly and efficiency write correct code."
          illustration={<LightDarkImg src="illustrations/autocomplete" />}
        />
        <Section
          layout="text-right"
          header="Refactor"
          title="Bulk renaming"
          description="One of the simplest forms of refactoring is renaming a reference. Rename an identifier and see all of its references updated across your TypeSpec project."
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

import useBaseUrl from "@docusaurus/useBaseUrl";
import notFormattedTsp from "@site/src/assets/tsp-samples/tooling/formatter/file.noformat.tsp?raw";
import formattedTsp from "@site/src/assets/tsp-samples/tooling/formatter/formatted.tsp?raw";
import { Links } from "../../constants";
import { LearnMoreCard } from "../learn-more-card/learn-more-card";
import { LightDarkImg } from "../light-dark-img/light-dark-img";

const FormatterIllustration = () => {
  return (
    <div className={style["formatter-illustration"]}>
      <div className={style["formatter-illustration-unformatted"]}>
        <div className={style["badge"]}>Unformatted</div>
        <CodeBlock language="tsp" className={style["formatter-illustration-codeblock"]}>
          {notFormattedTsp}
        </CodeBlock>
      </div>
      <div className={style["formatter-illustration-formatted"]}>
        <div className={style["badge"]}>Formatted</div>
        <CodeBlock language="tsp" className={style["formatter-illustration-codeblock"]}>
          {formattedTsp}
        </CodeBlock>
      </div>
    </div>
  );
};
