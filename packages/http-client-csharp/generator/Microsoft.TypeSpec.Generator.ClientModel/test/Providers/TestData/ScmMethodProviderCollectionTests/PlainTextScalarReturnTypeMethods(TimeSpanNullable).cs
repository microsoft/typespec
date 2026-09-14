public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan?> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    string content = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    global::System.TimeSpan? value = (content.Trim() == "null") ? ((global::System.TimeSpan?)null) : global::Sample.TypeFormatters.ParseTimeSpan(content, "T");
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
