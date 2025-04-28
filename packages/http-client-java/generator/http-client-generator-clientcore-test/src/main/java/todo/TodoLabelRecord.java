package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The TodoLabelRecord model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class TodoLabelRecord implements JsonSerializable<TodoLabelRecord> {
    /*
     * The name property.
     */
    @Metadata(generated = true)
    private final String name;

    /*
     * The color property.
     */
    @Metadata(generated = true)
    private String color;

    /**
     * Creates an instance of TodoLabelRecord class.
     * 
     * @param name the name value to set.
     */
    @Metadata(generated = true)
    public TodoLabelRecord(String name) {
        this.name = name;
    }

    /**
     * Get the name property: The name property.
     * 
     * @return the name value.
     */
    @Metadata(generated = true)
    public String getName() {
        return this.name;
    }

    /**
     * Get the color property: The color property.
     * 
     * @return the color value.
     */
    @Metadata(generated = true)
    public String getColor() {
        return this.color;
    }

    /**
     * Set the color property: The color property.
     * 
     * @param color the color value to set.
     * @return the TodoLabelRecord object itself.
     */
    @Metadata(generated = true)
    public TodoLabelRecord setColor(String color) {
        this.color = color;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", this.name);
        jsonWriter.writeStringField("color", this.color);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of TodoLabelRecord from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of TodoLabelRecord if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the TodoLabelRecord.
     */
    @Metadata(generated = true)
    public static TodoLabelRecord fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            String color = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("color".equals(fieldName)) {
                    color = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            TodoLabelRecord deserializedTodoLabelRecord = new TodoLabelRecord(name);
            deserializedTodoLabelRecord.color = color;

            return deserializedTodoLabelRecord;
        });
    }
}
