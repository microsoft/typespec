global::Sample.Argument.AssertNotNull(endpoint, nameof(endpoint));

options ??= new global::Sample.TestClientOptions();

_endpoint = endpoint;
if ((options.ModelProxies.Count == 0))
{
    _modelReaderWriterOptions = global::Sample.ModelSerializationExtensions.WireOptions;
}
else
{
    _modelReaderWriterOptions = new global::System.ClientModel.Primitives.ModelReaderWriterOptions("W");
    foreach (var proxy in options.ModelProxies)
    {
        _modelReaderWriterOptions.Proxies.Add(proxy);
    }
}
if ((authenticationPolicy != null))
{
    Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), new global::System.ClientModel.Primitives.PipelinePolicy[] { new global::System.ClientModel.Primitives.UserAgentPolicy(typeof(global::Sample.TestClient).Assembly), authenticationPolicy }, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
}
else
{
    Pipeline = global::System.ClientModel.Primitives.ClientPipeline.Create(options, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>(), new global::System.ClientModel.Primitives.PipelinePolicy[] { new global::System.ClientModel.Primitives.UserAgentPolicy(typeof(global::Sample.TestClient).Assembly) }, Array.Empty<global::System.ClientModel.Primitives.PipelinePolicy>());
}
