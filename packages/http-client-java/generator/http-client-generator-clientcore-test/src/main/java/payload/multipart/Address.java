package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The Address model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Address implements JsonSerializable<Address> {
    /*
     * The city property.
     */
    @Metadata(generated = true)
    private final String city;

    /**
     * Creates an instance of Address class.
     * 
     * @param city the city value to set.
     */
    @Metadata(generated = true)
    public Address(String city) {
        this.city = city;
    }

    /**
     * Get the city property: The city property.
     * 
     * @return the city value.
     */
    @Metadata(generated = true)
    public String getCity() {
        return this.city;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("city", this.city);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Address from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Address if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Address.
     */
    @Metadata(generated = true)
    public static Address fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String city = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("city".equals(fieldName)) {
                    city = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new Address(city);
        });
    }
}
