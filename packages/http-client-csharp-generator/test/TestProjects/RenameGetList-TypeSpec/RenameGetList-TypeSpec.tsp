import "@typespec/rest";
import "@typespec/http";
import "@typespec/versioning";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.ClientGenerator.Core;

// NOTE: These features are missing:
// - Security definition for apiKey
@versioned(Versions)
@service(
    {
        title: "Microsoft Cognitive Language Service - Analyze Text Authoring"
    }
)
@server(
  "{Endpoint}/language",
  "Language Service",
  {
    Endpoint: Endpoint,
  }
)
@route("/authoring/analyze-text/")
namespace RenameGetList;

enum Versions {
  @useDependency(Azure.Core.Versions.v1_0_Preview_1)
  "2022-05-15-preview"
}

// Common Parameters

// TODO: Use the common parameter for this
@doc("The endpoint to use.")
scalar Endpoint extends string;

// Models

model Project {
  @key
  @visibility("read")
  @segment("projects")
  projectName: string;

  @doc("The project kind.")
  projectKind: ProjectKind;

  @doc("The storage container name.")
  storageInputContainerName: string;

  @doc("The project settings.")
  settings?: ProjectSettings;

  @doc("Whether the project would be used for multiple languages or not.")
  multilingual?: boolean;

  @doc("The project description.")
  description?: string;

  @doc("The project language. This is BCP-47 representation of a language. For example, use \"en\" for English, \"en-gb\" for English (UK), \"es\" for Spanish etc.")
  language: string;

  @doc("Represents the project creation datetime.")
  @visibility("read")
  createdDateTime: utcDateTime;

  @doc("Represents the project last modification datetime.")
  @visibility("read")
  lastModifiedDateTime: utcDateTime;

  @doc("Represents the project last training datetime.")
  @visibility("read")
  lastTrainedDateTime: utcDateTime;

  @doc("Represents the project last deployment datetime.")
  @visibility("read")
  lastDeployedDateTime: utcDateTime;
}

@doc("Represents the project kind.")
enum ProjectKind {
  @doc("For building a classification model to classify text using your own data. Each file will have only one label. For example, file 1 is classified as A and file 2 is classified as B.")
  CustomSingleLabelClassification,

  @doc("For building a classification model to classify text using your own data. Each file can have one or many labels. For example, file 1 is classified as A, B, and C and file 2 is classified as B and C.")
  CustomMultiLabelClassification,

  @doc("For building an extraction model to identify your domain categories using your own data.")
  CustomEntityRecognition,
}

@doc("Represents the settings used to define the project behavior.")
model ProjectSettings is Record<string>;

@parentResource(Project)
model Deployment {
  @key("deploymentName")
  @visibility("read")
  @segment("deployments")
  name: string;
}

// // Operations

model ListQueryParams {
  @query top?: int32;
  @query skip?: int32;
  @query maxpagesize?: int32;
}

interface Projects {
  @doc("Gets the details of a project.")
  get is ResourceRead<Project>;

  @doc("Lists the existing projects.")
  list is ResourceList<
    Project,
    {
      parameters: ListQueryParams;
    }
  >;
}

interface Deployments {
  @doc("Gets the details of a deployment.")
  get is ResourceRead<Deployment>;

  @doc("Lists the existing deployments.")
  list is ResourceList<Deployment>;
}
