public virtual global::System.ClientModel.ClientResult<int> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    int value = int.Parse(result.GetRawResponse().Content.ToString().TrimStart('﻿'), global::System.Globalization.CultureInfo.InvariantCulture);
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
