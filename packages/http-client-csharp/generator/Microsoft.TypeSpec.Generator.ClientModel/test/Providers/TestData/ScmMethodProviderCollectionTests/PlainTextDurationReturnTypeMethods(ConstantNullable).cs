public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan?> GetPlainTextDuration(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextDuration(cancellationToken.ToRequestOptions());
    string content = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    global::System.TimeSpan? value = (content.Trim() == "null") ? ((global::System.TimeSpan?)null) : global::Sample.TypeFormatters.ParseTimeSpan(content, "c");
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
