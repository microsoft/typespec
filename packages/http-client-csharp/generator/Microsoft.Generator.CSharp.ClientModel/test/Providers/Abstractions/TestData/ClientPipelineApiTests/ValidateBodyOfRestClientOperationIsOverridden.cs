global::System.ClientModel.Primitives.PipelineMessage message = Pipeline.GetFakeCreateMessage(options, PipelineMessageClassifier200);
message.ResponseClassifier = PipelineMessageClassifier200;
global::System.ClientModel.Primitives.PipelineRequest request = message.Request;
request.Method = "GET";
global::Sample.ClientUriBuilder uri = new global::Sample.ClientUriBuilder();
uri.Reset(_endpoint);
request.Uri = uri.ToUri();
message.Apply(options);
return message;
