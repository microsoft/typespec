public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan?> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    string content = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    global::System.TimeSpan? value = (content == "null") ? ((global::System.TimeSpan?)null) : global::Sample.TypeFormatters.ParseTimeSpan(content, "c");
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
