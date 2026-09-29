global::Sample.Argument.AssertNotNullOrEmpty(customIpAddress, nameof(customIpAddress));
global::Sample.Argument.AssertNotNullOrEmpty(customDbName, nameof(customDbName));
global::Sample.Argument.AssertNotNullOrEmpty(customOsType, nameof(customOsType));
global::Sample.Argument.AssertNotNullOrEmpty(customIPv4Address, nameof(customIPv4Address));
global::Sample.Argument.AssertNotNullOrEmpty(customIPv6Address, nameof(customIPv6Address));

return await this.SendAsync(customIpAddress, customDbName, customOsType, customIPv4Address, customIPv6Address, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
