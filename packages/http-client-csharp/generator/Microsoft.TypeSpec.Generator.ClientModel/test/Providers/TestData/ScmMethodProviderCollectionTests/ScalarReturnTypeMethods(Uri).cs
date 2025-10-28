global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToOptions());
global::System.BinaryData data = result.GetRawResponse().Content;
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data);
global::System.Text.Json.JsonElement element = document.RootElement;
return global::System.ClientModel.ClientResult.FromValue(new global::System.Uri(element.GetString()), result.GetRawResponse());
