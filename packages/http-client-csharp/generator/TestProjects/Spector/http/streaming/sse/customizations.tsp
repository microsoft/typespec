import "@azure-tools/typespec-client-generator-core";

// Avoid colliding with the Info model in the Unnamed operation group.
@@Azure.ClientGenerator.Core.clientName(Streaming.Sse.Protocol.Info, "ProtocolInfo", "csharp");
