package type.union.discriminated.extendsnamespace.customdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The Dog2 model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Dog2 extends PetBase2 {
    /*
     * Discriminator property for PetBase.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String petType = "canine";

    /*
     * The bark property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final boolean bark;

    /**
     * Creates an instance of Dog2 class.
     * 
     * @param name the name value to set.
     * @param bark the bark value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Dog2(String name, boolean bark) {
        super(name);
        this.bark = bark;
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
        jsonWriter.writeStringField("petType", this.petType);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Dog2 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Dog2 if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Dog2.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Dog2 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            boolean bark = false;
            String petType = "canine";
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("bark".equals(fieldName)) {
                    bark = reader.getBoolean();
                } else if ("petType".equals(fieldName)) {
                    petType = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Dog2 deserializedDog2 = new Dog2(name, bark);
            deserializedDog2.petType = petType;

            return deserializedDog2;
        });
    }
}
