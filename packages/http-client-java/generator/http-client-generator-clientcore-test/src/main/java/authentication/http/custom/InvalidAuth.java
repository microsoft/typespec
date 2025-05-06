package authentication.http.custom;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The InvalidAuth model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class InvalidAuth implements JsonSerializable<InvalidAuth> {
    /*
     * The error property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String error;

    /**
     * Creates an instance of InvalidAuth class.
     * 
     * @param error the error value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private InvalidAuth(String error) {
        this.error = error;
    }

    /**
     * Get the error property: The error property.
     * 
     * @return the error value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getError() {
        return this.error;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("error", this.error);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of InvalidAuth from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of InvalidAuth if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the InvalidAuth.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static InvalidAuth fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String error = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("error".equals(fieldName)) {
                    error = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new InvalidAuth(error);
        });
    }
}
