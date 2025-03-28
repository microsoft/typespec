package payload.jsonmergepatch;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import payload.jsonmergepatch.implementation.JsonMergePatchHelper;

/**
 * Details about a resource for patch operation.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class ResourcePatch implements JsonSerializable<ResourcePatch> {
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
     * Stores updated model property, the value is property name, not serialized name.
     */
    @Metadata(generated = true)
    private final Set<String> updatedProperties = new HashSet<>();

    @Metadata(generated = true)
    private boolean jsonMergePatch;

    @Metadata(generated = true)
    private void serializeAsJsonMergePatch(boolean jsonMergePatch) {
        this.jsonMergePatch = jsonMergePatch;
    }

    static {
        JsonMergePatchHelper.setResourcePatchAccessor(new JsonMergePatchHelper.ResourcePatchAccessor() {
            @Override
            public ResourcePatch prepareModelForJsonMergePatch(ResourcePatch model, boolean jsonMergePatchEnabled) {
                model.serializeAsJsonMergePatch(jsonMergePatchEnabled);
                return model;
            }

            @Override
            public boolean isJsonMergePatch(ResourcePatch model) {
                return model.jsonMergePatch;
            }
        });
    }

    /**
     * Creates an instance of ResourcePatch class.
     */
    @Metadata(generated = true)
    public ResourcePatch() {
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
     * @return the ResourcePatch object itself.
     */
    @Metadata(generated = true)
    public ResourcePatch setDescription(String description) {
        this.description = description;
        this.updatedProperties.add("description");
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
     * @return the ResourcePatch object itself.
     */
    @Metadata(generated = true)
    public ResourcePatch setMap(Map<String, InnerModel> map) {
        this.map = map;
        this.updatedProperties.add("map");
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
     * @return the ResourcePatch object itself.
     */
    @Metadata(generated = true)
    public ResourcePatch setArray(List<InnerModel> array) {
        this.array = array;
        this.updatedProperties.add("array");
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
     * @return the ResourcePatch object itself.
     */
    @Metadata(generated = true)
    public ResourcePatch setIntValue(Integer intValue) {
        this.intValue = intValue;
        this.updatedProperties.add("intValue");
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
     * @return the ResourcePatch object itself.
     */
    @Metadata(generated = true)
    public ResourcePatch setFloatValue(Double floatValue) {
        this.floatValue = floatValue;
        this.updatedProperties.add("floatValue");
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
     * @return the ResourcePatch object itself.
     */
    @Metadata(generated = true)
    public ResourcePatch setInnerModel(InnerModel innerModel) {
        this.innerModel = innerModel;
        this.updatedProperties.add("innerModel");
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
     * @return the ResourcePatch object itself.
     */
    @Metadata(generated = true)
    public ResourcePatch setIntArray(List<Integer> intArray) {
        this.intArray = intArray;
        this.updatedProperties.add("intArray");
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        if (jsonMergePatch) {
            return toJsonMergePatch(jsonWriter);
        } else {
            jsonWriter.writeStartObject();
            jsonWriter.writeStringField("description", this.description);
            jsonWriter.writeMapField("map", this.map, (writer, element) -> writer.writeJson(element));
            jsonWriter.writeArrayField("array", this.array, (writer, element) -> writer.writeJson(element));
            jsonWriter.writeNumberField("intValue", this.intValue);
            jsonWriter.writeNumberField("floatValue", this.floatValue);
            jsonWriter.writeJsonField("innerModel", this.innerModel);
            jsonWriter.writeArrayField("intArray", this.intArray, (writer, element) -> writer.writeInt(element));
            return jsonWriter.writeEndObject();
        }
    }

    @Metadata(generated = true)
    private JsonWriter toJsonMergePatch(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        if (updatedProperties.contains("description")) {
            if (this.description == null) {
                jsonWriter.writeNullField("description");
            } else {
                jsonWriter.writeStringField("description", this.description);
            }
        }
        if (updatedProperties.contains("map")) {
            if (this.map == null) {
                jsonWriter.writeNullField("map");
            } else {
                jsonWriter.writeMapField("map", this.map, (writer, element) -> {
                    if (element != null) {
                        JsonMergePatchHelper.getInnerModelAccessor().prepareModelForJsonMergePatch(element, true);
                        writer.writeJson(element);
                        JsonMergePatchHelper.getInnerModelAccessor().prepareModelForJsonMergePatch(element, false);
                    } else {
                        writer.writeNull();
                    }
                });
            }
        }
        if (updatedProperties.contains("array")) {
            if (this.array == null) {
                jsonWriter.writeNullField("array");
            } else {
                jsonWriter.writeArrayField("array", this.array, (writer, element) -> writer.writeJson(element));
            }
        }
        if (updatedProperties.contains("intValue")) {
            if (this.intValue == null) {
                jsonWriter.writeNullField("intValue");
            } else {
                jsonWriter.writeNumberField("intValue", this.intValue);
            }
        }
        if (updatedProperties.contains("floatValue")) {
            if (this.floatValue == null) {
                jsonWriter.writeNullField("floatValue");
            } else {
                jsonWriter.writeNumberField("floatValue", this.floatValue);
            }
        }
        if (updatedProperties.contains("innerModel")) {
            if (this.innerModel == null) {
                jsonWriter.writeNullField("innerModel");
            } else {
                JsonMergePatchHelper.getInnerModelAccessor().prepareModelForJsonMergePatch(this.innerModel, true);
                jsonWriter.writeJsonField("innerModel", this.innerModel);
                JsonMergePatchHelper.getInnerModelAccessor().prepareModelForJsonMergePatch(this.innerModel, false);
            }
        }
        if (updatedProperties.contains("intArray")) {
            if (this.intArray == null) {
                jsonWriter.writeNullField("intArray");
            } else {
                jsonWriter.writeArrayField("intArray", this.intArray, (writer, element) -> writer.writeInt(element));
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of ResourcePatch from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ResourcePatch if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the ResourcePatch.
     */
    @Metadata(generated = true)
    public static ResourcePatch fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            ResourcePatch deserializedResourcePatch = new ResourcePatch();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("description".equals(fieldName)) {
                    deserializedResourcePatch.description = reader.getString();
                } else if ("map".equals(fieldName)) {
                    Map<String, InnerModel> map = reader.readMap(reader1 -> InnerModel.fromJson(reader1));
                    deserializedResourcePatch.map = map;
                } else if ("array".equals(fieldName)) {
                    List<InnerModel> array = reader.readArray(reader1 -> InnerModel.fromJson(reader1));
                    deserializedResourcePatch.array = array;
                } else if ("intValue".equals(fieldName)) {
                    deserializedResourcePatch.intValue = reader.getNullable(JsonReader::getInt);
                } else if ("floatValue".equals(fieldName)) {
                    deserializedResourcePatch.floatValue = reader.getNullable(JsonReader::getDouble);
                } else if ("innerModel".equals(fieldName)) {
                    deserializedResourcePatch.innerModel = InnerModel.fromJson(reader);
                } else if ("intArray".equals(fieldName)) {
                    List<Integer> intArray = reader.readArray(reader1 -> reader1.getInt());
                    deserializedResourcePatch.intArray = intArray;
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedResourcePatch;
        });
    }
}
