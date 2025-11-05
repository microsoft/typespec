package type.property.optional;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Model with required and optional properties.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class RequiredAndOptionalProperty implements JsonSerializable<RequiredAndOptionalProperty> {

    /*
     * optional string property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String optionalProperty;

    /*
     * required int property
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final int requiredProperty;

    /**
     * Creates an instance of RequiredAndOptionalProperty class.
     *
     * @param requiredProperty the requiredProperty value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public RequiredAndOptionalProperty(int requiredProperty) {
        this.requiredProperty = requiredProperty;
    }

    /**
     * Get the optionalProperty property: optional string property.
     *
     * @return the optionalProperty value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getOptionalProperty() {
        return this.optionalProperty;
    }

    /**
     * Set the optionalProperty property: optional string property.
     *
     * @param optionalProperty the optionalProperty value to set.
     * @return the RequiredAndOptionalProperty object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public RequiredAndOptionalProperty setOptionalProperty(String optionalProperty) {
        this.optionalProperty = optionalProperty;
        return this;
    }

    /**
     * Get the requiredProperty property: required int property.
     *
     * @return the requiredProperty value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public int getRequiredProperty() {
        return this.requiredProperty;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("requiredProperty", this.requiredProperty);
        jsonWriter.writeStringField("optionalProperty", this.optionalProperty);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of RequiredAndOptionalProperty from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of RequiredAndOptionalProperty if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the RequiredAndOptionalProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static RequiredAndOptionalProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int requiredProperty = 0;
            String optionalProperty = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("requiredProperty".equals(fieldName)) {
                    requiredProperty = reader.getInt();
                } else if ("optionalProperty".equals(fieldName)) {
                    optionalProperty = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            RequiredAndOptionalProperty deserializedRequiredAndOptionalProperty
                = new RequiredAndOptionalProperty(requiredProperty);
            deserializedRequiredAndOptionalProperty.optionalProperty = optionalProperty;
            return deserializedRequiredAndOptionalProperty;
        });
    }
}
