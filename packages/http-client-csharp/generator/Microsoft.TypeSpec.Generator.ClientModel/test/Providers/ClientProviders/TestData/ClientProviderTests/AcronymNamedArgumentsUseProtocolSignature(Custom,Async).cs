global::Sample.Argument.AssertNotNullOrEmpty(customId, nameof(customId));

return await this.SendAsync(customId, customFilter: null, customIpWire: customIpValue, customOptions: customToken.ToRequestOptions()).ConfigureAwait(false);
