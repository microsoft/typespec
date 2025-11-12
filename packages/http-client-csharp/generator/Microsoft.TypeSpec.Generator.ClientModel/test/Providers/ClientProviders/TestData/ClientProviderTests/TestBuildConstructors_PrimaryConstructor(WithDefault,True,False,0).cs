global::Sample.Argument.AssertNotNull(endpoint, nameof(endpoint));
global::Sample.Argument.AssertNotNull(credential, nameof(credential));

options ??= new global::Sample.TestClientOptions();

_endpoint = endpoint;
_keyCredential = credential;
Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), new global::System.ClientModel.Primitives.PipelinePolicy[] { new global::System.ClientModel.Primitives.UserAgentPolicy(typeof(global::Sample.TestClient).Assembly, null), global::System.ClientModel.Primitives.ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy(_keyCredential, AuthorizationHeader) }, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
