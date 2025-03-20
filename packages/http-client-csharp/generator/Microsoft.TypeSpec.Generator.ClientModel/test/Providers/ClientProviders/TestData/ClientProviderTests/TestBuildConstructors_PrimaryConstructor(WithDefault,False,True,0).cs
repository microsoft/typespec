global::Sample.Argument.AssertNotNull(endpoint, nameof(endpoint));
global::Sample.Argument.AssertNotNull(tokenCredential, nameof(tokenCredential));

options ??= new global::Sample.TestClientOptions();

_endpoint = endpoint;
_tokenCredential = tokenCredential;
Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), new global::System.ClientModel.Primitives.PipelinePolicy[] { this.GetFakeTokenAuthorizationPolicy(_tokenCredential, AuthorizationScopes) }, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
