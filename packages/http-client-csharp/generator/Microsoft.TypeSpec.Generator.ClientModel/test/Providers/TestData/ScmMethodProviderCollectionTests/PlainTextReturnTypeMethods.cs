public virtual global::System.ClientModel.ClientResult<string> GetText(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetText(cancellationToken.ToRequestOptions());
    return global::System.ClientModel.ClientResult.FromValue(result.GetRawResponse().Content.ToString(), result.GetRawResponse());
}
