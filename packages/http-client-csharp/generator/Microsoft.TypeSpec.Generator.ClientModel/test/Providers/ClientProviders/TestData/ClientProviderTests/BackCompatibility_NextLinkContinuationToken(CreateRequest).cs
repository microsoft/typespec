internal global::System.ClientModel.Primitives.PipelineMessage CreateGetItemsRequest(int? maxPageSize, string token, global::System.ClientModel.Primitives.RequestOptions options)
{
    global::Sample.ClientUriBuilder uri = new global::Sample.ClientUriBuilder();
    uri.Reset(_endpoint);
    if ((maxPageSize != null))
    {
        uri.AppendQuery("maxPageSize", global::Sample.TypeFormatters.ConvertToString(maxPageSize), true);
    }
    if ((token != null))
    {
        uri.AppendQuery("token", token, true);
    }
    global::System.ClientModel.Primitives.PipelineMessage message = Pipeline.CreateMessage(uri.ToUri(), "GET", PipelineMessageClassifier200);
    global::System.ClientModel.Primitives.PipelineRequest request = message.Request;
    message.Apply(options);
    return message;
}
