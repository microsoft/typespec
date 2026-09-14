public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(result.GetRawResponse().Content);
    global::System.TimeSpan value = document.RootElement.GetTimeSpan("c");
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
