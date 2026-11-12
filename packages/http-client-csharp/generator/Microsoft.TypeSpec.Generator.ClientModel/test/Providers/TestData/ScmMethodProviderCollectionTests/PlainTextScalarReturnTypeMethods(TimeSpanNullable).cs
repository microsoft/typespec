public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan?> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    global::System.TimeSpan? value = (result.GetRawResponse().Content.ToString().Trim() == "null") ? ((global::System.TimeSpan?)null) : global::Sample.TypeFormatters.ParseTimeSpan(result.GetRawResponse().Content.ToString(), "T");
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
