global::Sample.Argument.AssertNotNullOrEmpty(sourceIpAddress, nameof(sourceIpAddress));
global::Sample.Argument.AssertNotNullOrEmpty(targetDbName, nameof(targetDbName));
global::Sample.Argument.AssertNotNullOrEmpty(guestOsType, nameof(guestOsType));
global::Sample.Argument.AssertNotNullOrEmpty(iPv4Address, nameof(iPv4Address));
global::Sample.Argument.AssertNotNullOrEmpty(iPv6Address, nameof(iPv6Address));

return await this.SendAsync(sourceIpAddress, targetDbName, guestOsType, iPv4Address, iPv6Address, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
