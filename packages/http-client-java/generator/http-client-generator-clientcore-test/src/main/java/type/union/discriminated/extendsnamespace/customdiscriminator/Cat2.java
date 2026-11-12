package type.union.discriminated.extendsnamespace.customdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The Cat2 model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Cat2 extends PetBase2 {
    /*
     * Discriminator property for PetBase.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String petType = "feline";

    /*
     * The meow property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final boolean meow;

    /**
     * Creates an instance of Cat2 class.
     * 
     * @param name the name value to set.
     * @param meow the meow value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Cat2(String name, boolean meow) {
        super(name);
        this.meow = meow;
    }

    /**
     * Get the petType property: Discriminator property for PetBase.
     * 
     * @return the petType value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public String getPetType() {
        return this.petType;
    }

    /**
     * Get the meow property: The meow property.
     * 
     * @return the meow value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public boolean isMeow() {
        return this.meow;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", getName());
        jsonWriter.writeBooleanField("meow", this.meow);
        jsonWriter.writeStringField("petType", this.petType);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Cat2 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Cat2 if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Cat2.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Cat2 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            boolean meow = false;
            String petType = "feline";
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("meow".equals(fieldName)) {
                    meow = reader.getBoolean();
                } else if ("petType".equals(fieldName)) {
                    petType = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Cat2 deserializedCat2 = new Cat2(name, meow);
            deserializedCat2.petType = petType;

            return deserializedCat2;
        });
    }
}
