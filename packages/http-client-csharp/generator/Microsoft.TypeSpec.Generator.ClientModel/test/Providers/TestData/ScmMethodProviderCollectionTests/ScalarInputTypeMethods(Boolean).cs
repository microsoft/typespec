using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromObject(value, _modelReaderWriterOptions);
return this.PutScalar(content, cancellationToken.ToRequestOptions());
