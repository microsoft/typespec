package todo.todoitems.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;
import todo.TodoAttachment;

/**
 * The PageTodoAttachment model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class PageTodoAttachment implements JsonSerializable<PageTodoAttachment> {
    /*
     * The items property.
     */
    @Metadata(generated = true)
    private final List<TodoAttachment> items;

    /**
     * Creates an instance of PageTodoAttachment class.
     * 
     * @param items the items value to set.
     */
    @Metadata(generated = true)
    private PageTodoAttachment(List<TodoAttachment> items) {
        this.items = items;
    }

    /**
     * Get the items property: The items property.
     * 
     * @return the items value.
     */
    @Metadata(generated = true)
    public List<TodoAttachment> getItems() {
        return this.items;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("items", this.items, (writer, element) -> writer.writeJson(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PageTodoAttachment from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PageTodoAttachment if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the PageTodoAttachment.
     */
    @Metadata(generated = true)
    public static PageTodoAttachment fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<TodoAttachment> items = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("items".equals(fieldName)) {
                    items = reader.readArray(reader1 -> TodoAttachment.fromJson(reader1));
                } else {
                    reader.skipChildren();
                }
            }
            return new PageTodoAttachment(items);
        });
    }
}
