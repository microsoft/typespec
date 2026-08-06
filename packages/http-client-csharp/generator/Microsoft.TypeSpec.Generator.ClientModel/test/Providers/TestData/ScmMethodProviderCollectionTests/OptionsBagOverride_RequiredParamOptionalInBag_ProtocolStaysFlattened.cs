global::Sample.Argument.AssertNotNullOrEmpty(id, nameof(id));

using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateGetWidgetRequest(id, options);
return global::System.ClientModel.ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
