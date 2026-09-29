public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan> GetPlainTextDuration(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextDuration(cancellationToken.ToRequestOptions());
    global::System.TimeSpan value = global::Sample.TypeFormatters.ParseTimeSpan(result.GetRawResponse().Content.ToString(), "P");
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
