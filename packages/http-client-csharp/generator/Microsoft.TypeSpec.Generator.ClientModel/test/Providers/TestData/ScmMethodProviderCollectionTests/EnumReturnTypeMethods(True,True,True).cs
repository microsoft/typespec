global::System.ClientModel.ClientResult result = this.GetEnum(cancellationToken.ToRequestOptions());
global::System.BinaryData data = result.GetRawResponse().Content;
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data);
return global::System.ClientModel.ClientResult.FromValue((document.RootElement.ValueKind == global::System.Text.Json.JsonValueKind.Null) ? ((global::Sample.Models.TestEnum?)null) : new global::Sample.Models.TestEnum(document.RootElement.GetString()), result.GetRawResponse());
