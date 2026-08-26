package parameters.bodyroot;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The BodyRootModel model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class BodyRootModel implements JsonSerializable<BodyRootModel> {
    /*
     * The category property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String category;

    /*
     * The linkType property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String linkType;

    /*
     * The wasSuccessful property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Boolean wasSuccessful;

    /**
     * Creates an instance of BodyRootModel class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BodyRootModel() {
    }

    /**
     * Get the category property: The category property.
     * 
     * @return the category value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getCategory() {
        return this.category;
    }

    /**
     * Set the category property: The category property.
     * 
     * @param category the category value to set.
     * @return the BodyRootModel object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BodyRootModel setCategory(String category) {
        this.category = category;
        return this;
    }

    /**
     * Get the linkType property: The linkType property.
     * 
     * @return the linkType value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getLinkType() {
        return this.linkType;
    }

    /**
     * Set the linkType property: The linkType property.
     * 
     * @param linkType the linkType value to set.
     * @return the BodyRootModel object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BodyRootModel setLinkType(String linkType) {
        this.linkType = linkType;
        return this;
    }

    /**
     * Get the wasSuccessful property: The wasSuccessful property.
     * 
     * @return the wasSuccessful value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Boolean isWasSuccessful() {
        return this.wasSuccessful;
    }

    /**
     * Set the wasSuccessful property: The wasSuccessful property.
     * 
     * @param wasSuccessful the wasSuccessful value to set.
     * @return the BodyRootModel object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BodyRootModel setWasSuccessful(Boolean wasSuccessful) {
        this.wasSuccessful = wasSuccessful;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("category", this.category);
        jsonWriter.writeStringField("linkType", this.linkType);
        jsonWriter.writeBooleanField("wasSuccessful", this.wasSuccessful);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of BodyRootModel from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of BodyRootModel if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the BodyRootModel.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static BodyRootModel fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BodyRootModel deserializedBodyRootModel = new BodyRootModel();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("category".equals(fieldName)) {
                    deserializedBodyRootModel.category = reader.getString();
                } else if ("linkType".equals(fieldName)) {
                    deserializedBodyRootModel.linkType = reader.getString();
                } else if ("wasSuccessful".equals(fieldName)) {
                    deserializedBodyRootModel.wasSuccessful = reader.getNullable(JsonReader::getBoolean);
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedBodyRootModel;
        });
    }
}
