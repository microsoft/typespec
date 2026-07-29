package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with a plainTime property.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class PlainTimeProperty implements JsonSerializable<PlainTimeProperty> {
    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String property;

    /**
     * Creates an instance of PlainTimeProperty class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PlainTimeProperty() {
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     * 
     * @param property the property value to set.
     * @return the PlainTimeProperty object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PlainTimeProperty setProperty(String property) {
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
        jsonWriter.writeStringField("property", this.property);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PlainTimeProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PlainTimeProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the PlainTimeProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static PlainTimeProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            PlainTimeProperty deserializedPlainTimeProperty = new PlainTimeProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    deserializedPlainTimeProperty.property = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedPlainTimeProperty;
        });
    }
}
