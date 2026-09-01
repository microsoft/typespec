package type.model.inheritance.singlediscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * A discriminated model with no defined subtypes. The discriminator is declared but no models extend it.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Fish implements JsonSerializable<Fish> {
    /*
     * The kind property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String kind = "Fish";

    /*
     * The size property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final int size;

    /**
     * Creates an instance of Fish class.
     * 
     * @param size the size value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Fish(int size) {
        this.size = size;
    }

    /**
     * Get the kind property: The kind property.
     * 
     * @return the kind value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getKind() {
        return this.kind;
    }

    /**
     * Get the size property: The size property.
     * 
     * @return the size value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public int getSize() {
        return this.size;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("size", this.size);
        jsonWriter.writeStringField("kind", this.kind);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Fish from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Fish if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Fish.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Fish fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int size = 0;
            String kind = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("size".equals(fieldName)) {
                    size = reader.getInt();
                } else if ("kind".equals(fieldName)) {
                    kind = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Fish deserializedFish = new Fish(size);
            deserializedFish.kind = kind;

            return deserializedFish;
        });
    }
}
