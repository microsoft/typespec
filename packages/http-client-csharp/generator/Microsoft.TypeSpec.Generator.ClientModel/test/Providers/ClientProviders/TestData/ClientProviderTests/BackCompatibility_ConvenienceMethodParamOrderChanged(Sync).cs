public virtual global::System.ClientModel.ClientResult<string> GetData(string param1, int param2, bool param3, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNullOrEmpty(param1, nameof(param1));

    using global::System.ClientModel.BinaryContent content = global::System.ClientModel.BinaryContent.Create(global::System.BinaryData.FromString(param1));
    global::System.ClientModel.ClientResult result = this.GetData(param3, param2, content, cancellationToken.ToRequestOptions());
    using global::System.IO.Stream stream = result.GetRawResponse().Content.ToStream();
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(stream);
    return global::System.ClientModel.ClientResult.FromValue(document.RootElement.GetString(), result.GetRawResponse());
}
