package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.OffsetDateTime;

/**
 * The TodoItem model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class TodoItem implements JsonSerializable<TodoItem> {
    /*
     * The item's unique id
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private long id;

    /*
     * The item's title
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String title;

    /*
     * User that created the todo
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private long createdBy;

    /*
     * User that the todo is assigned to
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Long assignedTo;

    /*
     * A longer description of the todo item in markdown format
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String description;

    /*
     * The status of the todo item
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final TodoItemStatus status;

    /*
     * When the todo item was created.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private OffsetDateTime createdAt;

    /*
     * When the todo item was last updated
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private OffsetDateTime updatedAt;

    /*
     * When the todo item was marked as completed
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private OffsetDateTime completedAt;

    /*
     * The labels property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private BinaryData labels;

    /*
     * The _dummy property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String dummy;

    /**
     * Creates an instance of TodoItem class.
     * 
     * @param title the title value to set.
     * @param status the status value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public TodoItem(String title, TodoItemStatus status) {
        this.title = title;
        this.status = status;
    }

    /**
     * Get the id property: The item's unique id.
     * 
     * @return the id value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public long getId() {
        return this.id;
    }

    /**
     * Get the title property: The item's title.
     * 
     * @return the title value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getTitle() {
        return this.title;
    }

    /**
     * Get the createdBy property: User that created the todo.
     * 
     * @return the createdBy value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public long getCreatedBy() {
        return this.createdBy;
    }

    /**
     * Get the assignedTo property: User that the todo is assigned to.
     * 
     * @return the assignedTo value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Long getAssignedTo() {
        return this.assignedTo;
    }

    /**
     * Set the assignedTo property: User that the todo is assigned to.
     * 
     * @param assignedTo the assignedTo value to set.
     * @return the TodoItem object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public TodoItem setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
        return this;
    }

    /**
     * Get the description property: A longer description of the todo item in markdown format.
     * 
     * @return the description value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getDescription() {
        return this.description;
    }

    /**
     * Set the description property: A longer description of the todo item in markdown format.
     * 
     * @param description the description value to set.
     * @return the TodoItem object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public TodoItem setDescription(String description) {
        this.description = description;
        return this;
    }

    /**
     * Get the status property: The status of the todo item.
     * 
     * @return the status value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public TodoItemStatus getStatus() {
        return this.status;
    }

    /**
     * Get the createdAt property: When the todo item was created.
     * 
     * @return the createdAt value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OffsetDateTime getCreatedAt() {
        return this.createdAt;
    }

    /**
     * Get the updatedAt property: When the todo item was last updated.
     * 
     * @return the updatedAt value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OffsetDateTime getUpdatedAt() {
        return this.updatedAt;
    }

    /**
     * Get the completedAt property: When the todo item was marked as completed.
     * 
     * @return the completedAt value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OffsetDateTime getCompletedAt() {
        return this.completedAt;
    }

    /**
     * Get the labels property: The labels property.
     * 
     * @return the labels value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BinaryData getLabels() {
        return this.labels;
    }

    /**
     * Set the labels property: The labels property.
     * 
     * @param labels the labels value to set.
     * @return the TodoItem object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public TodoItem setLabels(BinaryData labels) {
        this.labels = labels;
        return this;
    }

    /**
     * Get the dummy property: The _dummy property.
     * 
     * @return the dummy value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getDummy() {
        return this.dummy;
    }

    /**
     * Set the dummy property: The _dummy property.
     * 
     * @param dummy the dummy value to set.
     * @return the TodoItem object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public TodoItem setDummy(String dummy) {
        this.dummy = dummy;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("title", this.title);
        jsonWriter.writeStringField("status", this.status == null ? null : this.status.toString());
        jsonWriter.writeNumberField("assignedTo", this.assignedTo);
        jsonWriter.writeStringField("description", this.description);
        if (this.labels != null) {
            jsonWriter.writeFieldName("labels");
            this.labels.writeTo(jsonWriter);
        }
        jsonWriter.writeStringField("_dummy", this.dummy);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of TodoItem from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of TodoItem if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the TodoItem.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static TodoItem fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            long id = 0L;
            String title = null;
            long createdBy = 0L;
            TodoItemStatus status = null;
            OffsetDateTime createdAt = null;
            OffsetDateTime updatedAt = null;
            Long assignedTo = null;
            String description = null;
            OffsetDateTime completedAt = null;
            BinaryData labels = null;
            String dummy = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("id".equals(fieldName)) {
                    id = reader.getLong();
                } else if ("title".equals(fieldName)) {
                    title = reader.getString();
                } else if ("createdBy".equals(fieldName)) {
                    createdBy = reader.getLong();
                } else if ("status".equals(fieldName)) {
                    status = TodoItemStatus.fromString(reader.getString());
                } else if ("createdAt".equals(fieldName)) {
                    createdAt = reader.getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()));
                } else if ("updatedAt".equals(fieldName)) {
                    updatedAt = reader.getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()));
                } else if ("assignedTo".equals(fieldName)) {
                    assignedTo = reader.getNullable(JsonReader::getLong);
                } else if ("description".equals(fieldName)) {
                    description = reader.getString();
                } else if ("completedAt".equals(fieldName)) {
                    completedAt = reader.getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()));
                } else if ("labels".equals(fieldName)) {
                    labels = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("_dummy".equals(fieldName)) {
                    dummy = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            TodoItem deserializedTodoItem = new TodoItem(title, status);
            deserializedTodoItem.id = id;
            deserializedTodoItem.createdBy = createdBy;
            deserializedTodoItem.createdAt = createdAt;
            deserializedTodoItem.updatedAt = updatedAt;
            deserializedTodoItem.assignedTo = assignedTo;
            deserializedTodoItem.description = description;
            deserializedTodoItem.completedAt = completedAt;
            deserializedTodoItem.labels = labels;
            deserializedTodoItem.dummy = dummy;

            return deserializedTodoItem;
        });
    }
}
