global::Sample.Argument.AssertNotNull(endpoint, nameof(endpoint));

options ??= new global::Sample.TestClientOptions();

_endpoint = endpoint;
Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), new global::System.ClientModel.Primitives.PipelinePolicy[] { new global::System.ClientModel.Primitives.UserAgentPolicy(typeof(global::Sample.TestClient).Assembly, null) }, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
