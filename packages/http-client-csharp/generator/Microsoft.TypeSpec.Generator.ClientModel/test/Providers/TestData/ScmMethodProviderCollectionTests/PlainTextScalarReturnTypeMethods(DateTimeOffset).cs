public virtual global::System.ClientModel.ClientResult<global::System.DateTimeOffset> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    string content = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    global::System.DateTimeOffset value = global::Sample.TypeFormatters.ParseDateTimeOffset(content, "D");
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
