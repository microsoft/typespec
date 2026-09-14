public virtual global::System.ClientModel.ClientResult<global::Sample.Models.TestEnum> GetEnum(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetEnum(cancellationToken.ToRequestOptions());
    string responseContent = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(responseContent);
    global::Sample.Models.TestEnum value = document.RootElement.GetInt32().ToTestEnum();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
