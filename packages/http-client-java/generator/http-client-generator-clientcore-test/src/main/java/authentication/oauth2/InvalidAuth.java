package authentication.oauth2;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The InvalidAuth model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class InvalidAuth implements JsonSerializable<InvalidAuth> {
    /*
     * The error property.
     */
    @Metadata(generated = true)
    private final String error;

    /**
     * Creates an instance of InvalidAuth class.
     * 
     * @param error the error value to set.
     */
    @Metadata(generated = true)
    private InvalidAuth(String error) {
        this.error = error;
    }

    /**
     * Get the error property: The error property.
     * 
     * @return the error value.
     */
    @Metadata(generated = true)
    public String getError() {
        return this.error;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
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
    @Metadata(generated = true)
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
