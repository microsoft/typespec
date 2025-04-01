package payload.jsonmergepatch;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Details about a resource.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class Resource implements JsonSerializable<Resource> {
    /*
     * The name property.
     */
    @Metadata(generated = true)
    private final String name;

    /*
     * The description property.
     */
    @Metadata(generated = true)
    private String description;

    /*
     * The map property.
     */
    @Metadata(generated = true)
    private Map<String, InnerModel> map;

    /*
     * The array property.
     */
    @Metadata(generated = true)
    private List<InnerModel> array;

    /*
     * The intValue property.
     */
    @Metadata(generated = true)
    private Integer intValue;

    /*
     * The floatValue property.
     */
    @Metadata(generated = true)
    private Double floatValue;

    /*
     * The innerModel property.
     */
    @Metadata(generated = true)
    private InnerModel innerModel;

    /*
     * The intArray property.
     */
    @Metadata(generated = true)
    private List<Integer> intArray;

    /**
     * Creates an instance of Resource class.
     * 
     * @param name the name value to set.
     */
    @Metadata(generated = true)
    public Resource(String name) {
        this.name = name;
    }

    /**
     * Get the name property: The name property.
     * 
     * @return the name value.
     */
    @Metadata(generated = true)
    public String getName() {
        return this.name;
    }

    /**
     * Get the description property: The description property.
     * 
     * @return the description value.
     */
    @Metadata(generated = true)
    public String getDescription() {
        return this.description;
    }

    /**
     * Set the description property: The description property.
     * 
     * @param description the description value to set.
     * @return the Resource object itself.
     */
    @Metadata(generated = true)
    public Resource setDescription(String description) {
        this.description = description;
        return this;
    }

    /**
     * Get the map property: The map property.
     * 
     * @return the map value.
     */
    @Metadata(generated = true)
    public Map<String, InnerModel> getMap() {
        return this.map;
    }

    /**
     * Set the map property: The map property.
     * 
     * @param map the map value to set.
     * @return the Resource object itself.
     */
    @Metadata(generated = true)
    public Resource setMap(Map<String, InnerModel> map) {
        this.map = map;
        return this;
    }

    /**
     * Get the array property: The array property.
     * 
     * @return the array value.
     */
    @Metadata(generated = true)
    public List<InnerModel> getArray() {
        return this.array;
    }

    /**
     * Set the array property: The array property.
     * 
     * @param array the array value to set.
     * @return the Resource object itself.
     */
    @Metadata(generated = true)
    public Resource setArray(List<InnerModel> array) {
        this.array = array;
        return this;
    }

    /**
     * Get the intValue property: The intValue property.
     * 
     * @return the intValue value.
     */
    @Metadata(generated = true)
    public Integer getIntValue() {
        return this.intValue;
    }

    /**
     * Set the intValue property: The intValue property.
     * 
     * @param intValue the intValue value to set.
     * @return the Resource object itself.
     */
    @Metadata(generated = true)
    public Resource setIntValue(Integer intValue) {
        this.intValue = intValue;
        return this;
    }

    /**
     * Get the floatValue property: The floatValue property.
     * 
     * @return the floatValue value.
     */
    @Metadata(generated = true)
    public Double getFloatValue() {
        return this.floatValue;
    }

    /**
     * Set the floatValue property: The floatValue property.
     * 
     * @param floatValue the floatValue value to set.
     * @return the Resource object itself.
     */
    @Metadata(generated = true)
    public Resource setFloatValue(Double floatValue) {
        this.floatValue = floatValue;
        return this;
    }

    /**
     * Get the innerModel property: The innerModel property.
     * 
     * @return the innerModel value.
     */
    @Metadata(generated = true)
    public InnerModel getInnerModel() {
        return this.innerModel;
    }

    /**
     * Set the innerModel property: The innerModel property.
     * 
     * @param innerModel the innerModel value to set.
     * @return the Resource object itself.
     */
    @Metadata(generated = true)
    public Resource setInnerModel(InnerModel innerModel) {
        this.innerModel = innerModel;
        return this;
    }

    /**
     * Get the intArray property: The intArray property.
     * 
     * @return the intArray value.
     */
    @Metadata(generated = true)
    public List<Integer> getIntArray() {
        return this.intArray;
    }

    /**
     * Set the intArray property: The intArray property.
     * 
     * @param intArray the intArray value to set.
     * @return the Resource object itself.
     */
    @Metadata(generated = true)
    public Resource setIntArray(List<Integer> intArray) {
        this.intArray = intArray;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", this.name);
        jsonWriter.writeStringField("description", this.description);
        jsonWriter.writeMapField("map", this.map, (writer, element) -> writer.writeJson(element));
        jsonWriter.writeArrayField("array", this.array, (writer, element) -> writer.writeJson(element));
        jsonWriter.writeNumberField("intValue", this.intValue);
        jsonWriter.writeNumberField("floatValue", this.floatValue);
        jsonWriter.writeJsonField("innerModel", this.innerModel);
        jsonWriter.writeArrayField("intArray", this.intArray, (writer, element) -> writer.writeInt(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Resource from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Resource if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Resource.
     */
    @Metadata(generated = true)
    public static Resource fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            String description = null;
            Map<String, InnerModel> map = null;
            List<InnerModel> array = null;
            Integer intValue = null;
            Double floatValue = null;
            InnerModel innerModel = null;
            List<Integer> intArray = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("description".equals(fieldName)) {
                    description = reader.getString();
                } else if ("map".equals(fieldName)) {
                    map = reader.readMap(reader1 -> InnerModel.fromJson(reader1));
                } else if ("array".equals(fieldName)) {
                    array = reader.readArray(reader1 -> InnerModel.fromJson(reader1));
                } else if ("intValue".equals(fieldName)) {
                    intValue = reader.getNullable(JsonReader::getInt);
                } else if ("floatValue".equals(fieldName)) {
                    floatValue = reader.getNullable(JsonReader::getDouble);
                } else if ("innerModel".equals(fieldName)) {
                    innerModel = InnerModel.fromJson(reader);
                } else if ("intArray".equals(fieldName)) {
                    intArray = reader.readArray(reader1 -> reader1.getInt());
                } else {
                    reader.skipChildren();
                }
            }
            Resource deserializedResource = new Resource(name);
            deserializedResource.description = description;
            deserializedResource.map = map;
            deserializedResource.array = array;
            deserializedResource.intValue = intValue;
            deserializedResource.floatValue = floatValue;
            deserializedResource.innerModel = innerModel;
            deserializedResource.intArray = intArray;

            return deserializedResource;
        });
    }
}
