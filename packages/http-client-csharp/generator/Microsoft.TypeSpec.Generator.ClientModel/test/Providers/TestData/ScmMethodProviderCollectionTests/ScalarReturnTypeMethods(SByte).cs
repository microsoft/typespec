public virtual global::System.ClientModel.ClientResult<sbyte> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    string responseContent = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(responseContent);
    sbyte value = document.RootElement.GetSByte();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
