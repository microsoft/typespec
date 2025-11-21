package todo.users;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import todo.ApiError;

/**
 * The user is invalid (e.g. forgot to enter email address).
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class InvalidUserResponse extends ApiError {
    /*
     * The code property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String code = "invalid-user";

    /**
     * Creates an instance of InvalidUserResponse class.
     * 
     * @param code the code value to set.
     * @param message the message value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private InvalidUserResponse(String code, String message) {
        super(code, message);
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
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("code", getCode());
        jsonWriter.writeStringField("message", getMessage());
        jsonWriter.writeStringField("code", this.code);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of InvalidUserResponse from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of InvalidUserResponse if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the InvalidUserResponse.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static InvalidUserResponse fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String code = null;
            String message = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("message".equals(fieldName)) {
                    message = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new InvalidUserResponse(code, message);
        });
    }
}
