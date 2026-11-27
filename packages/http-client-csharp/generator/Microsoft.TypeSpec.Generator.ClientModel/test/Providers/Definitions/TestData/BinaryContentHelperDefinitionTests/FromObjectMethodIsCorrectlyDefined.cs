global::Sample.Utf8JsonBinaryContent content = new global::Sample.Utf8JsonBinaryContent();
content.JsonWriter.WriteObjectValue<object>(value, options);
return content;
