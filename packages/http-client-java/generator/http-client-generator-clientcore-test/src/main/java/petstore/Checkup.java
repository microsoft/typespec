package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The Checkup model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Checkup implements JsonSerializable<Checkup> {
    /*
     * The id property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private int id;

    /*
     * The vetName property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String vetName;

    /*
     * The notes property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String notes;

    /**
     * Creates an instance of Checkup class.
     * 
     * @param vetName the vetName value to set.
     * @param notes the notes value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Checkup(String vetName, String notes) {
        this.vetName = vetName;
        this.notes = notes;
    }

    /**
     * Get the id property: The id property.
     * 
     * @return the id value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public int getId() {
        return this.id;
    }

    /**
     * Get the vetName property: The vetName property.
     * 
     * @return the vetName value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getVetName() {
        return this.vetName;
    }

    /**
     * Get the notes property: The notes property.
     * 
     * @return the notes value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getNotes() {
        return this.notes;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("vetName", this.vetName);
        jsonWriter.writeStringField("notes", this.notes);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Checkup from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Checkup if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Checkup.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Checkup fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int id = 0;
            String vetName = null;
            String notes = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("id".equals(fieldName)) {
                    id = reader.getInt();
                } else if ("vetName".equals(fieldName)) {
                    vetName = reader.getString();
                } else if ("notes".equals(fieldName)) {
                    notes = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Checkup deserializedCheckup = new Checkup(vetName, notes);
            deserializedCheckup.id = id;

            return deserializedCheckup;
        });
    }
}
