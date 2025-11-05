package type.array;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * Array inner model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class InnerModel implements JsonSerializable<InnerModel> {

    /*
     * Required string property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String property;

    /*
     * The children property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private List<InnerModel> children;

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
     * Get the children property: The children property.
     *
     * @return the children value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<InnerModel> getChildren() {
        return this.children;
    }

    /**
     * Set the children property: The children property.
     *
     * @param children the children value to set.
     * @return the InnerModel object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public InnerModel setChildren(List<InnerModel> children) {
        this.children = children;
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
        jsonWriter.writeArrayField("children", this.children, (writer, element) -> writer.writeJson(element));
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
            List<InnerModel> children = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("property".equals(fieldName)) {
                    property = reader.getString();
                } else if ("children".equals(fieldName)) {
                    children = reader.readArray(reader1 -> InnerModel.fromJson(reader1));
                } else {
                    reader.skipChildren();
                }
            }
            InnerModel deserializedInnerModel = new InnerModel(property);
            deserializedInnerModel.children = children;
            return deserializedInnerModel;
        });
    }
}
