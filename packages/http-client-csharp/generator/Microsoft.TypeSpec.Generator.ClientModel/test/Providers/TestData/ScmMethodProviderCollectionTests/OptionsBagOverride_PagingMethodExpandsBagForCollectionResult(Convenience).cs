global::Sample.Argument.AssertNotNull(options, nameof(options));

return new global::Sample.TestClientGetWidgetsCollectionResultOfT(this, _modelReaderWriterOptions, options.Id, options.Filter, cancellationToken.ToRequestOptions());
