global::Sample.Argument.AssertNotNull(options, nameof(options));

using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateGetWidgetRequest(options.Id, options.Filter, options.Top, requestOptions);
return global::System.ClientModel.ClientResult.FromResponse(Pipeline.ProcessMessage(message, requestOptions));
