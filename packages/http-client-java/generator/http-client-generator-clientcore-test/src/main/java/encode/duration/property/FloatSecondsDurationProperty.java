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
 * The FloatSecondsDurationProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class FloatSecondsDurationProperty implements JsonSerializable<FloatSecondsDurationProperty> {
    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final double value;

    /**
     * Creates an instance of FloatSecondsDurationProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FloatSecondsDurationProperty(Duration value) {
        if (value == null) {
            this.value = 0.0;
        } else {
            this.value = (double) value.toNanos() / 1000_000_000L;
        }
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Duration getValue() {
        return Duration.ofNanos((long) (this.value * 1000_000_000L));
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeDoubleField("value", this.value);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of FloatSecondsDurationProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of FloatSecondsDurationProperty if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the FloatSecondsDurationProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static FloatSecondsDurationProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            Duration value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = Duration.ofNanos((long) (reader.getDouble() * 1000_000_000L));
                } else {
                    reader.skipChildren();
                }
            }
            return new FloatSecondsDurationProperty(value);
        });
    }
}
