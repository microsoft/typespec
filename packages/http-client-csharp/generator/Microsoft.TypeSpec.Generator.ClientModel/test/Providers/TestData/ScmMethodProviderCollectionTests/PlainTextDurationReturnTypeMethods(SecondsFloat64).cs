public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan> GetPlainTextDuration(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextDuration(cancellationToken.ToRequestOptions());
    string responseContent = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    global::System.TimeSpan value = global::System.TimeSpan.FromSeconds(double.Parse(responseContent, global::System.Globalization.CultureInfo.InvariantCulture));
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
