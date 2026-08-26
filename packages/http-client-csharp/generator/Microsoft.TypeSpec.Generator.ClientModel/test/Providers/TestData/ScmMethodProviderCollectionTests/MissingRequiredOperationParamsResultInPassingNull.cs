global::Sample.Argument.AssertNotNullOrEmpty(id, nameof(id));

return this.TestOp(id, filter: null, order: order, take: take, options: cancellationToken.ToRequestOptions());
