package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a boolean literal property.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class BooleanLiteralProperty implements JsonSerializable<BooleanLiteralProperty> {

    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final boolean property = true;

    /**
     * Creates an instance of BooleanLiteralProperty class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BooleanLiteralProperty() {
    }

    /**
     * Get the property property: Property.
     *
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public boolean isProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeBooleanField("property", this.property);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of BooleanLiteralProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of BooleanLiteralProperty if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the BooleanLiteralProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static BooleanLiteralProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BooleanLiteralProperty deserializedBooleanLiteralProperty = new BooleanLiteralProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                reader.skipChildren();
            }
            return deserializedBooleanLiteralProperty;
        });
    }
}
