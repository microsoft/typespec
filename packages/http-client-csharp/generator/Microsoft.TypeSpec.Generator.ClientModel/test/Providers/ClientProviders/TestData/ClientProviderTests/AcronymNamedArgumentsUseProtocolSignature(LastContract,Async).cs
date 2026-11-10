global::Sample.Argument.AssertNotNullOrEmpty(id, nameof(id));

return await this.SendAsync(id, filter: null, sourceIpAddressWire: sourceIpAddressValue, legacyOptions: cancellationToken.ToRequestOptions()).ConfigureAwait(false);
