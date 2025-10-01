using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromObject(value);
return this.PutScalar(content, cancellationToken.CanBeCanceled ? new global::System.ClientModel.Primitives.RequestOptions { CancellationToken = cancellationToken } : null);
