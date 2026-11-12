package streaming.sse.retrieve;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The RetrievalRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class RetrievalRequest implements JsonSerializable<RetrievalRequest> {
    /*
     * The query property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String query;

    /**
     * Creates an instance of RetrievalRequest class.
     * 
     * @param query the query value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public RetrievalRequest(String query) {
        this.query = query;
    }

    /**
     * Get the query property: The query property.
     * 
     * @return the query value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getQuery() {
        return this.query;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("query", this.query);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of RetrievalRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of RetrievalRequest if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the RetrievalRequest.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static RetrievalRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String query = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("query".equals(fieldName)) {
                    query = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new RetrievalRequest(query);
        });
    }
}
