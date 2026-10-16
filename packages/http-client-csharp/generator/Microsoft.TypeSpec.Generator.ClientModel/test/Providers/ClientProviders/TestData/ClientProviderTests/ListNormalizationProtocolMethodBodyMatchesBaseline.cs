using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateGetWidgetsRequest(options);
return global::System.ClientModel.ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));


using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateGetWidgetsRequest(options);
return global::System.ClientModel.ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
