public virtual global::System.ClientModel.ClientResult<byte> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(result.GetRawResponse().Content);
    byte value = document.RootElement.GetByte();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
