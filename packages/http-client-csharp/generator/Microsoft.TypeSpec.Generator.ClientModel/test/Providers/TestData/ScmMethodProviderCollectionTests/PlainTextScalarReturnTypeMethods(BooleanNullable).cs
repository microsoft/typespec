public virtual global::System.ClientModel.ClientResult<bool?> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    string content = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    bool? value = (content == "null") ? ((bool?)null) : bool.Parse(content);
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
