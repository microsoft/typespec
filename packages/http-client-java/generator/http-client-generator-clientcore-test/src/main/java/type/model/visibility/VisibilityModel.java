package type.model.visibility;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * Output model with visibility properties.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class VisibilityModel implements JsonSerializable<VisibilityModel> {
    /*
     * Required string, illustrating a readonly property.
     */
    @Metadata(generated = true)
    private String readProp;

    /*
     * Required string[], illustrating a create property.
     */
    @Metadata(generated = true)
    private final List<String> createProp;

    /*
     * Required int32[], illustrating a update property.
     */
    @Metadata(generated = true)
    private final List<Integer> updateProp;

    /*
     * Required bool, illustrating a delete property.
     */
    @Metadata(generated = true)
    private final Boolean deleteProp;

    /**
     * Creates an instance of VisibilityModel class.
     * 
     * @param createProp the createProp value to set.
     * @param updateProp the updateProp value to set.
     * @param deleteProp the deleteProp value to set.
     */
    @Metadata(generated = true)
    public VisibilityModel(List<String> createProp, List<Integer> updateProp, Boolean deleteProp) {
        this.createProp = createProp;
        this.updateProp = updateProp;
        this.deleteProp = deleteProp;
    }

    /**
     * Get the readProp property: Required string, illustrating a readonly property.
     * 
     * @return the readProp value.
     */
    @Metadata(generated = true)
    public String getReadProp() {
        return this.readProp;
    }

    /**
     * Get the createProp property: Required string[], illustrating a create property.
     * 
     * @return the createProp value.
     */
    @Metadata(generated = true)
    public List<String> getCreateProp() {
        return this.createProp;
    }

    /**
     * Get the updateProp property: Required int32[], illustrating a update property.
     * 
     * @return the updateProp value.
     */
    @Metadata(generated = true)
    public List<Integer> getUpdateProp() {
        return this.updateProp;
    }

    /**
     * Get the deleteProp property: Required bool, illustrating a delete property.
     * 
     * @return the deleteProp value.
     */
    @Metadata(generated = true)
    public Boolean isDeleteProp() {
        return this.deleteProp;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("createProp", this.createProp, (writer, element) -> writer.writeString(element));
        jsonWriter.writeArrayField("updateProp", this.updateProp, (writer, element) -> writer.writeInt(element));
        jsonWriter.writeBooleanField("deleteProp", this.deleteProp);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of VisibilityModel from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of VisibilityModel if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the VisibilityModel.
     */
    @Metadata(generated = true)
    public static VisibilityModel fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String readProp = null;
            List<String> createProp = null;
            List<Integer> updateProp = null;
            Boolean deleteProp = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("readProp".equals(fieldName)) {
                    readProp = reader.getString();
                } else if ("createProp".equals(fieldName)) {
                    createProp = reader.readArray(reader1 -> reader1.getString());
                } else if ("updateProp".equals(fieldName)) {
                    updateProp = reader.readArray(reader1 -> reader1.getInt());
                } else if ("deleteProp".equals(fieldName)) {
                    deleteProp = reader.getNullable(JsonReader::getBoolean);
                } else {
                    reader.skipChildren();
                }
            }
            VisibilityModel deserializedVisibilityModel = new VisibilityModel(createProp, updateProp, deleteProp);
            deserializedVisibilityModel.readProp = readProp;

            return deserializedVisibilityModel;
        });
    }
}
