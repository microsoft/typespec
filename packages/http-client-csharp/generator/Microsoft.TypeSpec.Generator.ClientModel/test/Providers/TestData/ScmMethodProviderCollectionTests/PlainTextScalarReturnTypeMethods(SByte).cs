public virtual global::System.ClientModel.ClientResult<sbyte> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    string responseContent = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    sbyte value = sbyte.Parse(responseContent, global::System.Globalization.CultureInfo.InvariantCulture);
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
