package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * Model with collection models properties.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class CollectionsModelProperty implements JsonSerializable<CollectionsModelProperty> {

    /*
     * Property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private List<StringProperty> property;

    /**
     * Creates an instance of CollectionsModelProperty class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CollectionsModelProperty() {
    }

    /**
     * Get the property property: Property.
     *
     * @return the property value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<StringProperty> getProperty() {
        return this.property;
    }

    /**
     * Set the property property: Property.
     *
     * @param property the property value to set.
     * @return the CollectionsModelProperty object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CollectionsModelProperty setProperty(List<StringProperty> property) {
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
        jsonWriter.writeArrayField("property", this.property, (writer, element) -> writer.writeJson(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of CollectionsModelProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of CollectionsModelProperty if the JsonReader was pointing to an instance of it, or null if
     * it was pointing to JSON null.
     * @throws IOException If an error occurs while reading the CollectionsModelProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static CollectionsModelProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            CollectionsModelProperty deserializedCollectionsModelProperty = new CollectionsModelProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("property".equals(fieldName)) {
                    List<StringProperty> property = reader.readArray(reader1 -> StringProperty.fromJson(reader1));
                    deserializedCollectionsModelProperty.property = property;
                } else {
                    reader.skipChildren();
                }
            }
            return deserializedCollectionsModelProperty;
        });
    }
}
