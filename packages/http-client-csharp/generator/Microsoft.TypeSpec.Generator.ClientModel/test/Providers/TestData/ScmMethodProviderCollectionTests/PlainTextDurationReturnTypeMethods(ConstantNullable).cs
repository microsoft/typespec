public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan?> GetPlainTextDuration(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextDuration(cancellationToken.ToRequestOptions());
    global::System.TimeSpan? value = (result.GetRawResponse().Content.ToString().Trim() == "null") ? ((global::System.TimeSpan?)null) : global::Sample.TypeFormatters.ParseTimeSpan(result.GetRawResponse().Content.ToString(), "c");
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
