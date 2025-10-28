global::Sample.Argument.AssertNotNullOrEmpty(value, nameof(value));

using global::System.ClientModel.BinaryContent content = global::System.ClientModel.BinaryContent.Create(global::System.BinaryData.FromString(value));
return this.PutScalar(content, cancellationToken.ToOptions());
