package payload.pageable.serverdrivenpagination.alternateinitialverb;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The Filter model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Filter implements JsonSerializable<Filter> {
    /*
     * The filter property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String filter;

    /**
     * Creates an instance of Filter class.
     * 
     * @param filter the filter value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Filter(String filter) {
        this.filter = filter;
    }

    /**
     * Get the filter property: The filter property.
     * 
     * @return the filter value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getFilter() {
        return this.filter;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("filter", this.filter);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Filter from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Filter if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Filter.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Filter fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String filter = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("filter".equals(fieldName)) {
                    filter = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new Filter(filter);
        });
    }
}
