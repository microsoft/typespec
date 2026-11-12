global::Sample.Argument.AssertNotNull(options, nameof(options));
global::Sample.Argument.AssertNotNull(content, nameof(content));

using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateCreateWidgetRequest(content, options.Filter, options.Top, requestOptions);
return global::System.ClientModel.ClientResult.FromResponse(Pipeline.ProcessMessage(message, requestOptions));
