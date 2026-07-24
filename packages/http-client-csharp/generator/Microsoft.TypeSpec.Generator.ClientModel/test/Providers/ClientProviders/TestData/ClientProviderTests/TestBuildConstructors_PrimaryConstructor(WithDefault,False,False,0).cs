global::Sample.Argument.AssertNotNull(endpoint, nameof(endpoint));

options ??= new global::Sample.TestClientOptions();

_endpoint = endpoint;
_modelReaderWriterOptions = (options.ModelReaderWriterOptions == null) ? global::Sample.ModelSerializationExtensions.WireOptions : new global::System.ClientModel.Primitives.ModelReaderWriterOptions("W", options.ModelReaderWriterOptions);
if ((authenticationPolicy != null))
{
    Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), new global::System.ClientModel.Primitives.PipelinePolicy[] { new global::System.ClientModel.Primitives.UserAgentPolicy(typeof(global::Sample.TestClient).Assembly), authenticationPolicy }, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
}
else
{
    Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), new global::System.ClientModel.Primitives.PipelinePolicy[] { new global::System.ClientModel.Primitives.UserAgentPolicy(typeof(global::Sample.TestClient).Assembly) }, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
}
