global::Sample.ClientUriBuilder uri = new global::Sample.ClientUriBuilder();
uri.Reset(_endpoint);
global::System.ClientModel.Primitives.PipelineMessage message = Pipeline.GetFakeCreateMessage(options, uri.ToUri(), "GET", PipelineMessageClassifier200);
global::System.ClientModel.Primitives.PipelineRequest request = message.Request;
message.Apply(options);
return message;
