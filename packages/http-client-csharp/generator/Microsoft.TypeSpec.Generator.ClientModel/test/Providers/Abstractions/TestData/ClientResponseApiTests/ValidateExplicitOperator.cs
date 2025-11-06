using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(stringResponse.Content, global::Sample.ModelSerializationExtensions.JsonDocumentOptions);
return global::Sample.Models.Bar.DeserializeBar(document.RootElement, global::Sample.ModelSerializationExtensions.WireOptions);
