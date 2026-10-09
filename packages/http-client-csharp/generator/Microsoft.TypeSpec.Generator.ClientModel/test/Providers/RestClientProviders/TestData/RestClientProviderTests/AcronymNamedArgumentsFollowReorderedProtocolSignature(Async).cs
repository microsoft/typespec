global::Sample.Argument.AssertNotNullOrEmpty(sourceIPAddress, nameof(sourceIPAddress));

return await this.SendAsync(sourceIPAddress, options: cancellationToken.ToRequestOptions()).ConfigureAwait(false);
