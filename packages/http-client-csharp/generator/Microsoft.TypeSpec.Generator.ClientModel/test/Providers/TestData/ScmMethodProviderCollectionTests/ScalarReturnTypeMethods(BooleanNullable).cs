global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
using global::System.IO.Stream stream = result.GetRawResponse().Content.ToStream();
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(stream);
return global::System.ClientModel.ClientResult.FromValue((document.RootElement.ValueKind == global::System.Text.Json.JsonValueKind.Null) ? ((bool?)null) : document.RootElement.GetBoolean(), result.GetRawResponse());
