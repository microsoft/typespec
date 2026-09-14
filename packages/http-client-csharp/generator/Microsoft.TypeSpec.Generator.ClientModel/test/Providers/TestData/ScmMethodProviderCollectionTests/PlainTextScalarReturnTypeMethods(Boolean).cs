public virtual global::System.ClientModel.ClientResult<bool> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    string responseContent = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    bool value = bool.Parse(responseContent);
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
