global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.CanBeCanceled ? new global::System.ClientModel.Primitives.RequestOptions { CancellationToken = cancellationToken } : null);
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(result.GetRawResponse().Content);
global::System.Text.Json.JsonElement element = document.RootElement;
return global::System.ClientModel.ClientResult.FromValue(new global::System.Uri(element.GetString()), result.GetRawResponse());
