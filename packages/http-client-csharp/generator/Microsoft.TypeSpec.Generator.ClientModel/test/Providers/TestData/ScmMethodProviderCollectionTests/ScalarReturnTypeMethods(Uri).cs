public virtual global::System.ClientModel.ClientResult<global::System.Uri> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    global::System.BinaryData data = result.GetRawResponse().Content;
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data);
    global::System.Text.Json.JsonElement element = document.RootElement;
    return global::System.ClientModel.ClientResult.FromValue(new global::System.Uri(element.GetString(), global::System.UriKind.RelativeOrAbsolute), result.GetRawResponse());
}
