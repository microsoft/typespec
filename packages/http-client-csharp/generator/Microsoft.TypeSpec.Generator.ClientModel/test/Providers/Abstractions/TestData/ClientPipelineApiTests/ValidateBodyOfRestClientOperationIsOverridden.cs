global::Sample.ClientUriBuilder uri = new global::Sample.ClientUriBuilder();
uri.Reset(_endpoint);
if ((fooQuery != null))
{
    uri.AppendQuery("foo-query", fooQuery, true);
}
global::System.ClientModel.Primitives.PipelineMessage message = Pipeline.GetFakeCreateMessage(options, uri, "GET", PipelineMessageClassifier200);
global::System.ClientModel.Primitives.PipelineRequest request = message.Request;
if ((fooHeader != null))
{
    request.Headers.Set("foo-header", fooHeader);
}
message.Apply(options);
return message;
