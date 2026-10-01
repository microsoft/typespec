public virtual global::System.ClientModel.ClientResult<bool?> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    bool? value = (result.GetRawResponse().Content.ToString().Trim() == "null") ? ((bool?)null) : bool.Parse(result.GetRawResponse().Content.ToString());
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
