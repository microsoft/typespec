package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The PetStoreError model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class PetStoreError implements JsonSerializable<PetStoreError> {
    /*
     * The code property.
     */
    @Metadata(generated = true)
    private final int code;

    /*
     * The message property.
     */
    @Metadata(generated = true)
    private final String message;

    /**
     * Creates an instance of PetStoreError class.
     * 
     * @param code the code value to set.
     * @param message the message value to set.
     */
    @Metadata(generated = true)
    private PetStoreError(int code, String message) {
        this.code = code;
        this.message = message;
    }

    /**
     * Get the code property: The code property.
     * 
     * @return the code value.
     */
    @Metadata(generated = true)
    public int getCode() {
        return this.code;
    }

    /**
     * Get the message property: The message property.
     * 
     * @return the message value.
     */
    @Metadata(generated = true)
    public String getMessage() {
        return this.message;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("code", this.code);
        jsonWriter.writeStringField("message", this.message);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PetStoreError from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PetStoreError if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the PetStoreError.
     */
    @Metadata(generated = true)
    public static PetStoreError fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int code = 0;
            String message = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("code".equals(fieldName)) {
                    code = reader.getInt();
                } else if ("message".equals(fieldName)) {
                    message = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new PetStoreError(code, message);
        });
    }
}
