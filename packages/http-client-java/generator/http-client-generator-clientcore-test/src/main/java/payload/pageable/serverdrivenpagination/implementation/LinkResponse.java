package payload.pageable.serverdrivenpagination.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;
import payload.pageable.Pet;

/**
 * The LinkResponse model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class LinkResponse implements JsonSerializable<LinkResponse> {
    /*
     * The pets property.
     */
    @Metadata(generated = true)
    private final List<Pet> pets;

    /*
     * The next property.
     */
    @Metadata(generated = true)
    private String next;

    /**
     * Creates an instance of LinkResponse class.
     * 
     * @param pets the pets value to set.
     */
    @Metadata(generated = true)
    private LinkResponse(List<Pet> pets) {
        this.pets = pets;
    }

    /**
     * Get the pets property: The pets property.
     * 
     * @return the pets value.
     */
    @Metadata(generated = true)
    public List<Pet> getPets() {
        return this.pets;
    }

    /**
     * Get the next property: The next property.
     * 
     * @return the next value.
     */
    @Metadata(generated = true)
    public String getNext() {
        return this.next;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("pets", this.pets, (writer, element) -> writer.writeJson(element));
        jsonWriter.writeStringField("next", this.next);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of LinkResponse from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of LinkResponse if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the LinkResponse.
     */
    @Metadata(generated = true)
    public static LinkResponse fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<Pet> pets = null;
            String next = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("pets".equals(fieldName)) {
                    pets = reader.readArray(reader1 -> Pet.fromJson(reader1));
                } else if ("next".equals(fieldName)) {
                    next = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            LinkResponse deserializedLinkResponse = new LinkResponse(pets);
            deserializedLinkResponse.next = next;

            return deserializedLinkResponse;
        });
    }
}
