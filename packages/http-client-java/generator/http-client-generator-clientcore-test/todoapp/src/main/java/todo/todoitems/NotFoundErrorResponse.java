package todo.todoitems;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The NotFoundErrorResponse model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class NotFoundErrorResponse implements JsonSerializable<NotFoundErrorResponse> {
    /*
     * The code property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String code = "not-found";

    /**
     * Creates an instance of NotFoundErrorResponse class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private NotFoundErrorResponse() {
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
        jsonWriter.writeStringField("code", this.code);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of NotFoundErrorResponse from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of NotFoundErrorResponse if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the NotFoundErrorResponse.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static NotFoundErrorResponse fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            NotFoundErrorResponse deserializedNotFoundErrorResponse = new NotFoundErrorResponse();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                reader.skipChildren();
            }

            return deserializedNotFoundErrorResponse;
        });
    }
}
