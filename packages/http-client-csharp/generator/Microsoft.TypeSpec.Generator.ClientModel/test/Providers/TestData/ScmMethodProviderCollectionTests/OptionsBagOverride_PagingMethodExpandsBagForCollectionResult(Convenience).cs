global::Sample.Argument.AssertNotNull(options, nameof(options));

return new global::Sample.TestClient.GetWidgetsCollectionResultOfT(this, options.Id, options.Filter, cancellationToken.ToRequestOptions());
