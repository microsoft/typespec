public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan> GetPlainTextDuration(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextDuration(cancellationToken.ToRequestOptions());
    global::System.TimeSpan value = global::System.TimeSpan.FromMilliseconds(long.Parse(result.GetRawResponse().Content.ToString(), global::System.Globalization.CultureInfo.InvariantCulture));
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
