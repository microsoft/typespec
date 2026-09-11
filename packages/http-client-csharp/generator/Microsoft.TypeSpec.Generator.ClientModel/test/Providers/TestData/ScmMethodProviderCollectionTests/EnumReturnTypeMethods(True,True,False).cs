public virtual global::System.ClientModel.ClientResult<global::Sample.Models.TestEnum> GetEnum(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetEnum(cancellationToken.ToRequestOptions());
    using global::System.IO.Stream stream = result.GetRawResponse().Content.ToStream();
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(stream);
    global::Sample.Models.TestEnum value = new global::Sample.Models.TestEnum(document.RootElement.GetString());
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
