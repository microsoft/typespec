package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The CreateFormRequestItem model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class CreateFormRequestItem implements JsonSerializable<CreateFormRequestItem> {
    /*
     * The item's title
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String title;

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
     * Creates an instance of CreateFormRequestItem class.
     * 
     * @param title the title value to set.
     * @param status the status value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CreateFormRequestItem(String title, TodoItemStatus status) {
        this.title = title;
        this.status = status;
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
     * @return the CreateFormRequestItem object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CreateFormRequestItem setAssignedTo(Long assignedTo) {
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
     * @return the CreateFormRequestItem object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CreateFormRequestItem setDescription(String description) {
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
     * @return the CreateFormRequestItem object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CreateFormRequestItem setLabels(BinaryData labels) {
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
     * @return the CreateFormRequestItem object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CreateFormRequestItem setDummy(String dummy) {
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
     * Reads an instance of CreateFormRequestItem from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of CreateFormRequestItem if the JsonReader was pointing to an instance of it, or null if it
     * was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the CreateFormRequestItem.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static CreateFormRequestItem fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String title = null;
            TodoItemStatus status = null;
            Long assignedTo = null;
            String description = null;
            BinaryData labels = null;
            String dummy = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("title".equals(fieldName)) {
                    title = reader.getString();
                } else if ("status".equals(fieldName)) {
                    status = TodoItemStatus.fromString(reader.getString());
                } else if ("assignedTo".equals(fieldName)) {
                    assignedTo = reader.getNullable(JsonReader::getLong);
                } else if ("description".equals(fieldName)) {
                    description = reader.getString();
                } else if ("labels".equals(fieldName)) {
                    labels = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("_dummy".equals(fieldName)) {
                    dummy = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            CreateFormRequestItem deserializedCreateFormRequestItem = new CreateFormRequestItem(title, status);
            deserializedCreateFormRequestItem.assignedTo = assignedTo;
            deserializedCreateFormRequestItem.description = description;
            deserializedCreateFormRequestItem.labels = labels;
            deserializedCreateFormRequestItem.dummy = dummy;

            return deserializedCreateFormRequestItem;
        });
    }
}
