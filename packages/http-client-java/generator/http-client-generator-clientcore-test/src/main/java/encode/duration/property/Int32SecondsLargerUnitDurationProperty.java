package encode.duration.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.Duration;

/**
 * The Int32SecondsLargerUnitDurationProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Int32SecondsLargerUnitDurationProperty
    implements JsonSerializable<Int32SecondsLargerUnitDurationProperty> {
    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final long value;

    /**
     * Creates an instance of Int32SecondsLargerUnitDurationProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Int32SecondsLargerUnitDurationProperty(Duration value) {
        if (value == null) {
            this.value = 0L;
        } else {
            this.value = value.getSeconds();
        }
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Duration getValue() {
        return Duration.ofSeconds(this.value);
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeLongField("value", this.value);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Int32SecondsLargerUnitDurationProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Int32SecondsLargerUnitDurationProperty if the JsonReader was pointing to an instance of
     * it, or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Int32SecondsLargerUnitDurationProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Int32SecondsLargerUnitDurationProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            Duration value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = Duration.ofSeconds(reader.getLong());
                } else {
                    reader.skipChildren();
                }
            }
            return new Int32SecondsLargerUnitDurationProperty(value);
        });
    }
}
