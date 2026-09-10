package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with union of int literal property.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class UnionIntLiteralProperty implements JsonSerializable<UnionIntLiteralProperty> {

    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private UnionIntLiteralPropertyProperty property;

    /**
     * Creates an instance of UnionIntLiteralProperty class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionIntLiteralProperty() {
    }

    /**
     * Get the property property: Property.
     *
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionIntLiteralPropertyProperty getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     *
     * @param property the property value to set.
     * @return the UnionIntLiteralProperty object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionIntLiteralProperty setProperty(UnionIntLiteralPropertyProperty property) {
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
        jsonWriter.writeNumberField("property", this.property == null ? null : this.property.toInt());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of UnionIntLiteralProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of UnionIntLiteralProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IOException If an error occurs while reading the UnionIntLiteralProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static UnionIntLiteralProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            UnionIntLiteralProperty deserializedUnionIntLiteralProperty = new UnionIntLiteralProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("property".equals(fieldName)) {
                    deserializedUnionIntLiteralProperty.property
                        = UnionIntLiteralPropertyProperty.fromInt(reader.getInt());
                } else {
                    reader.skipChildren();
                }
            }
            return deserializedUnionIntLiteralProperty;
        });
    }
}
