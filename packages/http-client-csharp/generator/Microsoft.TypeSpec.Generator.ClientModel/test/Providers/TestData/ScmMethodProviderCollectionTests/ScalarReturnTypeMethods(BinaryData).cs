public virtual global::System.ClientModel.ClientResult<global::System.BinaryData> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    return global::System.ClientModel.ClientResult.FromValue(result.GetRawResponse().Content, result.GetRawResponse());
}
