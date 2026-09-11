public virtual global::System.ClientModel.ClientResult<global::System.Uri> GetPlainTextScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextScalar(cancellationToken.ToRequestOptions());
    string content = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    global::System.Uri value = new global::System.Uri(content, global::System.UriKind.RelativeOrAbsolute);
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
