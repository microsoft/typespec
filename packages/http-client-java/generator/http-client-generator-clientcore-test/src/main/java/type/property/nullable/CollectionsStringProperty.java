package type.property.nullable;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import type.property.nullable.implementation.JsonMergePatchHelper;

/**
 * Model with collection string properties.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class CollectionsStringProperty implements JsonSerializable<CollectionsStringProperty> {
    /*
     * Required property
     */
    @Metadata(generated = true)
    private String requiredProperty;

    /*
     * Property
     */
    @Metadata(generated = true)
    private List<String> nullableProperty;

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
        JsonMergePatchHelper
            .setCollectionsStringPropertyAccessor(new JsonMergePatchHelper.CollectionsStringPropertyAccessor() {
                @Override
                public CollectionsStringProperty prepareModelForJsonMergePatch(CollectionsStringProperty model,
                    boolean jsonMergePatchEnabled) {
                    model.serializeAsJsonMergePatch(jsonMergePatchEnabled);
                    return model;
                }

                @Override
                public boolean isJsonMergePatch(CollectionsStringProperty model) {
                    return model.jsonMergePatch;
                }
            });
    }

    /**
     * Creates an instance of CollectionsStringProperty class.
     */
    @Metadata(generated = true)
    public CollectionsStringProperty() {
    }

    /**
     * Get the requiredProperty property: Required property.
     * 
     * @return the requiredProperty value.
     */
    @Metadata(generated = true)
    public String getRequiredProperty() {
        return this.requiredProperty;
    }

    /**
     * Set the requiredProperty property: Required property.
     * <p>Required when create the resource.</p>
     * 
     * @param requiredProperty the requiredProperty value to set.
     * @return the CollectionsStringProperty object itself.
     */
    @Metadata(generated = true)
    public CollectionsStringProperty setRequiredProperty(String requiredProperty) {
        this.requiredProperty = requiredProperty;
        this.updatedProperties.add("requiredProperty");
        return this;
    }

    /**
     * Get the nullableProperty property: Property.
     * 
     * @return the nullableProperty value.
     */
    @Metadata(generated = true)
    public List<String> getNullableProperty() {
        return this.nullableProperty;
    }

    /**
     * Set the nullableProperty property: Property.
     * <p>Required when create the resource.</p>
     * 
     * @param nullableProperty the nullableProperty value to set.
     * @return the CollectionsStringProperty object itself.
     */
    @Metadata(generated = true)
    public CollectionsStringProperty setNullableProperty(List<String> nullableProperty) {
        this.nullableProperty = nullableProperty;
        this.updatedProperties.add("nullableProperty");
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
            jsonWriter.writeStringField("requiredProperty", this.requiredProperty);
            jsonWriter.writeArrayField("nullableProperty", this.nullableProperty,
                (writer, element) -> writer.writeString(element));
            return jsonWriter.writeEndObject();
        }
    }

    @Metadata(generated = true)
    private JsonWriter toJsonMergePatch(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        if (updatedProperties.contains("requiredProperty")) {
            if (this.requiredProperty == null) {
                jsonWriter.writeNullField("requiredProperty");
            } else {
                jsonWriter.writeStringField("requiredProperty", this.requiredProperty);
            }
        }
        if (updatedProperties.contains("nullableProperty")) {
            if (this.nullableProperty == null) {
                jsonWriter.writeNullField("nullableProperty");
            } else {
                jsonWriter.writeArrayField("nullableProperty", this.nullableProperty,
                    (writer, element) -> writer.writeString(element));
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of CollectionsStringProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of CollectionsStringProperty if the JsonReader was pointing to an instance of it, or null if
     * it was pointing to JSON null.
     * @throws IOException If an error occurs while reading the CollectionsStringProperty.
     */
    @Metadata(generated = true)
    public static CollectionsStringProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            CollectionsStringProperty deserializedCollectionsStringProperty = new CollectionsStringProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("requiredProperty".equals(fieldName)) {
                    deserializedCollectionsStringProperty.requiredProperty = reader.getString();
                } else if ("nullableProperty".equals(fieldName)) {
                    List<String> nullableProperty = reader.readArray(reader1 -> reader1.getString());
                    deserializedCollectionsStringProperty.nullableProperty = nullableProperty;
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedCollectionsStringProperty;
        });
    }
}
