package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a float literal property.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class FloatLiteralProperty implements JsonSerializable<FloatLiteralProperty> {

    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final double property = 43.125;

    /**
     * Creates an instance of FloatLiteralProperty class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FloatLiteralProperty() {
    }

    /**
     * Get the property property: Property.
     *
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public double getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeDoubleField("property", this.property);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of FloatLiteralProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of FloatLiteralProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the FloatLiteralProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static FloatLiteralProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            FloatLiteralProperty deserializedFloatLiteralProperty = new FloatLiteralProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                reader.skipChildren();
            }
            return deserializedFloatLiteralProperty;
        });
    }
}
