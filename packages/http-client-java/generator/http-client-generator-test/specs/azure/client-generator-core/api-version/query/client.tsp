import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";
import "./main.tsp";

using Http;
using Azure.ClientGenerator.Core;
using Client.AlternateApiVersion.Service.Query;
using Spector;

namespace Customizations;

@@apiVersion(QueryApiVersionParam.version);

@@clientNamespace(Client.AlternateApiVersion.Service.Query,
  "azure.clientgenerator.core.apiversion.query",
  "java"
);
