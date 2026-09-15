public virtual global::System.ClientModel.ClientResult<decimal> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(result.GetRawResponse().Content);
    decimal value = document.RootElement.GetDecimal();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
