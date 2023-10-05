import TabItem from "@theme/TabItem";
import Tabs from "@theme/Tabs";
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
          title="Individual json schema files"
          description="Use the json schema emitter to produce many individual json schema that cross reference."
          illustration={<MultiFileIllustration />}
          items={[
            {
              title: "Configure the json schema emitter",
              description:
                "Change how the json schema is emitted: specify a bundleId to combine all schemas into a single file or use json instead of yaml.",
              image: "shield-settings",
              link: Links.libraryReferences.jsonSchema,
            },
          ]}
        />

        <Section
          layout="text-right"
          header="Ecosystem"
          title="Test API endpoints as you code"
          description="Build a complete JSON RPC interface for your service, call it from your web browser, and test out endpoints in a breeze."
          illustration={<JsonSchemaExtensionsIllustration />}
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

import multiFileTsp from "!!raw-loader!@site/static/tsp-samples/json-schema/multi-file/main.tsp";
import multiFileAddress from "!!raw-loader!@site/static/tsp-samples/json-schema/multi-file/out/Address.yaml";
import multiFileCar from "!!raw-loader!@site/static/tsp-samples/json-schema/multi-file/out/Car.yaml";
import multiFilePerson from "!!raw-loader!@site/static/tsp-samples/json-schema/multi-file/out/Person.yaml";
import { CodeBlock } from "../components/code-block/code-block";

const MultiFileIllustration = () => {
  return (
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
  );
};

import extensionsTsp from "!!raw-loader!@site/static/tsp-samples/json-schema/extensions/main.tsp";
import extensionsYaml from "!!raw-loader!@site/static/tsp-samples/json-schema/extensions/out/output.yaml";

const JsonSchemaExtensionsIllustration = () => {
  return (
    <Tabs>
      <TabItem value="main.tsp">
        <CodeBlock language="tsp">{extensionsTsp}</CodeBlock>
      </TabItem>
      <TabItem value="output.yaml">
        <CodeBlock language="yaml">{extensionsYaml}</CodeBlock>
      </TabItem>
    </Tabs>
  );
};
