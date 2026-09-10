global::Sample.Argument.AssertNotNullOrEmpty(param1, nameof(param1));

using global::System.ClientModel.BinaryContent content = global::System.ClientModel.BinaryContent.Create(global::System.BinaryData.FromString(param1));
global::System.ClientModel.ClientResult result = await this.UpdateResourceAsync(content, param2, param3, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.BinaryData data = result.GetRawResponse().Content;
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data);
return global::System.ClientModel.ClientResult.FromValue(document.RootElement.GetString(), result.GetRawResponse());
