global::Sample.Argument.AssertNotNull(options, nameof(options));

return this.GetWidget(options, cancellationToken.ToRequestOptions());
