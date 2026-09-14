public virtual global::System.ClientModel.ClientResult<global::System.TimeSpan?> GetPlainTextDuration(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextDuration(cancellationToken.ToRequestOptions());
    string content = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    global::System.TimeSpan? value = (content.Trim() == "null") ? ((global::System.TimeSpan?)null) : global::System.TimeSpan.FromSeconds(int.Parse(content, global::System.Globalization.CultureInfo.InvariantCulture));
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
