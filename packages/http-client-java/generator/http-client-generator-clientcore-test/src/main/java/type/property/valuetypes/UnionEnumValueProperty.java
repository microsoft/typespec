package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Template type for testing models with specific properties. Pass in the type of the property you are looking for.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class UnionEnumValueProperty implements JsonSerializable<UnionEnumValueProperty> {

    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ExtendedEnum property = ExtendedEnum.ENUM_VALUE2;

    /**
     * Creates an instance of UnionEnumValueProperty class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionEnumValueProperty() {
    }

    /**
     * Get the property property: Property.
     *
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendedEnum getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("property", this.property == null ? null : this.property.getValue());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of UnionEnumValueProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of UnionEnumValueProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the UnionEnumValueProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static UnionEnumValueProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            UnionEnumValueProperty deserializedUnionEnumValueProperty = new UnionEnumValueProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                reader.skipChildren();
            }
            return deserializedUnionEnumValueProperty;
        });
    }
}
