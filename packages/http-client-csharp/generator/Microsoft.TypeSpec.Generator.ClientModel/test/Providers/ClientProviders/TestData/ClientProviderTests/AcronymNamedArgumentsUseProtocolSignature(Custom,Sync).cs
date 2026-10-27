global::Sample.Argument.AssertNotNullOrEmpty(customId, nameof(customId));

return this.Send(customId, customFilter: null, customIpWire: customIpValue, customOptions: customToken.ToRequestOptions());
