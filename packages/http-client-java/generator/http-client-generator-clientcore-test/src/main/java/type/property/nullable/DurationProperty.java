package type.property.nullable;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.Duration;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import type.property.nullable.implementation.JsonMergePatchHelper;

/**
 * Model with a duration property.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class DurationProperty implements JsonSerializable<DurationProperty> {
    /*
     * Required property
     */
    @Metadata(generated = true)
    private String requiredProperty;

    /*
     * Property
     */
    @Metadata(generated = true)
    private Duration nullableProperty;

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
        JsonMergePatchHelper.setDurationPropertyAccessor(new JsonMergePatchHelper.DurationPropertyAccessor() {
            @Override
            public DurationProperty prepareModelForJsonMergePatch(DurationProperty model,
                boolean jsonMergePatchEnabled) {
                model.serializeAsJsonMergePatch(jsonMergePatchEnabled);
                return model;
            }

            @Override
            public boolean isJsonMergePatch(DurationProperty model) {
                return model.jsonMergePatch;
            }
        });
    }

    /**
     * Creates an instance of DurationProperty class.
     */
    @Metadata(generated = true)
    public DurationProperty() {
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
     * @return the DurationProperty object itself.
     */
    @Metadata(generated = true)
    public DurationProperty setRequiredProperty(String requiredProperty) {
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
    public Duration getNullableProperty() {
        return this.nullableProperty;
    }

    /**
     * Set the nullableProperty property: Property.
     * <p>Required when create the resource.</p>
     * 
     * @param nullableProperty the nullableProperty value to set.
     * @return the DurationProperty object itself.
     */
    @Metadata(generated = true)
    public DurationProperty setNullableProperty(Duration nullableProperty) {
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
            jsonWriter.writeStringField("nullableProperty", Objects.toString(this.nullableProperty, null));
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
                jsonWriter.writeStringField("nullableProperty", Objects.toString(this.nullableProperty, null));
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of DurationProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of DurationProperty if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the DurationProperty.
     */
    @Metadata(generated = true)
    public static DurationProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            DurationProperty deserializedDurationProperty = new DurationProperty();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("requiredProperty".equals(fieldName)) {
                    deserializedDurationProperty.requiredProperty = reader.getString();
                } else if ("nullableProperty".equals(fieldName)) {
                    deserializedDurationProperty.nullableProperty
                        = reader.getNullable(nonNullReader -> Duration.parse(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedDurationProperty;
        });
    }
}
