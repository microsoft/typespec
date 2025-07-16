import "./main.tsp";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/http";

using Http;
using global.Azure.ClientGenerator.Core;

@clientNamespace("azure.clientgenerator.core.methodoverride", "java")
namespace Customization;

@@clientNamespace(_Specs_.Azure.ClientGenerator.Core.Override,
  "azure.clientgenerator.core.methodoverride",
  "java"
);

op reorderCustomized(@path param1: string, @path param2: string): void;

@@override(_Specs_.Azure.ClientGenerator.Core.Override.ReorderParameters.reorder,
  reorderCustomized
);

model GroupParametersOptions {
  @query param1: string;
  @query param2: string;
}

op groupCustomized(options: GroupParametersOptions): void;

@@override(_Specs_.Azure.ClientGenerator.Core.Override.GroupParameters.group, groupCustomized);
