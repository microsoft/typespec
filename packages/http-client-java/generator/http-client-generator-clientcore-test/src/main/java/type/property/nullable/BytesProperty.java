package type.property.nullable;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import type.property.nullable.implementation.JsonMergePatchHelper;

/**
 * Template type for testing models with nullable property. Pass in the type of the property you are looking for.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class BytesProperty implements JsonSerializable<BytesProperty> {
    /*
     * Required property
     */
    @Metadata(generated = true)
    private String requiredProperty;

    /*
     * Property
     */
    @Metadata(generated = true)
    private byte[] nullableProperty;

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
        JsonMergePatchHelper.setBytesPropertyAccessor(new JsonMergePatchHelper.BytesPropertyAccessor() {
            @Override
            public BytesProperty prepareModelForJsonMergePatch(BytesProperty model, boolean jsonMergePatchEnabled) {
                model.serializeAsJsonMergePatch(jsonMergePatchEnabled);
                return model;
            }

            @Override
            public boolean isJsonMergePatch(BytesProperty model) {
                return model.jsonMergePatch;
            }
        });
    }

    /**
     * Creates an instance of BytesProperty class.
     */
    @Metadata(generated = true)
    public BytesProperty() {
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
     * @return the BytesProperty object itself.
     */
    @Metadata(generated = true)
    public BytesProperty setRequiredProperty(String requiredProperty) {
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
    public byte[] getNullableProperty() {
        return this.nullableProperty;
    }

    /**
     * Set the nullableProperty property: Property.
     * <p>Required when create the resource.</p>
     * 
     * @param nullableProperty the nullableProperty value to set.
     * @return the BytesProperty object itself.
     */
    @Metadata(generated = true)
    public BytesProperty setNullableProperty(byte[] nullableProperty) {
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
            jsonWriter.writeBinaryField("nullableProperty", this.nullableProperty);
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
                jsonWriter.writeBinaryField("nullableProperty", this.nullableProperty);
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of BytesProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of BytesProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the BytesProperty.
     */
    @Metadata(generated = true)
    public static BytesProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BytesProperty deserializedBytesProperty = new BytesProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("requiredProperty".equals(fieldName)) {
                    deserializedBytesProperty.requiredProperty = reader.getString();
                } else if ("nullableProperty".equals(fieldName)) {
                    deserializedBytesProperty.nullableProperty = reader.getBinary();
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedBytesProperty;
        });
    }
}
