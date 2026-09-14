public virtual global::System.ClientModel.ClientResult<int?> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    string responseContent = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    int? value = (responseContent.Trim() == "null") ? ((int?)null) : int.Parse(responseContent, global::System.Globalization.CultureInfo.InvariantCulture);
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
