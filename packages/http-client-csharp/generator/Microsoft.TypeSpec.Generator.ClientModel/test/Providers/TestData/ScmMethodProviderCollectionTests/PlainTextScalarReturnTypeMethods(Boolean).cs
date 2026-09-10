public virtual global::System.ClientModel.ClientResult<bool> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    bool value = bool.Parse(result.GetRawResponse().Content.ToString().TrimStart('﻿'));
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
