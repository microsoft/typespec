public virtual global::System.ClientModel.ClientResult<sbyte> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(result.GetRawResponse().Content);
    sbyte value = document.RootElement.GetSByte();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
