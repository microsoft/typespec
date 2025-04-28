package todo.todoitems;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import todo.ApiError;

/**
 * The InvalidTodoItem model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class InvalidTodoItem extends ApiError {
    /**
     * Creates an instance of InvalidTodoItem class.
     * 
     * @param code the code value to set.
     * @param message the message value to set.
     */
    @Metadata(generated = true)
    private InvalidTodoItem(String code, String message) {
        super(code, message);
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("code", getCode());
        jsonWriter.writeStringField("message", getMessage());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of InvalidTodoItem from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of InvalidTodoItem if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the InvalidTodoItem.
     */
    @Metadata(generated = true)
    public static InvalidTodoItem fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String code = null;
            String message = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("code".equals(fieldName)) {
                    code = reader.getString();
                } else if ("message".equals(fieldName)) {
                    message = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new InvalidTodoItem(code, message);
        });
    }
}
