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
public final class PetUpdate implements JsonSerializable<PetUpdate> {
    /*
     * The name property.
     */
    @Metadata(generated = true)
    private String name;

    /*
     * The tag property.
     */
    @Metadata(generated = true)
    private String tag;

    /*
     * The age property.
     */
    @Metadata(generated = true)
    private Integer age;

    /*
     * The ownerId property.
     */
    @Metadata(generated = true)
    private Long ownerId;

    /**
     * Creates an instance of PetUpdate class.
     */
    @Metadata(generated = true)
    public PetUpdate() {
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
     * Set the name property: The name property.
     * 
     * @param name the name value to set.
     * @return the PetUpdate object itself.
     */
    @Metadata(generated = true)
    public PetUpdate setName(String name) {
        this.name = name;
        return this;
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
     * @return the PetUpdate object itself.
     */
    @Metadata(generated = true)
    public PetUpdate setTag(String tag) {
        this.tag = tag;
        return this;
    }

    /**
     * Get the age property: The age property.
     * 
     * @return the age value.
     */
    @Metadata(generated = true)
    public Integer getAge() {
        return this.age;
    }

    /**
     * Set the age property: The age property.
     * 
     * @param age the age value to set.
     * @return the PetUpdate object itself.
     */
    @Metadata(generated = true)
    public PetUpdate setAge(Integer age) {
        this.age = age;
        return this;
    }

    /**
     * Get the ownerId property: The ownerId property.
     * 
     * @return the ownerId value.
     */
    @Metadata(generated = true)
    public Long getOwnerId() {
        return this.ownerId;
    }

    /**
     * Set the ownerId property: The ownerId property.
     * 
     * @param ownerId the ownerId value to set.
     * @return the PetUpdate object itself.
     */
    @Metadata(generated = true)
    public PetUpdate setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
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
        jsonWriter.writeStringField("tag", this.tag);
        jsonWriter.writeNumberField("age", this.age);
        jsonWriter.writeNumberField("ownerId", this.ownerId);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PetUpdate from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PetUpdate if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IOException If an error occurs while reading the PetUpdate.
     */
    @Metadata(generated = true)
    public static PetUpdate fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            PetUpdate deserializedPetUpdate = new PetUpdate();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    deserializedPetUpdate.name = reader.getString();
                } else if ("tag".equals(fieldName)) {
                    deserializedPetUpdate.tag = reader.getString();
                } else if ("age".equals(fieldName)) {
                    deserializedPetUpdate.age = reader.getNullable(JsonReader::getInt);
                } else if ("ownerId".equals(fieldName)) {
                    deserializedPetUpdate.ownerId = reader.getNullable(JsonReader::getLong);
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedPetUpdate;
        });
    }
}
