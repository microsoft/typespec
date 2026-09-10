global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
global::System.BinaryData data = result.GetRawResponse().Content;
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data);
return global::System.ClientModel.ClientResult.FromValue(document.RootElement.GetString(), result.GetRawResponse());
