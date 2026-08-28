internal global::System.ClientModel.Primitives.PipelineMessage CreateGetThingRequest(global::System.DateTimeOffset startsOn, global::System.DateTimeOffset startsOn0, global::System.ClientModel.Primitives.RequestOptions options)
{
    global::Sample.ClientUriBuilder uri = new global::Sample.ClientUriBuilder();
    uri.Reset(_endpoint);
    uri.AppendQuery("start-time", global::Sample.TypeFormatters.ConvertToString(startsOn, global::Sample.SerializationFormat.DateTime_RFC7231), true);
    uri.AppendQuery("Start-Time", global::Sample.TypeFormatters.ConvertToString(startsOn0, global::Sample.SerializationFormat.DateTime_RFC7231), true);
    global::System.ClientModel.Primitives.PipelineMessage message = Pipeline.CreateMessage(uri.ToUri(), "GET", PipelineMessageClassifier204);
    global::System.ClientModel.Primitives.PipelineRequest request = message.Request;
    message.Apply(options);
    return message;
}
