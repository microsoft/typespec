global::Sample.Argument.AssertNotNullOrEmpty(param1, nameof(param1));

using global::System.ClientModel.BinaryContent content = global::System.ClientModel.BinaryContent.Create(global::System.BinaryData.FromString(param1));
global::System.ClientModel.ClientResult result = this.UpdateResource(content, param2, param3, cancellationToken.ToRequestOptions());
using global::System.IO.Stream stream = result.GetRawResponse().Content.ToStream();
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(stream);
return global::System.ClientModel.ClientResult.FromValue(document.RootElement.GetString(), result.GetRawResponse());
