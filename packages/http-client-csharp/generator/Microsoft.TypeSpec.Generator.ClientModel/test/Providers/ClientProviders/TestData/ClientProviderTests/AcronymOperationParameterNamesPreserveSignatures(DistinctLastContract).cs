global::Sample.Argument.AssertNotNullOrEmpty(sourceIpAddressAsyncConvenience, nameof(sourceIpAddressAsyncConvenience));
global::Sample.Argument.AssertNotNullOrEmpty(targetDbNameAsyncConvenience, nameof(targetDbNameAsyncConvenience));
global::Sample.Argument.AssertNotNullOrEmpty(guestOsTypeAsyncConvenience, nameof(guestOsTypeAsyncConvenience));
global::Sample.Argument.AssertNotNullOrEmpty(iPv4AddressAsyncConvenience, nameof(iPv4AddressAsyncConvenience));
global::Sample.Argument.AssertNotNullOrEmpty(iPv6AddressAsyncConvenience, nameof(iPv6AddressAsyncConvenience));

return await this.SendAsync(sourceIpAddressAsyncConvenience, targetDbNameAsyncConvenience, guestOsTypeAsyncConvenience, iPv4AddressAsyncConvenience, iPv6AddressAsyncConvenience, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
