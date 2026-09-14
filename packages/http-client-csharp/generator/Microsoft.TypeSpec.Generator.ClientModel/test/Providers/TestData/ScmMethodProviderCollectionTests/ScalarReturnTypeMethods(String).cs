public virtual global::System.ClientModel.ClientResult<string> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(result.GetRawResponse().Content);
    string value = document.RootElement.GetString();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
