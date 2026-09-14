public virtual global::System.ClientModel.ClientResult<long> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    using global::System.IO.Stream stream = result.GetRawResponse().Content.ToStream();
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(stream);
    long value = document.RootElement.GetInt64();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
