global::Sample.Argument.AssertNotNullOrEmpty(sourceIPAddress, nameof(sourceIPAddress));

return this.Send(sourceIPAddress: sourceIPAddress, options: cancellationToken.ToRequestOptions());
