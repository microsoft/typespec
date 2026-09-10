package payload.pageable.serverdrivenpagination.continuationtoken;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The RequestHeaderNestedResponseBodyResponseNestedNext model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class RequestHeaderNestedResponseBodyResponseNestedNext
    implements JsonSerializable<RequestHeaderNestedResponseBodyResponseNestedNext> {

    /*
     * The nextToken property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String nextToken;

    /**
     * Creates an instance of RequestHeaderNestedResponseBodyResponseNestedNext class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private RequestHeaderNestedResponseBodyResponseNestedNext() {
    }

    /**
     * Get the nextToken property: The nextToken property.
     *
     * @return the nextToken value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getNextToken() {
        return this.nextToken;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("nextToken", this.nextToken);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of RequestHeaderNestedResponseBodyResponseNestedNext from the JsonReader.
     *
     * @param jsonReader The JsonReader being read.
     * @return An instance of RequestHeaderNestedResponseBodyResponseNestedNext if the JsonReader was pointing to an
     * instance of it, or null if it was pointing to JSON null.
     * @throws IOException If an error occurs while reading the RequestHeaderNestedResponseBodyResponseNestedNext.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static RequestHeaderNestedResponseBodyResponseNestedNext fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            RequestHeaderNestedResponseBodyResponseNestedNext deserializedRequestHeaderNestedResponseBodyResponseNestedNext
                = new RequestHeaderNestedResponseBodyResponseNestedNext();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();
                if ("nextToken".equals(fieldName)) {
                    deserializedRequestHeaderNestedResponseBodyResponseNestedNext.nextToken = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return deserializedRequestHeaderNestedResponseBodyResponseNestedNext;
        });
    }
}
