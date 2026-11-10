global::Sample.Argument.AssertNotNull(renamedOptions, nameof(renamedOptions));

using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateGetWidgetRequest(renamedOptions.Id, renamedOptions.Filter, renamedRequestOptions);
return global::System.ClientModel.ClientResult.FromResponse(Pipeline.ProcessMessage(message, renamedRequestOptions));
