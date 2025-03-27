package encode.duration.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.Duration;
import java.util.Objects;

/**
 * The ISO8601DurationProperty model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class ISO8601DurationProperty implements JsonSerializable<ISO8601DurationProperty> {
    /*
     * The value property.
     */
    @Metadata(generated = true)
    private final Duration value;

    /**
     * Creates an instance of ISO8601DurationProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(generated = true)
    public ISO8601DurationProperty(Duration value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(generated = true)
    public Duration getValue() {
        return this.value;
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
     * Reads an instance of ISO8601DurationProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ISO8601DurationProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the ISO8601DurationProperty.
     */
    @Metadata(generated = true)
    public static ISO8601DurationProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            Duration value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.getNullable(nonNullReader -> Duration.parse(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }
            return new ISO8601DurationProperty(value);
        });
    }
}
