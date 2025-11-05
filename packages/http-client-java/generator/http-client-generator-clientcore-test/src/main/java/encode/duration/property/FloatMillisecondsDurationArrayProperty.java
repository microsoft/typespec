package encode.duration.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * The FloatMillisecondsDurationArrayProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class FloatMillisecondsDurationArrayProperty
    implements JsonSerializable<FloatMillisecondsDurationArrayProperty> {

    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<Double> value;

    /**
     * Creates an instance of FloatMillisecondsDurationArrayProperty class.
     *
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FloatMillisecondsDurationArrayProperty(List<Double> value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     *
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<Double> getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("value", this.value, (writer, element) -> writer.writeDouble(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of FloatMillisecondsDurationArrayProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of FloatMillisecondsDurationArrayProperty if the JsonReader was pointing to an instance of
     * it, or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the FloatMillisecondsDurationArrayProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static FloatMillisecondsDurationArrayProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<Double> value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("value".equals(fieldName)) {
                    value = reader.readArray(reader1 -> reader1.getDouble());
                } else {
                    reader.skipChildren();
                }
            }
            return new FloatMillisecondsDurationArrayProperty(value);
        });
    }
}
