global::Sample.Argument.AssertNotNull(value, nameof(value));

return this.PutScalar(global::System.ClientModel.BinaryContent.Create(value), cancellationToken.ToRequestOptions());
