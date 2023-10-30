import TabItem from "@theme/TabItem";
import Tabs from "@theme/Tabs";
import { FluentLayout } from "../components/fluent-layout";
import { Section } from "../components/section/section";
import { SectionedLayout } from "../components/sectioned-layout/sectioned-layout";
import { UseCaseOverview } from "../components/use-case-overview/use-case-overview";
import { Links } from "../constants";

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
      <SectionedLayout>
        <UseCaseOverview
          title="Ensure data consistency"
          subtitle="Benefit from the reusability and modularity of TypeSpec types to ensure data consistency across your APIs."
          link={Links.libraryReferences.jsonSchema.index}
          illustration={<DataValidationHeroIllustration />}
        />
        <Section
          header="Standard library"
          title="Use built-in decorators"
          description="TypeSpec standard library provides decorators for common validation patterns."
          illustration={<ValidationDecoratorsIllustration />}
        >
          <LearnMoreCard
            title="Standard library reference"
            description="Browse the standard library reference documentation for details."
            image="people-shield"
            link={Links.standardLibrary.decorators}
          />
        </Section>
        <Section
          layout="text-right"
          header="Output"
          title="Produce Json Schema"
          description="Benefit from the Json Schema ecosystem to validate your data while writing a much more concise and readable code."
          illustration={<MultiFileIllustration />}
        >
          <LearnMoreCard
            title="Configure the json schema emitter"
            description="Change how the json schema is emitted: specify a bundleId to combine all schemas into a single file or use json instead of yaml."
            image="shield-settings"
            link={Links.libraryReferences.jsonSchema.index}
          />
        </Section>

        <Section
          header="Customize"
          title="Json Schema Decorators"
          description="The json schema library provide decorators to customize the output with json schema specific concept."
          illustration={<JsonSchemaExtensionsIllustration />}
        >
          <LearnMoreCard
            title="Json Schema Decorators Reference"
            description="Read the reference documentation for available options."
            image="design"
            link={Links.libraryReferences.jsonSchema.decorators}
          />
        </Section>
      </SectionedLayout>
    </div>
  );
};

import commonLibSharedTsp from "!!raw-loader!@site/static/tsp-samples/data-validation/common-lib/common.tsp";
import commonLibMainTsp from "!!raw-loader!@site/static/tsp-samples/data-validation/common-lib/main.tsp";
export const DataValidationHeroIllustration = () => {
  return (
    <IllustrationCard>
      <Tabs>
        <TabItem value="main.tsp">
          <CodeBlock language="tsp">{commonLibMainTsp}</CodeBlock>
        </TabItem>
        <TabItem value="common.tsp">
          <CodeBlock language="tsp">{commonLibSharedTsp}</CodeBlock>
        </TabItem>
      </Tabs>
    </IllustrationCard>
  );
};

import multiFileTsp from "!!raw-loader!@site/static/tsp-samples/json-schema/multi-file/main.tsp";
import multiFileAddress from "!!raw-loader!@site/static/tsp-samples/json-schema/multi-file/out/Address.yaml";
import multiFileCar from "!!raw-loader!@site/static/tsp-samples/json-schema/multi-file/out/Car.yaml";
import multiFilePerson from "!!raw-loader!@site/static/tsp-samples/json-schema/multi-file/out/Person.yaml";
import { CodeBlock } from "../components/code-block/code-block";

const MultiFileIllustration = () => {
  return (
    <IllustrationCard>
      <Tabs>
        <TabItem value="main.tsp">
          <CodeBlock language="tsp">{multiFileTsp}</CodeBlock>
        </TabItem>
        <TabItem value="Address.yaml">
          <CodeBlock language="yaml">{multiFileAddress}</CodeBlock>
        </TabItem>
        <TabItem value="Car.yaml">
          <CodeBlock language="yaml">{multiFileCar}</CodeBlock>
        </TabItem>
        <TabItem value="Person.yaml">
          <CodeBlock language="yaml">{multiFilePerson}</CodeBlock>
        </TabItem>
      </Tabs>
    </IllustrationCard>
  );
};

import extensionsTsp from "!!raw-loader!@site/static/tsp-samples/json-schema/extensions/main.tsp";
import extensionsYaml from "!!raw-loader!@site/static/tsp-samples/json-schema/extensions/out/output.yaml";

const JsonSchemaExtensionsIllustration = () => {
  return (
    <IllustrationCard>
      <Tabs>
        <TabItem value="main.tsp">
          <CodeBlock language="tsp">{extensionsTsp}</CodeBlock>
        </TabItem>
        <TabItem value="output.yaml">
          <CodeBlock language="yaml">{extensionsYaml}</CodeBlock>
        </TabItem>
      </Tabs>
    </IllustrationCard>
  );
};

import validationDecoratorsTsp from "!!raw-loader!@site/static/tsp-samples/data-validation/validation-decorators.tsp";
import { IllustrationCard } from "../components/illustration-card/illustration-card";
import { LearnMoreCard } from "../components/learn-more-card/learn-more-card";

const ValidationDecoratorsIllustration = () => {
  return (
    <IllustrationCard>
      <CodeBlock language="tsp">{validationDecoratorsTsp}</CodeBlock>
    </IllustrationCard>
  );
};
