import "@azure-tools/typespec-client-generator-core";
import "./main.tsp";

using Azure.ClientGenerator.Core;

@@scope(_Specs_.Azure.Core.Page.withParameterizedNextLink, "!go");
