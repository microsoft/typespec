public virtual global::System.ClientModel.ClientResult<decimal> GetScalar(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
    string content = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(content);
    decimal value = document.RootElement.GetDecimal();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
