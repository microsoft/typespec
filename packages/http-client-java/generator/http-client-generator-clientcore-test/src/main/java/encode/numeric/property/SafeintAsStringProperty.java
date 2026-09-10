package encode.numeric.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.Objects;

/**
 * The SafeintAsStringProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class SafeintAsStringProperty implements JsonSerializable<SafeintAsStringProperty> {

    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final long value;

    /**
     * Creates an instance of SafeintAsStringProperty class.
     *
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SafeintAsStringProperty(long value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     *
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public long getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("value", Objects.toString(this.value, null));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SafeintAsStringProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of SafeintAsStringProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SafeintAsStringProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static SafeintAsStringProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            long value = Long.parseLong("0");
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("value".equals(fieldName)) {
                    value = reader.getNullable(nonNullReader -> Long.parseLong(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }
            return new SafeintAsStringProperty(value);
        });
    }
}
