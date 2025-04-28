package todo.todoitems.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;
import todo.TodoItem;

/**
 * The TodoPage model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class TodoPage implements JsonSerializable<TodoPage> {
    /*
     * The items in the page
     */
    @Metadata(generated = true)
    private final List<TodoItem> items;

    /*
     * The number of items returned in this page
     */
    @Metadata(generated = true)
    private final int pageSize;

    /*
     * The total number of items
     */
    @Metadata(generated = true)
    private final int totalSize;

    /*
     * A link to the previous page, if it exists
     */
    @Metadata(generated = true)
    private String prevLink;

    /*
     * A link to the next page, if it exists
     */
    @Metadata(generated = true)
    private String nextLink;

    /**
     * Creates an instance of TodoPage class.
     * 
     * @param items the items value to set.
     * @param pageSize the pageSize value to set.
     * @param totalSize the totalSize value to set.
     */
    @Metadata(generated = true)
    private TodoPage(List<TodoItem> items, int pageSize, int totalSize) {
        this.items = items;
        this.pageSize = pageSize;
        this.totalSize = totalSize;
    }

    /**
     * Get the items property: The items in the page.
     * 
     * @return the items value.
     */
    @Metadata(generated = true)
    public List<TodoItem> getItems() {
        return this.items;
    }

    /**
     * Get the pageSize property: The number of items returned in this page.
     * 
     * @return the pageSize value.
     */
    @Metadata(generated = true)
    public int getPageSize() {
        return this.pageSize;
    }

    /**
     * Get the totalSize property: The total number of items.
     * 
     * @return the totalSize value.
     */
    @Metadata(generated = true)
    public int getTotalSize() {
        return this.totalSize;
    }

    /**
     * Get the prevLink property: A link to the previous page, if it exists.
     * 
     * @return the prevLink value.
     */
    @Metadata(generated = true)
    public String getPrevLink() {
        return this.prevLink;
    }

    /**
     * Get the nextLink property: A link to the next page, if it exists.
     * 
     * @return the nextLink value.
     */
    @Metadata(generated = true)
    public String getNextLink() {
        return this.nextLink;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("items", this.items, (writer, element) -> writer.writeJson(element));
        jsonWriter.writeIntField("pageSize", this.pageSize);
        jsonWriter.writeIntField("totalSize", this.totalSize);
        jsonWriter.writeStringField("prevLink", this.prevLink);
        jsonWriter.writeStringField("nextLink", this.nextLink);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of TodoPage from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of TodoPage if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the TodoPage.
     */
    @Metadata(generated = true)
    public static TodoPage fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<TodoItem> items = null;
            int pageSize = 0;
            int totalSize = 0;
            String prevLink = null;
            String nextLink = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("items".equals(fieldName)) {
                    items = reader.readArray(reader1 -> TodoItem.fromJson(reader1));
                } else if ("pageSize".equals(fieldName)) {
                    pageSize = reader.getInt();
                } else if ("totalSize".equals(fieldName)) {
                    totalSize = reader.getInt();
                } else if ("prevLink".equals(fieldName)) {
                    prevLink = reader.getString();
                } else if ("nextLink".equals(fieldName)) {
                    nextLink = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            TodoPage deserializedTodoPage = new TodoPage(items, pageSize, totalSize);
            deserializedTodoPage.prevLink = prevLink;
            deserializedTodoPage.nextLink = nextLink;

            return deserializedTodoPage;
        });
    }
}
