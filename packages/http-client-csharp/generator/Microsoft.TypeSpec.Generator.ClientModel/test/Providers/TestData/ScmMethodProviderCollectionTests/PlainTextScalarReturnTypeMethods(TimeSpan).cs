public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    global::System.TimeSpan value = global::Sample.TypeFormatters.ParseTimeSpan(result.GetRawResponse().Content.ToString().TrimStart('﻿'), "c");
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
