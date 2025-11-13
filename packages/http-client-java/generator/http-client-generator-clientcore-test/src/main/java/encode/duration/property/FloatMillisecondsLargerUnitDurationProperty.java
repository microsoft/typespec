package encode.duration.property;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The FloatMillisecondsLargerUnitDurationProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class FloatMillisecondsLargerUnitDurationProperty
    implements JsonSerializable<FloatMillisecondsLargerUnitDurationProperty> {
    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final double value;

    /**
     * Creates an instance of FloatMillisecondsLargerUnitDurationProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FloatMillisecondsLargerUnitDurationProperty(double value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public double getValue() {
        return this.value;
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
     * Reads an instance of FloatMillisecondsLargerUnitDurationProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of FloatMillisecondsLargerUnitDurationProperty if the JsonReader was pointing to an instance
     * of it, or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the FloatMillisecondsLargerUnitDurationProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static FloatMillisecondsLargerUnitDurationProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            double value = 0.0;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.getDouble();
                } else {
                    reader.skipChildren();
                }
            }
            return new FloatMillisecondsLargerUnitDurationProperty(value);
        });
    }
}
