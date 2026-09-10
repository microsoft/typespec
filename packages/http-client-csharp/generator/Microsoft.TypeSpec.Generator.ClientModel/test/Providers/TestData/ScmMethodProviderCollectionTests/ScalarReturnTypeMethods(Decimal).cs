public virtual global::System.ClientModel.ClientResult<decimal> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    using global::System.IO.Stream stream = result.GetRawResponse().Content.ToStream();
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(stream);
    decimal value = document.RootElement.GetDecimal();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
