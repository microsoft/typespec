package encode.duration.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The Int32MillisecondsDurationProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Int32MillisecondsDurationProperty implements JsonSerializable<Int32MillisecondsDurationProperty> {

    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final int value;

    /**
     * Creates an instance of Int32MillisecondsDurationProperty class.
     *
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Int32MillisecondsDurationProperty(int value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     *
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public int getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("value", this.value);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Int32MillisecondsDurationProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of Int32MillisecondsDurationProperty if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Int32MillisecondsDurationProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Int32MillisecondsDurationProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int value = 0;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("value".equals(fieldName)) {
                    value = reader.getInt();
                } else {
                    reader.skipChildren();
                }
            }
            return new Int32MillisecondsDurationProperty(value);
        });
    }
}
