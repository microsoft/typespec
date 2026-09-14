public virtual global::System.ClientModel.ClientResult<global::System.Uri> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(result.GetRawResponse().Content);
    global::System.Uri value = new global::System.Uri(document.RootElement.GetString(), global::System.UriKind.RelativeOrAbsolute);
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
