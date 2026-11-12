global::Sample.Argument.AssertNotNullOrEmpty(sourceIPAddress, nameof(sourceIPAddress));

return this.Send(sourceIPAddress, options: cancellationToken.ToRequestOptions());
