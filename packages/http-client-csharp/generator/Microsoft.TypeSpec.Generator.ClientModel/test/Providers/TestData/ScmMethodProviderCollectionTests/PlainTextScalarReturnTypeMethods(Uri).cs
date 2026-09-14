public virtual global::System.ClientModel.ClientResult<global::System.Uri> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    string responseContent = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    global::System.Uri value = new global::System.Uri(responseContent, global::System.UriKind.RelativeOrAbsolute);
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
