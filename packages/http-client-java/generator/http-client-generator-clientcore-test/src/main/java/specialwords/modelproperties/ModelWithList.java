package specialwords.modelproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The ModelWithList model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class ModelWithList implements JsonSerializable<ModelWithList> {
    /*
     * The list property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String list;

    /**
     * Creates an instance of ModelWithList class.
     * 
     * @param list the list value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithList(String list) {
        this.list = list;
    }

    /**
     * Get the list property: The list property.
     * 
     * @return the list value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getList() {
        return this.list;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("list", this.list);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of ModelWithList from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ModelWithList if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the ModelWithList.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static ModelWithList fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String list = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("list".equals(fieldName)) {
                    list = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new ModelWithList(list);
        });
    }
}
