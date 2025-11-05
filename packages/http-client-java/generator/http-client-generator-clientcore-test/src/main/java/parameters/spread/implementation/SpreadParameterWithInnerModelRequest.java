package parameters.spread.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The SpreadParameterWithInnerModelRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class SpreadParameterWithInnerModelRequest
    implements JsonSerializable<SpreadParameterWithInnerModelRequest> {

    /*
     * The name property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String name;

    /**
     * Creates an instance of SpreadParameterWithInnerModelRequest class.
     *
     * @param name the name value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadParameterWithInnerModelRequest(String name) {
        this.name = name;
    }

    /**
     * Get the name property: The name property.
     *
     * @return the name value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getName() {
        return this.name;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", this.name);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SpreadParameterWithInnerModelRequest from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of SpreadParameterWithInnerModelRequest if the JsonReader was pointing to an instance of it,
     * or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SpreadParameterWithInnerModelRequest.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static SpreadParameterWithInnerModelRequest fromJson(JsonReader jsonReader) throws IOException {
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
            return new SpreadParameterWithInnerModelRequest(name);
        });
    }
}
