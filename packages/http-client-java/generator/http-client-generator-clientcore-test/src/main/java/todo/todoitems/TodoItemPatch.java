package todo.todoitems;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import todo.TodoItemPatchStatus;
import todo.implementation.JsonMergePatchHelper;

/**
 * The TodoItemPatch model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class TodoItemPatch implements JsonSerializable<TodoItemPatch> {
    /*
     * The item's title
     */
    @Metadata(generated = true)
    private String title;

    /*
     * User that the todo is assigned to
     */
    @Metadata(generated = true)
    private Long assignedTo;

    /*
     * A longer description of the todo item in markdown format
     */
    @Metadata(generated = true)
    private String description;

    /*
     * The status of the todo item
     */
    @Metadata(generated = true)
    private TodoItemPatchStatus status;

    /**
     * Stores updated model property, the value is property name, not serialized name.
     */
    @Metadata(generated = true)
    private final Set<String> updatedProperties = new HashSet<>();

    @Metadata(generated = true)
    private boolean jsonMergePatch;

    @Metadata(generated = true)
    private void serializeAsJsonMergePatch(boolean jsonMergePatch) {
        this.jsonMergePatch = jsonMergePatch;
    }

    static {
        JsonMergePatchHelper.setTodoItemPatchAccessor(new JsonMergePatchHelper.TodoItemPatchAccessor() {
            @Override
            public TodoItemPatch prepareModelForJsonMergePatch(TodoItemPatch model, boolean jsonMergePatchEnabled) {
                model.serializeAsJsonMergePatch(jsonMergePatchEnabled);
                return model;
            }

            @Override
            public boolean isJsonMergePatch(TodoItemPatch model) {
                return model.jsonMergePatch;
            }
        });
    }

    /**
     * Creates an instance of TodoItemPatch class.
     */
    @Metadata(generated = true)
    public TodoItemPatch() {
    }

    /**
     * Get the title property: The item's title.
     * 
     * @return the title value.
     */
    @Metadata(generated = true)
    public String getTitle() {
        return this.title;
    }

    /**
     * Set the title property: The item's title.
     * 
     * @param title the title value to set.
     * @return the TodoItemPatch object itself.
     */
    @Metadata(generated = true)
    public TodoItemPatch setTitle(String title) {
        this.title = title;
        this.updatedProperties.add("title");
        return this;
    }

    /**
     * Get the assignedTo property: User that the todo is assigned to.
     * 
     * @return the assignedTo value.
     */
    @Metadata(generated = true)
    public Long getAssignedTo() {
        return this.assignedTo;
    }

    /**
     * Set the assignedTo property: User that the todo is assigned to.
     * 
     * @param assignedTo the assignedTo value to set.
     * @return the TodoItemPatch object itself.
     */
    @Metadata(generated = true)
    public TodoItemPatch setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
        this.updatedProperties.add("assignedTo");
        return this;
    }

    /**
     * Get the description property: A longer description of the todo item in markdown format.
     * 
     * @return the description value.
     */
    @Metadata(generated = true)
    public String getDescription() {
        return this.description;
    }

    /**
     * Set the description property: A longer description of the todo item in markdown format.
     * 
     * @param description the description value to set.
     * @return the TodoItemPatch object itself.
     */
    @Metadata(generated = true)
    public TodoItemPatch setDescription(String description) {
        this.description = description;
        this.updatedProperties.add("description");
        return this;
    }

    /**
     * Get the status property: The status of the todo item.
     * 
     * @return the status value.
     */
    @Metadata(generated = true)
    public TodoItemPatchStatus getStatus() {
        return this.status;
    }

    /**
     * Set the status property: The status of the todo item.
     * 
     * @param status the status value to set.
     * @return the TodoItemPatch object itself.
     */
    @Metadata(generated = true)
    public TodoItemPatch setStatus(TodoItemPatchStatus status) {
        this.status = status;
        this.updatedProperties.add("status");
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        if (jsonMergePatch) {
            return toJsonMergePatch(jsonWriter);
        } else {
            jsonWriter.writeStartObject();
            jsonWriter.writeStringField("title", this.title);
            jsonWriter.writeNumberField("assignedTo", this.assignedTo);
            jsonWriter.writeStringField("description", this.description);
            jsonWriter.writeStringField("status", this.status == null ? null : this.status.toString());
            return jsonWriter.writeEndObject();
        }
    }

    @Metadata(generated = true)
    private JsonWriter toJsonMergePatch(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        if (updatedProperties.contains("title")) {
            if (this.title == null) {
                jsonWriter.writeNullField("title");
            } else {
                jsonWriter.writeStringField("title", this.title);
            }
        }
        if (updatedProperties.contains("assignedTo")) {
            if (this.assignedTo == null) {
                jsonWriter.writeNullField("assignedTo");
            } else {
                jsonWriter.writeNumberField("assignedTo", this.assignedTo);
            }
        }
        if (updatedProperties.contains("description")) {
            if (this.description == null) {
                jsonWriter.writeNullField("description");
            } else {
                jsonWriter.writeStringField("description", this.description);
            }
        }
        if (updatedProperties.contains("status")) {
            if (this.status == null) {
                jsonWriter.writeNullField("status");
            } else {
                jsonWriter.writeStringField("status", this.status.toString());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of TodoItemPatch from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of TodoItemPatch if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the TodoItemPatch.
     */
    @Metadata(generated = true)
    public static TodoItemPatch fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            TodoItemPatch deserializedTodoItemPatch = new TodoItemPatch();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("title".equals(fieldName)) {
                    deserializedTodoItemPatch.title = reader.getString();
                } else if ("assignedTo".equals(fieldName)) {
                    deserializedTodoItemPatch.assignedTo = reader.getNullable(JsonReader::getLong);
                } else if ("description".equals(fieldName)) {
                    deserializedTodoItemPatch.description = reader.getString();
                } else if ("status".equals(fieldName)) {
                    deserializedTodoItemPatch.status = TodoItemPatchStatus.fromString(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedTodoItemPatch;
        });
    }
}
