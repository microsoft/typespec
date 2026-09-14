public virtual global::System.ClientModel.ClientResult<bool?> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    string responseContent = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(responseContent);
    bool? value = (document.RootElement.ValueKind == global::System.Text.Json.JsonValueKind.Null) ? ((bool?)null) : document.RootElement.GetBoolean();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
