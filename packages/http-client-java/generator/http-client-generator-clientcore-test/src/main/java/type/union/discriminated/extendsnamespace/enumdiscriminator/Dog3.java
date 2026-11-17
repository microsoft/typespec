package type.union.discriminated.extendsnamespace.enumdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The Dog3 model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Dog3 extends PetBase3 {
    /*
     * The kind property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private PetKind kind = PetKind.DOG;

    /*
     * The bark property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final boolean bark;

    /**
     * Creates an instance of Dog3 class.
     * 
     * @param name the name value to set.
     * @param bark the bark value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Dog3(String name, boolean bark) {
        super(name);
        this.bark = bark;
    }

    /**
     * Get the kind property: The kind property.
     * 
     * @return the kind value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public PetKind getKind() {
        return this.kind;
    }

    /**
     * Get the bark property: The bark property.
     * 
     * @return the bark value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public boolean isBark() {
        return this.bark;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", getName());
        jsonWriter.writeBooleanField("bark", this.bark);
        jsonWriter.writeStringField("kind", this.kind == null ? null : this.kind.toString());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Dog3 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Dog3 if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Dog3.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Dog3 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            boolean bark = false;
            PetKind kind = PetKind.DOG;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("bark".equals(fieldName)) {
                    bark = reader.getBoolean();
                } else if ("kind".equals(fieldName)) {
                    kind = PetKind.fromString(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            Dog3 deserializedDog3 = new Dog3(name, bark);
            deserializedDog3.kind = kind;

            return deserializedDog3;
        });
    }
}
