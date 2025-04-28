package todo.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;
import todo.TodoAttachment;
import todo.TodoItem;

/**
 * The CreateJsonRequest model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class CreateJsonRequest implements JsonSerializable<CreateJsonRequest> {
    /*
     * The item property.
     */
    @Metadata(generated = true)
    private final TodoItem item;

    /*
     * The attachments property.
     */
    @Metadata(generated = true)
    private List<TodoAttachment> attachments;

    /**
     * Creates an instance of CreateJsonRequest class.
     * 
     * @param item the item value to set.
     */
    @Metadata(generated = true)
    public CreateJsonRequest(TodoItem item) {
        this.item = item;
    }

    /**
     * Get the item property: The item property.
     * 
     * @return the item value.
     */
    @Metadata(generated = true)
    public TodoItem getItem() {
        return this.item;
    }

    /**
     * Get the attachments property: The attachments property.
     * 
     * @return the attachments value.
     */
    @Metadata(generated = true)
    public List<TodoAttachment> getAttachments() {
        return this.attachments;
    }

    /**
     * Set the attachments property: The attachments property.
     * 
     * @param attachments the attachments value to set.
     * @return the CreateJsonRequest object itself.
     */
    @Metadata(generated = true)
    public CreateJsonRequest setAttachments(List<TodoAttachment> attachments) {
        this.attachments = attachments;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeJsonField("item", this.item);
        jsonWriter.writeArrayField("attachments", this.attachments, (writer, element) -> writer.writeJson(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of CreateJsonRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of CreateJsonRequest if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the CreateJsonRequest.
     */
    @Metadata(generated = true)
    public static CreateJsonRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            TodoItem item = null;
            List<TodoAttachment> attachments = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("item".equals(fieldName)) {
                    item = TodoItem.fromJson(reader);
                } else if ("attachments".equals(fieldName)) {
                    attachments = reader.readArray(reader1 -> TodoAttachment.fromJson(reader1));
                } else {
                    reader.skipChildren();
                }
            }
            CreateJsonRequest deserializedCreateJsonRequest = new CreateJsonRequest(item);
            deserializedCreateJsonRequest.attachments = attachments;

            return deserializedCreateJsonRequest;
        });
    }
}
