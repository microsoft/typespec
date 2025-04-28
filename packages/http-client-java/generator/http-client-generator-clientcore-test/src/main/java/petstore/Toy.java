package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The Toy model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Toy implements JsonSerializable<Toy> {
    /*
     * The id property.
     */
    @Metadata(generated = true)
    private long id;

    /*
     * The petId property.
     */
    @Metadata(generated = true)
    private final long petId;

    /*
     * The name property.
     */
    @Metadata(generated = true)
    private final String name;

    /**
     * Creates an instance of Toy class.
     * 
     * @param petId the petId value to set.
     * @param name the name value to set.
     */
    @Metadata(generated = true)
    private Toy(long petId, String name) {
        this.petId = petId;
        this.name = name;
    }

    /**
     * Get the id property: The id property.
     * 
     * @return the id value.
     */
    @Metadata(generated = true)
    public long getId() {
        return this.id;
    }

    /**
     * Get the petId property: The petId property.
     * 
     * @return the petId value.
     */
    @Metadata(generated = true)
    public long getPetId() {
        return this.petId;
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
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeLongField("petId", this.petId);
        jsonWriter.writeStringField("name", this.name);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Toy from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Toy if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Toy.
     */
    @Metadata(generated = true)
    public static Toy fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            long id = 0L;
            long petId = 0L;
            String name = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("id".equals(fieldName)) {
                    id = reader.getLong();
                } else if ("petId".equals(fieldName)) {
                    petId = reader.getLong();
                } else if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Toy deserializedToy = new Toy(petId, name);
            deserializedToy.id = id;

            return deserializedToy;
        });
    }
}
