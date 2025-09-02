global::Sample.Argument.AssertNotNull(value, nameof(value));

return this.PutScalar(global::System.ClientModel.BinaryContent.Create(value), cancellationToken.CanBeCanceled ? new global::System.ClientModel.Primitives.RequestOptions { CancellationToken = cancellationToken } : null);
