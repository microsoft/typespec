package parameters.spread.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The SpreadAsRequestParameterRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class SpreadAsRequestParameterRequest implements JsonSerializable<SpreadAsRequestParameterRequest> {
    /*
     * The name property.
     */
    @Metadata(generated = true)
    private final String name;

    /**
     * Creates an instance of SpreadAsRequestParameterRequest class.
     * 
     * @param name the name value to set.
     */
    @Metadata(generated = true)
    public SpreadAsRequestParameterRequest(String name) {
        this.name = name;
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
        jsonWriter.writeStringField("name", this.name);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SpreadAsRequestParameterRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SpreadAsRequestParameterRequest if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SpreadAsRequestParameterRequest.
     */
    @Metadata(generated = true)
    public static SpreadAsRequestParameterRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new SpreadAsRequestParameterRequest(name);
        });
    }
}
