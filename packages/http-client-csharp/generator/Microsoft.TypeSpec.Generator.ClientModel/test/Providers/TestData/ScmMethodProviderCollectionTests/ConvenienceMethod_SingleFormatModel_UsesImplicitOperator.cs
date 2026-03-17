global::Sample.Argument.AssertNotNull(body, nameof(body));

return this.UpdateModel(body, cancellationToken.ToRequestOptions());
