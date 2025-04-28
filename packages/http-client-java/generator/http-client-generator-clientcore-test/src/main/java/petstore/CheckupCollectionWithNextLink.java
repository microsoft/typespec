package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * Paged response of Checkup items.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class CheckupCollectionWithNextLink implements JsonSerializable<CheckupCollectionWithNextLink> {
    /*
     * The items on this page
     */
    @Metadata(generated = true)
    private final List<Checkup> value;

    /*
     * The link to the next page of items
     */
    @Metadata(generated = true)
    private String nextLink;

    /**
     * Creates an instance of CheckupCollectionWithNextLink class.
     * 
     * @param value the value value to set.
     */
    @Metadata(generated = true)
    private CheckupCollectionWithNextLink(List<Checkup> value) {
        this.value = value;
    }

    /**
     * Get the value property: The items on this page.
     * 
     * @return the value value.
     */
    @Metadata(generated = true)
    public List<Checkup> getValue() {
        return this.value;
    }

    /**
     * Get the nextLink property: The link to the next page of items.
     * 
     * @return the nextLink value.
     */
    @Metadata(generated = true)
    public String getNextLink() {
        return this.nextLink;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("value", this.value, (writer, element) -> writer.writeJson(element));
        jsonWriter.writeStringField("nextLink", this.nextLink);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of CheckupCollectionWithNextLink from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of CheckupCollectionWithNextLink if the JsonReader was pointing to an instance of it, or null
     * if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the CheckupCollectionWithNextLink.
     */
    @Metadata(generated = true)
    public static CheckupCollectionWithNextLink fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<Checkup> value = null;
            String nextLink = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.readArray(reader1 -> Checkup.fromJson(reader1));
                } else if ("nextLink".equals(fieldName)) {
                    nextLink = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            CheckupCollectionWithNextLink deserializedCheckupCollectionWithNextLink
                = new CheckupCollectionWithNextLink(value);
            deserializedCheckupCollectionWithNextLink.nextLink = nextLink;

            return deserializedCheckupCollectionWithNextLink;
        });
    }
}
