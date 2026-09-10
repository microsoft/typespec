public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<string>> UpdateResourceAsync(string param1, int param2, bool param3, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNullOrEmpty(param1, nameof(param1));

    using global::System.ClientModel.BinaryContent content = global::System.ClientModel.BinaryContent.Create(global::System.BinaryData.FromString(param1));
    global::System.ClientModel.ClientResult result = await this.UpdateResourceAsync(content, param2, param3, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
    using global::System.IO.Stream stream = result.GetRawResponse().Content.ToStream();
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(stream);
    return global::System.ClientModel.ClientResult.FromValue(document.RootElement.GetString(), result.GetRawResponse());
}
