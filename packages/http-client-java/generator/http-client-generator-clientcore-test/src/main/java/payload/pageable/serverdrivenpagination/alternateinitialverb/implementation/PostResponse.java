package payload.pageable.serverdrivenpagination.alternateinitialverb.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;
import payload.pageable.Pet;

/**
 * The PostResponse model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class PostResponse implements JsonSerializable<PostResponse> {
    /*
     * The pets property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<Pet> pets;

    /*
     * The next property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String next;

    /**
     * Creates an instance of PostResponse class.
     * 
     * @param pets the pets value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private PostResponse(List<Pet> pets) {
        this.pets = pets;
    }

    /**
     * Get the pets property: The pets property.
     * 
     * @return the pets value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<Pet> getPets() {
        return this.pets;
    }

    /**
     * Get the next property: The next property.
     * 
     * @return the next value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getNext() {
        return this.next;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("pets", this.pets, (writer, element) -> writer.writeJson(element));
        jsonWriter.writeStringField("next", this.next);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PostResponse from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PostResponse if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the PostResponse.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static PostResponse fromJson(JsonReader jsonReader) throws IOException {
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
            PostResponse deserializedPostResponse = new PostResponse(pets);
            deserializedPostResponse.next = next;

            return deserializedPostResponse;
        });
    }
}
