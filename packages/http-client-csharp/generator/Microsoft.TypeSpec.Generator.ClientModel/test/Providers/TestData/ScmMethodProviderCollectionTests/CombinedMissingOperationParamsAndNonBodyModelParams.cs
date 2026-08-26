global::Sample.Argument.AssertNotNullOrEmpty(id, nameof(id));
global::Sample.Argument.AssertNotNull(request, nameof(request));

return this.TestOp(id, request.XCustomHeader, request, request.QueryParam, options: cancellationToken.ToRequestOptions());
