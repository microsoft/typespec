import "./Pets.tsp";
import "@azure-tools/typespec-client-generator-core";

using Azure.ClientGenerator.Core;

// Tell the C# emitter NOT to generate the Animal base model in this package.
// Instead, reference it from the already-generated SampleAnimals NuGet package so
// that the generated Pet and Dog classes extend SampleAnimals.Animal across the
// package boundary (mirrors how azure-ai-extensions-openai references the OpenAI package).
@@alternateType(SampleAnimals.Animal,
  {
    identity: "SampleAnimals.Animal",
    package: "SampleAnimals",
    minVersion: "1.0.0",
  },
  "csharp"
);
