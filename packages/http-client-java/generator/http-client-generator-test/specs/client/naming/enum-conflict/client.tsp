import "@azure-tools/typespec-client-generator-core";
import "./main.tsp";

using Azure.ClientGenerator.Core;
using Client.Naming.EnumConflict;

// Resolve enum naming conflict: Rename SecondNamespace.Status to SecondStatus
// Client should generate FirstNamespace.Status as `Status` and SecondNamespace.Status as `SecondStatus`.
@@clientName(SecondNamespace.Status, "SecondStatus");
