global::Sample.Argument.AssertNotNull(body, nameof(body));

using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromEnumerable(body, _modelReaderWriterOptions);
return this.Upload(content, cancellationToken.ToRequestOptions());
