using string message = this.CreateFooRequest(options);
return global::System.ClientModel.ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
