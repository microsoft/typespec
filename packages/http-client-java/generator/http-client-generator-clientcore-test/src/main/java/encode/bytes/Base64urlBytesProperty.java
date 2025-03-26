package encode.bytes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import io.clientcore.core.utils.Base64Uri;
import java.io.IOException;
import java.util.Objects;

/**
 * The Base64urlBytesProperty model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Base64urlBytesProperty implements JsonSerializable<Base64urlBytesProperty> {
    /*
     * The value property.
     */
    @Metadata(generated = true)
    private final Base64Uri value;

    /**
     * Creates an instance of Base64urlBytesProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(generated = true)
    public Base64urlBytesProperty(byte[] value) {
        if (value == null) {
            this.value = null;
        } else {
            this.value = Base64Uri.encode(value);
        }
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(generated = true)
    public byte[] getValue() {
        if (this.value == null) {
            return null;
        }
        return this.value.decodedBytes();
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("value", Objects.toString(this.value, null));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Base64urlBytesProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Base64urlBytesProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Base64urlBytesProperty.
     */
    @Metadata(generated = true)
    public static Base64urlBytesProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            byte[] value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    Base64Uri valueHolder
                        = reader.getNullable(nonNullReader -> new Base64Uri(nonNullReader.getString()));
                    if (valueHolder != null) {
                        value = valueHolder.decodedBytes();
                    }
                } else {
                    reader.skipChildren();
                }
            }
            return new Base64urlBytesProperty(value);
        });
    }
}
