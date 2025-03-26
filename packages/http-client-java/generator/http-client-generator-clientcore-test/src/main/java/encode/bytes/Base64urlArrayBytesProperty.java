package encode.bytes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import io.clientcore.core.utils.Base64Uri;
import java.io.IOException;
import java.util.List;
import java.util.Objects;

/**
 * The Base64urlArrayBytesProperty model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Base64urlArrayBytesProperty implements JsonSerializable<Base64urlArrayBytesProperty> {
    /*
     * The value property.
     */
    @Metadata(generated = true)
    private final List<Base64Uri> value;

    /**
     * Creates an instance of Base64urlArrayBytesProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(generated = true)
    public Base64urlArrayBytesProperty(List<byte[]> value) {
        if (value == null) {
            this.value = null;
        } else {
            this.value = value.stream().map(el -> Base64Uri.encode(el)).collect(java.util.stream.Collectors.toList());
        }
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(generated = true)
    public List<byte[]> getValue() {
        if (this.value == null) {
            return null;
        }
        return this.value.stream().map(el -> el.decodedBytes()).collect(java.util.stream.Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("value", this.value,
            (writer, element) -> writer.writeString(Objects.toString(element, null)));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Base64urlArrayBytesProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Base64urlArrayBytesProperty if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Base64urlArrayBytesProperty.
     */
    @Metadata(generated = true)
    public static Base64urlArrayBytesProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<byte[]> value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.readArray(reader1 -> {
                        Base64Uri reader1ValueHolder
                            = reader1.getNullable(nonNullReader -> new Base64Uri(nonNullReader.getString()));
                        if (reader1ValueHolder != null) {
                            return reader1ValueHolder.decodedBytes();
                        } else {
                            return null;
                        }
                    });
                } else {
                    reader.skipChildren();
                }
            }
            return new Base64urlArrayBytesProperty(value);
        });
    }
}
