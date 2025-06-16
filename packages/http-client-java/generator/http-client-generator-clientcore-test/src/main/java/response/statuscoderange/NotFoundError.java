package response.statuscoderange;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The NotFoundError model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class NotFoundError implements JsonSerializable<NotFoundError> {
    /*
     * The code property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String code;

    /*
     * The resourceId property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String resourceId;

    /**
     * Creates an instance of NotFoundError class.
     * 
     * @param code the code value to set.
     * @param resourceId the resourceId value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private NotFoundError(String code, String resourceId) {
        this.code = code;
        this.resourceId = resourceId;
    }

    /**
     * Get the code property: The code property.
     * 
     * @return the code value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getCode() {
        return this.code;
    }

    /**
     * Get the resourceId property: The resourceId property.
     * 
     * @return the resourceId value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getResourceId() {
        return this.resourceId;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("code", this.code);
        jsonWriter.writeStringField("resourceId", this.resourceId);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of NotFoundError from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of NotFoundError if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the NotFoundError.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static NotFoundError fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String code = null;
            String resourceId = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("code".equals(fieldName)) {
                    code = reader.getString();
                } else if ("resourceId".equals(fieldName)) {
                    resourceId = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new NotFoundError(code, resourceId);
        });
    }
}
