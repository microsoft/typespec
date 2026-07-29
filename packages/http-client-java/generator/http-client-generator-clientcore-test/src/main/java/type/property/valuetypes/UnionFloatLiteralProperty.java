package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a union of float literal as property.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class UnionFloatLiteralProperty implements JsonSerializable<UnionFloatLiteralProperty> {
    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final UnionFloatLiteralPropertyProperty property;

    /**
     * Creates an instance of UnionFloatLiteralProperty class.
     * 
     * @param property the property value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionFloatLiteralProperty(UnionFloatLiteralPropertyProperty property) {
        this.property = property;
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionFloatLiteralPropertyProperty getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeNumberField("property", this.property == null ? null : this.property.toDouble());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of UnionFloatLiteralProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of UnionFloatLiteralProperty if the JsonReader was pointing to an instance of it, or null if
     * it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the UnionFloatLiteralProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static UnionFloatLiteralProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            UnionFloatLiteralPropertyProperty property = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    property = UnionFloatLiteralPropertyProperty.fromDouble(reader.getDouble());
                } else {
                    reader.skipChildren();
                }
            }
            return new UnionFloatLiteralProperty(property);
        });
    }
}
