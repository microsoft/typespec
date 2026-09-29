global::Sample.Argument.AssertNotNullOrEmpty(id, nameof(id));

return this.Send(id, filter: null, sourceIpAddressWire: sourceIpAddressValue, legacyOptions: cancellationToken.ToRequestOptions());
