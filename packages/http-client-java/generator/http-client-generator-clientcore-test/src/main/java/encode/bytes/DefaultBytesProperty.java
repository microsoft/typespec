package encode.bytes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The DefaultBytesProperty model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class DefaultBytesProperty implements JsonSerializable<DefaultBytesProperty> {
    /*
     * The value property.
     */
    @Metadata(generated = true)
    private final byte[] value;

    /**
     * Creates an instance of DefaultBytesProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(generated = true)
    public DefaultBytesProperty(byte[] value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(generated = true)
    public byte[] getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeBinaryField("value", this.value);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DefaultBytesProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DefaultBytesProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the DefaultBytesProperty.
     */
    @Metadata(generated = true)
    public static DefaultBytesProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            byte[] value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.getBinary();
                } else {
                    reader.skipChildren();
                }
            }
            return new DefaultBytesProperty(value);
        });
    }
}
