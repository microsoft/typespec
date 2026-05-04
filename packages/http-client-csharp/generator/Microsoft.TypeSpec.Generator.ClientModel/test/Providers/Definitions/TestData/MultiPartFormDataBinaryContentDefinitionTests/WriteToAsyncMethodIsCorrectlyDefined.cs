#if NET6_0_OR_GREATER
await _multipartContent.CopyToAsync(stream, cancellationToken).ConfigureAwait(false);
#else
await _multipartContent.CopyToAsync(stream).ConfigureAwait(false);
#endif
