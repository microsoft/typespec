package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Resource create or update operation model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class CheckupUpdate implements JsonSerializable<CheckupUpdate> {
    /*
     * The vetName property.
     */
    @Metadata(generated = true)
    private String vetName;

    /*
     * The notes property.
     */
    @Metadata(generated = true)
    private String notes;

    /**
     * Creates an instance of CheckupUpdate class.
     */
    @Metadata(generated = true)
    public CheckupUpdate() {
    }

    /**
     * Get the vetName property: The vetName property.
     * 
     * @return the vetName value.
     */
    @Metadata(generated = true)
    public String getVetName() {
        return this.vetName;
    }

    /**
     * Set the vetName property: The vetName property.
     * 
     * @param vetName the vetName value to set.
     * @return the CheckupUpdate object itself.
     */
    @Metadata(generated = true)
    public CheckupUpdate setVetName(String vetName) {
        this.vetName = vetName;
        return this;
    }

    /**
     * Get the notes property: The notes property.
     * 
     * @return the notes value.
     */
    @Metadata(generated = true)
    public String getNotes() {
        return this.notes;
    }

    /**
     * Set the notes property: The notes property.
     * 
     * @param notes the notes value to set.
     * @return the CheckupUpdate object itself.
     */
    @Metadata(generated = true)
    public CheckupUpdate setNotes(String notes) {
        this.notes = notes;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("vetName", this.vetName);
        jsonWriter.writeStringField("notes", this.notes);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of CheckupUpdate from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of CheckupUpdate if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the CheckupUpdate.
     */
    @Metadata(generated = true)
    public static CheckupUpdate fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            CheckupUpdate deserializedCheckupUpdate = new CheckupUpdate();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("vetName".equals(fieldName)) {
                    deserializedCheckupUpdate.vetName = reader.getString();
                } else if ("notes".equals(fieldName)) {
                    deserializedCheckupUpdate.notes = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedCheckupUpdate;
        });
    }
}
