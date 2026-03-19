global::Sample.Argument.AssertNotNullOrEmpty(id, nameof(id));

return this.TestOp(id, take, order: order, options: cancellationToken.ToRequestOptions());
