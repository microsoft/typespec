package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a int property.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class IntProperty implements JsonSerializable<IntProperty> {
    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final int property;

    /**
     * Creates an instance of IntProperty class.
     * 
     * @param property the property value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IntProperty(int property) {
        this.property = property;
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public int getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("property", this.property);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of IntProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of IntProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the IntProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static IntProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int property = 0;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    property = reader.getInt();
                } else {
                    reader.skipChildren();
                }
            }
            return new IntProperty(property);
        });
    }
}
