global::System.ClientModel.ClientResult result = await this.GetScalarAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.BinaryData data = result.GetRawResponse().Content;
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data);
return global::System.ClientModel.ClientResult.FromValue((document.RootElement.ValueKind == global::System.Text.Json.JsonValueKind.Null) ? ((int?)null) : document.RootElement.GetInt32(), result.GetRawResponse());
