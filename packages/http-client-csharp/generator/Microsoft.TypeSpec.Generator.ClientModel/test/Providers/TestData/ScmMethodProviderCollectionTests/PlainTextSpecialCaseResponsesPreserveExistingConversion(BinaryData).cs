public virtual global::System.ClientModel.ClientResult<global::System.BinaryData> GetSpecialCase(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetSpecialCase(cancellationToken.ToRequestOptions());
    return global::System.ClientModel.ClientResult.FromValue(result.GetRawResponse().Content, result.GetRawResponse());
}
