import "./main.tsp";
import "@azure-tools/typespec-client-generator-core";

using Azure.ClientGenerator.Core;
using Client.Overload;

// This creates an overload in C# where both `list()` and `list(scope)` methods exist
#suppress "@azure-tools/typespec-client-generator-core/duplicate-client-name-warning" "Intentional overload for testing method overloading in C#"
@@clientName(listByScope, "list", "csharp");
