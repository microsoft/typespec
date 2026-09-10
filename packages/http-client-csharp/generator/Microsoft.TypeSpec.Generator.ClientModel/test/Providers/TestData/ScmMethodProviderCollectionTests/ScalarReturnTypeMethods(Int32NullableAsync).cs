global::System.ClientModel.ClientResult result = await this.GetScalarAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
using global::System.IO.Stream stream = result.GetRawResponse().Content.ToStream();
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(stream);
return global::System.ClientModel.ClientResult.FromValue((document.RootElement.ValueKind == global::System.Text.Json.JsonValueKind.Null) ? ((int?)null) : document.RootElement.GetInt32(), result.GetRawResponse());
