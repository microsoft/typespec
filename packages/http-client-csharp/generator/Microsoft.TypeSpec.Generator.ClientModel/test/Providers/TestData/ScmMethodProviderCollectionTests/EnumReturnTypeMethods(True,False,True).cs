public virtual global::System.ClientModel.ClientResult<global::Sample.Models.TestEnum?> GetEnum(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetEnum(cancellationToken.ToRequestOptions());
    using global::System.IO.Stream stream = result.GetRawResponse().Content.ToStream();
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(stream);
    global::Sample.Models.TestEnum? value = (document.RootElement.ValueKind == global::System.Text.Json.JsonValueKind.Null) ? ((global::Sample.Models.TestEnum?)null) : document.RootElement.GetString().ToTestEnum();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
