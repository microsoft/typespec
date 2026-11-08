global::Sample.Argument.AssertNotNullOrEmpty(sourceIPAddress, nameof(sourceIPAddress));
global::Sample.Argument.AssertNotNullOrEmpty(targetDBName, nameof(targetDBName));
global::Sample.Argument.AssertNotNullOrEmpty(guestOSType, nameof(guestOSType));
global::Sample.Argument.AssertNotNullOrEmpty(ipv4Address, nameof(ipv4Address));
global::Sample.Argument.AssertNotNullOrEmpty(ipv6Address, nameof(ipv6Address));

return await this.SendAsync(sourceIPAddress, targetDBName, guestOSType, ipv4Address, ipv6Address, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
