using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateFooRequest(options);
return string.GetFakeFromResponse(Pipeline.ProcessMessage(message, options));
