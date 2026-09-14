public virtual global::System.ClientModel.ClientResult<string> UpdateResource(string param1, int param2, bool param3, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNullOrEmpty(param1, nameof(param1));

    using global::System.ClientModel.BinaryContent content = global::System.ClientModel.BinaryContent.Create(global::System.BinaryData.FromString(param1));
    global::System.ClientModel.ClientResult result = this.UpdateResource(content, param2, param3, cancellationToken.ToRequestOptions());
    string content0 = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(content0);
    string value = document.RootElement.GetString();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
