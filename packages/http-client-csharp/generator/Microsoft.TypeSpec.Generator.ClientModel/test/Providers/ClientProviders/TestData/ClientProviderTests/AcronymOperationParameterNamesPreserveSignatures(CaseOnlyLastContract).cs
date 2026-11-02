global::Sample.Argument.AssertNotNullOrEmpty(SOURCEIPADDRESS, nameof(SOURCEIPADDRESS));
global::Sample.Argument.AssertNotNullOrEmpty(TARGETDbNAME, nameof(TARGETDbNAME));
global::Sample.Argument.AssertNotNullOrEmpty(GUESTOsTYPE, nameof(GUESTOsTYPE));
global::Sample.Argument.AssertNotNullOrEmpty(IPV4ADDRESS, nameof(IPV4ADDRESS));
global::Sample.Argument.AssertNotNullOrEmpty(IPV6ADDRESS, nameof(IPV6ADDRESS));

return await this.SendAsync(SOURCEIPADDRESS, TARGETDbNAME, GUESTOsTYPE, IPV4ADDRESS, IPV6ADDRESS, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
