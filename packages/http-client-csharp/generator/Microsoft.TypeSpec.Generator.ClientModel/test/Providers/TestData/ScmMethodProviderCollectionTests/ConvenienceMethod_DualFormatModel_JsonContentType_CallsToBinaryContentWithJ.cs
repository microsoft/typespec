global::Sample.Argument.AssertNotNull(body, nameof(body));

using global::System.ClientModel.BinaryContent content = body.ToBinaryContent("J");
return this.UpdateModel(content, cancellationToken.ToRequestOptions());
