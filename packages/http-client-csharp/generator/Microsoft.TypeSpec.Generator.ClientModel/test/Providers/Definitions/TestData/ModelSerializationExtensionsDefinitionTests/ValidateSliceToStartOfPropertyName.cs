global::System.ReadOnlySpan<byte> local = jsonPath;
if ((local.Length < 3))
{
    return global::System.ReadOnlySpan<byte>.Empty;
}
if ((local[0] != ((byte)'$')))
{
    return global::System.ReadOnlySpan<byte>.Empty;
}
return (((local.Length >= 4) && (local[1] == ((byte)'['))) && ((local[2] == ((byte)'\'')) || (local[2] == ((byte)'"')))) ? local.Slice(3) : global::System.ReadOnlySpan<byte>.Empty;
