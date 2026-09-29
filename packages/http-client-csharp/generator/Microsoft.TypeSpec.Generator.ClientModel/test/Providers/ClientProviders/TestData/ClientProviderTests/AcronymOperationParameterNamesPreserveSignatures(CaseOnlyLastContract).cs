global::Sample.Argument.AssertNotNullOrEmpty(SOURCEIPADDRESS, nameof(SOURCEIPADDRESS));
global::Sample.Argument.AssertNotNullOrEmpty(TARGETDBNAME, nameof(TARGETDBNAME));
global::Sample.Argument.AssertNotNullOrEmpty(GUESTOSTYPE, nameof(GUESTOSTYPE));
global::Sample.Argument.AssertNotNullOrEmpty(IPV4ADDRESS, nameof(IPV4ADDRESS));
global::Sample.Argument.AssertNotNullOrEmpty(IPV6ADDRESS, nameof(IPV6ADDRESS));

return await this.SendAsync(SOURCEIPADDRESS, TARGETDBNAME, GUESTOSTYPE, IPV4ADDRESS, IPV6ADDRESS, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
