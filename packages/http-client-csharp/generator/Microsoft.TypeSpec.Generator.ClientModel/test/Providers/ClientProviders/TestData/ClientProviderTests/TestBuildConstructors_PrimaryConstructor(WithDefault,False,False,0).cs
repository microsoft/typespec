global::Sample.Argument.AssertNotNull(endpoint, nameof(endpoint));

options ??= new global::Sample.TestClientOptions();

_endpoint = endpoint;
Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
