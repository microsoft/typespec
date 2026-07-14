global::Sample.Argument.AssertNotNullOrEmpty(collectionId, nameof(collectionId));
global::Sample.Argument.AssertNotNull(options, nameof(options));

return this.GetPoint(collectionId, options.BandIndex, cancellationToken.ToRequestOptions());
