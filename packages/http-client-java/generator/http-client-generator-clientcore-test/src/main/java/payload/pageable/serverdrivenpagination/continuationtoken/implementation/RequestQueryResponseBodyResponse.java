package payload.pageable.serverdrivenpagination.continuationtoken.implementation;

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
 * The RequestQueryResponseBodyResponse model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class RequestQueryResponseBodyResponse implements JsonSerializable<RequestQueryResponseBodyResponse> {
    /*
     * The pets property.
     */
    @Metadata(generated = true)
    private final List<Pet> pets;

    /*
     * The nextToken property.
     */
    @Metadata(generated = true)
    private String nextToken;

    /**
     * Creates an instance of RequestQueryResponseBodyResponse class.
     * 
     * @param pets the pets value to set.
     */
    @Metadata(generated = true)
    private RequestQueryResponseBodyResponse(List<Pet> pets) {
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
     * Get the nextToken property: The nextToken property.
     * 
     * @return the nextToken value.
     */
    @Metadata(generated = true)
    public String getNextToken() {
        return this.nextToken;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("pets", this.pets, (writer, element) -> writer.writeJson(element));
        jsonWriter.writeStringField("nextToken", this.nextToken);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of RequestQueryResponseBodyResponse from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of RequestQueryResponseBodyResponse if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the RequestQueryResponseBodyResponse.
     */
    @Metadata(generated = true)
    public static RequestQueryResponseBodyResponse fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<Pet> pets = null;
            String nextToken = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("pets".equals(fieldName)) {
                    pets = reader.readArray(reader1 -> Pet.fromJson(reader1));
                } else if ("nextToken".equals(fieldName)) {
                    nextToken = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            RequestQueryResponseBodyResponse deserializedRequestQueryResponseBodyResponse
                = new RequestQueryResponseBodyResponse(pets);
            deserializedRequestQueryResponseBodyResponse.nextToken = nextToken;

            return deserializedRequestQueryResponseBodyResponse;
        });
    }
}
