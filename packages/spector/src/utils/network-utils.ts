/**
 * Determine whether a remote address refers to the local loopback interface.
 *
 * Used to restrict administrative endpoints (e.g. the server stop signal) to
 * requests originating from the same host, even when the server is bound to a
 * broader interface such as `0.0.0.0`.
 */
export function isLoopbackAddress(address: string | undefined): boolean {
  if (!address) {
    // A missing remote address should be treated as untrusted.
    return false;
  }

  // Strip an IPv4-mapped IPv6 prefix (e.g. `::ffff:127.0.0.1`).
  const normalized = address.startsWith("::ffff:") ? address.slice("::ffff:".length) : address;

  if (normalized === "::1") {
    return true;
  }

  // Any address in the 127.0.0.0/8 block is loopback.
  return /^127\./.test(normalized);
}
