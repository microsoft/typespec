package payload.pageable.serverdrivenpagination.continuationtoken;

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
 * The RequestQueryNestedResponseBodyResponseNestedItems model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class RequestQueryNestedResponseBodyResponseNestedItems
    implements JsonSerializable<RequestQueryNestedResponseBodyResponseNestedItems> {

    /*
     * The pets property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<Pet> pets;

    /**
     * Creates an instance of RequestQueryNestedResponseBodyResponseNestedItems class.
     *
     * @param pets the pets value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private RequestQueryNestedResponseBodyResponseNestedItems(List<Pet> pets) {
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
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("pets", this.pets, (writer, element) -> writer.writeJson(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of RequestQueryNestedResponseBodyResponseNestedItems from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of RequestQueryNestedResponseBodyResponseNestedItems if the JsonReader was pointing to an
     * instance of it, or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the RequestQueryNestedResponseBodyResponseNestedItems.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static RequestQueryNestedResponseBodyResponseNestedItems fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<Pet> pets = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("pets".equals(fieldName)) {
                    pets = reader.readArray(reader1 -> Pet.fromJson(reader1));
                } else {
                    reader.skipChildren();
                }
            }
            return new RequestQueryNestedResponseBodyResponseNestedItems(pets);
        });
    }
}
