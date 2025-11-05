package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Inner model. Will be a property type for ModelWithModelProperties.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class InnerModel implements JsonSerializable<InnerModel> {

    /*
     * Required string property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String property;

    /**
     * Creates an instance of InnerModel class.
     *
     * @param property the property value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public InnerModel(String property) {
        this.property = property;
    }

    /**
     * Get the property property: Required string property.
     *
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getProperty() {
        return this.property;
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
     * Reads an instance of InnerModel from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of InnerModel if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the InnerModel.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static InnerModel fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String property = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("property".equals(fieldName)) {
                    property = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new InnerModel(property);
        });
    }
}
