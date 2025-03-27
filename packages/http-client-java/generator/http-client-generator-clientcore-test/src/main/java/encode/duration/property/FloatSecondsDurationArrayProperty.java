package encode.duration.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.Duration;
import java.util.List;

/**
 * The FloatSecondsDurationArrayProperty model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class FloatSecondsDurationArrayProperty implements JsonSerializable<FloatSecondsDurationArrayProperty> {
    /*
     * The value property.
     */
    @Metadata(generated = true)
    private final List<Double> value;

    /**
     * Creates an instance of FloatSecondsDurationArrayProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(generated = true)
    public FloatSecondsDurationArrayProperty(List<Duration> value) {
        if (value == null) {
            this.value = null;
        } else {
            this.value = value.stream()
                .map(el -> (double) el.toNanos() / 1000_000_000L)
                .collect(java.util.stream.Collectors.toList());
        }
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(generated = true)
    public List<Duration> getValue() {
        if (this.value == null) {
            return null;
        }
        return this.value.stream()
            .map(el -> Duration.ofNanos((long) (el * 1000_000_000L)))
            .collect(java.util.stream.Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("value", this.value, (writer, element) -> writer.writeDouble(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of FloatSecondsDurationArrayProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of FloatSecondsDurationArrayProperty if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the FloatSecondsDurationArrayProperty.
     */
    @Metadata(generated = true)
    public static FloatSecondsDurationArrayProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<Duration> value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.readArray(reader1 -> Duration.ofNanos((long) (reader1.getDouble() * 1000_000_000L)));
                } else {
                    reader.skipChildren();
                }
            }
            return new FloatSecondsDurationArrayProperty(value);
        });
    }
}
