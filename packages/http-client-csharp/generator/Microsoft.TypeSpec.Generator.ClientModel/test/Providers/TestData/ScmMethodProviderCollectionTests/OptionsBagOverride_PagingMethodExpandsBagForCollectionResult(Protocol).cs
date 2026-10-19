global::Sample.Argument.AssertNotNull(options, nameof(options));

return new global::Sample.TestClient.GetWidgetsCollectionResult(this, options.Id, options.Filter, requestOptions);
