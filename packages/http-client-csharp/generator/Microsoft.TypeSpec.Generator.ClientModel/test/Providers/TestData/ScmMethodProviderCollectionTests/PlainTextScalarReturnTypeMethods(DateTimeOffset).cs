public virtual global::System.ClientModel.ClientResult<global::System.DateTimeOffset> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    global::System.DateTimeOffset value = global::Sample.TypeFormatters.ParseDateTimeOffset(result.GetRawResponse().Content.ToString().TrimStart('﻿'), "D");
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
