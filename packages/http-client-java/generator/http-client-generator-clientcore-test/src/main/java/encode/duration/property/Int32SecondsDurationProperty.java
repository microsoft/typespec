package encode.duration.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.Duration;

/**
 * The Int32SecondsDurationProperty model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Int32SecondsDurationProperty implements JsonSerializable<Int32SecondsDurationProperty> {
    /*
     * The value property.
     */
    @Metadata(generated = true)
    private final long value;

    /**
     * Creates an instance of Int32SecondsDurationProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(generated = true)
    public Int32SecondsDurationProperty(Duration value) {
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
    @Metadata(generated = true)
    public Duration getValue() {
        return Duration.ofSeconds(this.value);
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeLongField("value", this.value);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Int32SecondsDurationProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Int32SecondsDurationProperty if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Int32SecondsDurationProperty.
     */
    @Metadata(generated = true)
    public static Int32SecondsDurationProperty fromJson(JsonReader jsonReader) throws IOException {
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
            return new Int32SecondsDurationProperty(value);
        });
    }
}
