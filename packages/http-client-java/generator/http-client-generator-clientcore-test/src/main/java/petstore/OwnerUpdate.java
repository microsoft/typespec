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
public final class OwnerUpdate implements JsonSerializable<OwnerUpdate> {
    /*
     * The name property.
     */
    @Metadata(generated = true)
    private String name;

    /*
     * The age property.
     */
    @Metadata(generated = true)
    private Integer age;

    /**
     * Creates an instance of OwnerUpdate class.
     */
    @Metadata(generated = true)
    public OwnerUpdate() {
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
     * @return the OwnerUpdate object itself.
     */
    @Metadata(generated = true)
    public OwnerUpdate setName(String name) {
        this.name = name;
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
     * @return the OwnerUpdate object itself.
     */
    @Metadata(generated = true)
    public OwnerUpdate setAge(Integer age) {
        this.age = age;
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
        jsonWriter.writeNumberField("age", this.age);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of OwnerUpdate from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of OwnerUpdate if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the OwnerUpdate.
     */
    @Metadata(generated = true)
    public static OwnerUpdate fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            OwnerUpdate deserializedOwnerUpdate = new OwnerUpdate();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    deserializedOwnerUpdate.name = reader.getString();
                } else if ("age".equals(fieldName)) {
                    deserializedOwnerUpdate.age = reader.getNullable(JsonReader::getInt);
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedOwnerUpdate;
        });
    }
}
