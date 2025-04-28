package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Resource create operation model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class PetCreate implements JsonSerializable<PetCreate> {
    /*
     * The name property.
     */
    @Metadata(generated = true)
    private final String name;

    /*
     * The tag property.
     */
    @Metadata(generated = true)
    private String tag;

    /*
     * The age property.
     */
    @Metadata(generated = true)
    private final int age;

    /*
     * The ownerId property.
     */
    @Metadata(generated = true)
    private final long ownerId;

    /**
     * Creates an instance of PetCreate class.
     * 
     * @param name the name value to set.
     * @param age the age value to set.
     * @param ownerId the ownerId value to set.
     */
    @Metadata(generated = true)
    public PetCreate(String name, int age, long ownerId) {
        this.name = name;
        this.age = age;
        this.ownerId = ownerId;
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
     * Get the tag property: The tag property.
     * 
     * @return the tag value.
     */
    @Metadata(generated = true)
    public String getTag() {
        return this.tag;
    }

    /**
     * Set the tag property: The tag property.
     * 
     * @param tag the tag value to set.
     * @return the PetCreate object itself.
     */
    @Metadata(generated = true)
    public PetCreate setTag(String tag) {
        this.tag = tag;
        return this;
    }

    /**
     * Get the age property: The age property.
     * 
     * @return the age value.
     */
    @Metadata(generated = true)
    public int getAge() {
        return this.age;
    }

    /**
     * Get the ownerId property: The ownerId property.
     * 
     * @return the ownerId value.
     */
    @Metadata(generated = true)
    public long getOwnerId() {
        return this.ownerId;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", this.name);
        jsonWriter.writeIntField("age", this.age);
        jsonWriter.writeLongField("ownerId", this.ownerId);
        jsonWriter.writeStringField("tag", this.tag);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PetCreate from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PetCreate if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the PetCreate.
     */
    @Metadata(generated = true)
    public static PetCreate fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            int age = 0;
            long ownerId = 0L;
            String tag = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("age".equals(fieldName)) {
                    age = reader.getInt();
                } else if ("ownerId".equals(fieldName)) {
                    ownerId = reader.getLong();
                } else if ("tag".equals(fieldName)) {
                    tag = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            PetCreate deserializedPetCreate = new PetCreate(name, age, ownerId);
            deserializedPetCreate.tag = tag;

            return deserializedPetCreate;
        });
    }
}
