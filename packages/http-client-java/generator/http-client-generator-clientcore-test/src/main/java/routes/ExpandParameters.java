package routes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * A named model used to verify explode expansion of a model-valued query parameter.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ExpandParameters implements JsonSerializable<ExpandParameters> {
    /*
     * The field property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String field;

    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String value;

    /**
     * Creates an instance of ExpandParameters class.
     *
     * @param field the field value to set.
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExpandParameters(String field, String value) {
        this.field = field;
        this.value = value;
    }

    /**
     * Get the field property: The field property.
     *
     * @return the field value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getField() {
        return this.field;
    }

    /**
     * Get the value property: The value property.
     *
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("field", this.field);
        jsonWriter.writeStringField("value", this.value);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of ExpandParameters from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of ExpandParameters if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the ExpandParameters.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ExpandParameters fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String field = null;
            String value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("field".equals(fieldName)) {
                    field = reader.getString();
                } else if ("value".equals(fieldName)) {
                    value = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new ExpandParameters(field, value);
        });
    }
}
