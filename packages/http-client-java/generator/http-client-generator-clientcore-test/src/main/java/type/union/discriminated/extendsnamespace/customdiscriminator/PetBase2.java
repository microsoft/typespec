package type.union.discriminated.extendsnamespace.customdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The PetBase2 model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public class PetBase2 implements JsonSerializable<PetBase2> {
    /*
     * Discriminator property for PetBase.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String petType = "PetBase2";

    /*
     * The name property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String name;

    /**
     * Creates an instance of PetBase2 class.
     * 
     * @param name the name value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetBase2(String name) {
        this.name = name;
    }

    /**
     * Get the petType property: Discriminator property for PetBase.
     * 
     * @return the petType value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getPetType() {
        return this.petType;
    }

    /**
     * Get the name property: The name property.
     * 
     * @return the name value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getName() {
        return this.name;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", this.name);
        jsonWriter.writeStringField("petType", this.petType);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PetBase2 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PetBase2 if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the PetBase2.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static PetBase2 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String discriminatorValue = null;
            try (JsonReader readerToUse = reader.bufferObject()) {
                readerToUse.nextToken(); // Prepare for reading
                while (readerToUse.nextToken() != JsonToken.END_OBJECT) {
                    String fieldName = readerToUse.getFieldName();
                    readerToUse.nextToken();
                    if ("petType".equals(fieldName)) {
                        discriminatorValue = readerToUse.getString();
                        break;
                    } else {
                        readerToUse.skipChildren();
                    }
                }
                // Use the discriminator value to determine which subtype should be deserialized.
                if ("feline".equals(discriminatorValue)) {
                    return Cat2.fromJson(readerToUse.reset());
                } else if ("canine".equals(discriminatorValue)) {
                    return Dog2.fromJson(readerToUse.reset());
                } else {
                    return fromJsonKnownDiscriminator(readerToUse.reset());
                }
            }
        });
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    static PetBase2 fromJsonKnownDiscriminator(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            String petType = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("petType".equals(fieldName)) {
                    petType = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            PetBase2 deserializedPetBase2 = new PetBase2(name);
            deserializedPetBase2.petType = petType;

            return deserializedPetBase2;
        });
    }
}
