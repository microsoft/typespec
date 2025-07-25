package payload.pageable.serverdrivenpagination.continuationtoken.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import payload.pageable.serverdrivenpagination.continuationtoken.RequestHeaderNestedResponseBodyResponseNestedItems;
import payload.pageable.serverdrivenpagination.continuationtoken.RequestHeaderNestedResponseBodyResponseNestedNext;

/**
 * The RequestHeaderNestedResponseBodyResponse model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class RequestHeaderNestedResponseBodyResponse
    implements JsonSerializable<RequestHeaderNestedResponseBodyResponse> {
    /*
     * The nestedItems property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final RequestHeaderNestedResponseBodyResponseNestedItems nestedItems;

    /*
     * The nestedNext property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private RequestHeaderNestedResponseBodyResponseNestedNext nestedNext;

    /**
     * Creates an instance of RequestHeaderNestedResponseBodyResponse class.
     * 
     * @param nestedItems the nestedItems value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private RequestHeaderNestedResponseBodyResponse(RequestHeaderNestedResponseBodyResponseNestedItems nestedItems) {
        this.nestedItems = nestedItems;
    }

    /**
     * Get the nestedItems property: The nestedItems property.
     * 
     * @return the nestedItems value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public RequestHeaderNestedResponseBodyResponseNestedItems getNestedItems() {
        return this.nestedItems;
    }

    /**
     * Get the nestedNext property: The nestedNext property.
     * 
     * @return the nestedNext value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public RequestHeaderNestedResponseBodyResponseNestedNext getNestedNext() {
        return this.nestedNext;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeJsonField("nestedItems", this.nestedItems);
        jsonWriter.writeJsonField("nestedNext", this.nestedNext);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of RequestHeaderNestedResponseBodyResponse from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of RequestHeaderNestedResponseBodyResponse if the JsonReader was pointing to an instance of
     * it, or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the RequestHeaderNestedResponseBodyResponse.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static RequestHeaderNestedResponseBodyResponse fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            RequestHeaderNestedResponseBodyResponseNestedItems nestedItems = null;
            RequestHeaderNestedResponseBodyResponseNestedNext nestedNext = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("nestedItems".equals(fieldName)) {
                    nestedItems = RequestHeaderNestedResponseBodyResponseNestedItems.fromJson(reader);
                } else if ("nestedNext".equals(fieldName)) {
                    nestedNext = RequestHeaderNestedResponseBodyResponseNestedNext.fromJson(reader);
                } else {
                    reader.skipChildren();
                }
            }
            RequestHeaderNestedResponseBodyResponse deserializedRequestHeaderNestedResponseBodyResponse
                = new RequestHeaderNestedResponseBodyResponse(nestedItems);
            deserializedRequestHeaderNestedResponseBodyResponse.nestedNext = nestedNext;

            return deserializedRequestHeaderNestedResponseBodyResponse;
        });
    }
}
