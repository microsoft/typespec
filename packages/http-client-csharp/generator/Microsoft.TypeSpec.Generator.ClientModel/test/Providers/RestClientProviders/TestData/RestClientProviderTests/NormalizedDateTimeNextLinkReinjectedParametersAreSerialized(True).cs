internal global::System.ClientModel.Primitives.PipelineMessage CreateNextGetCatsRequest(global::System.Uri nextPage, global::System.DateTimeOffset startsOn, string startsOn0, global::System.ClientModel.Primitives.RequestOptions options)
{
    global::Sample.ClientUriBuilder uri = new global::Sample.ClientUriBuilder();
    if (nextPage.IsAbsoluteUri)
    {
        uri.Reset(nextPage);
    }
    else
    {
        uri.Reset(new global::System.Uri(_endpoint, nextPage));
    }
    uri.AppendQuery("start-time", global::Sample.TypeFormatters.ConvertToString(startsOn, global::Sample.SerializationFormat.DateTime_RFC7231), true);
    uri.AppendQuery("starts-on", startsOn0, true);
    global::System.ClientModel.Primitives.PipelineMessage message = Pipeline.CreateMessage(uri.ToUri(), "GET", PipelineMessageClassifier200);
    global::System.ClientModel.Primitives.PipelineRequest request = message.Request;
    message.Apply(options);
    return message;
}
