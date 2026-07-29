using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromObject(value);
return this.PutScalar(content, cancellationToken.ToRequestOptions());
