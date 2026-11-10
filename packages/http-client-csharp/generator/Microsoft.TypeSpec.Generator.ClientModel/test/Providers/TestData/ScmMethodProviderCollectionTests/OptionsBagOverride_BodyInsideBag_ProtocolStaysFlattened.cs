global::Sample.Argument.AssertNotNull(content, nameof(content));

using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateCreateWidgetRequest(content, filter, options);
return global::System.ClientModel.ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
