global::Sample.Argument.AssertNotNull(endpoint, nameof(endpoint));
global::Sample.Argument.AssertNotNull(keyCredential, nameof(keyCredential));

options ??= new global::Sample.TestClientOptions();

_endpoint = endpoint;
_keyCredential = keyCredential;
Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), new global::System.ClientModel.Primitives.PipelinePolicy[] { global::System.ClientModel.Primitives.ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy(_keyCredential, AuthorizationHeader) }, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
