global::Sample.Utf8JsonBinaryContent content = new global::Sample.Utf8JsonBinaryContent();
content.JsonWriter.WriteObjectValue<object>(value, global::Sample.ModelSerializationExtensions.WireOptions);
return content;
