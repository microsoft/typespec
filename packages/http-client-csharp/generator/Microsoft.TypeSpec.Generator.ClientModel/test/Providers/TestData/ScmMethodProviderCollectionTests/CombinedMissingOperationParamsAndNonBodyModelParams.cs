global::Sample.Argument.AssertNotNullOrEmpty(id, nameof(id));
global::Sample.Argument.AssertNotNull(request, nameof(request));

using global::System.ClientModel.BinaryContent content = request.ToBinaryContent(_modelReaderWriterOptions);
return this.TestOp(id, request.XCustomHeader, content, request.QueryParam, options: cancellationToken.ToRequestOptions());
