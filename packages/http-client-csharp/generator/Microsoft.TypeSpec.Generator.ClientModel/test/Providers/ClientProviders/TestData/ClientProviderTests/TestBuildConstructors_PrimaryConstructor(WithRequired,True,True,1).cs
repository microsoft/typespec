global::Sample.Argument.AssertNotNull(endpoint, nameof(endpoint));
global::Sample.Argument.AssertNotNull(tokenProvider, nameof(tokenProvider));

options ??= new global::Sample.TestClientOptions();

_endpoint = endpoint;
_tokenProvider = tokenProvider;
Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), new global::System.ClientModel.Primitives.PipelinePolicy[] { new global::System.ClientModel.Primitives.UserAgentPolicy(typeof(global::Sample.TestClient).Assembly, null), new global::System.ClientModel.Primitives.BearerTokenPolicy(_tokenProvider, _flows) }, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
