package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with union of float literal property.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class UnionFloatLiteralProperty implements JsonSerializable<UnionFloatLiteralProperty> {

    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private UnionFloatLiteralPropertyProperty property;

    /**
     * Creates an instance of UnionFloatLiteralProperty class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionFloatLiteralProperty() {
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
     * Set the property property: Property.
     *
     * @param property the property value to set.
     * @return the UnionFloatLiteralProperty object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionFloatLiteralProperty setProperty(UnionFloatLiteralPropertyProperty property) {
        this.property = property;
        return this;
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
     * @throws IOException If an error occurs while reading the UnionFloatLiteralProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static UnionFloatLiteralProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            UnionFloatLiteralProperty deserializedUnionFloatLiteralProperty = new UnionFloatLiteralProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("property".equals(fieldName)) {
                    deserializedUnionFloatLiteralProperty.property
                        = UnionFloatLiteralPropertyProperty.fromDouble(reader.getDouble());
                } else {
                    reader.skipChildren();
                }
            }
            return deserializedUnionFloatLiteralProperty;
        });
    }
}
