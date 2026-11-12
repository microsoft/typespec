package type.union.discriminated.extendsnamespace.injecteddiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The PetBase1 model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public class PetBase1 implements JsonSerializable<PetBase1> {
    /*
     * Discriminator property for PetBase.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String kind = "PetBase1";

    /*
     * The name property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String name;

    /**
     * Creates an instance of PetBase1 class.
     * 
     * @param name the name value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetBase1(String name) {
        this.name = name;
    }

    /**
     * Get the kind property: Discriminator property for PetBase.
     * 
     * @return the kind value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public String getKind() {
        return this.kind;
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
        jsonWriter.writeStringField("kind", this.kind);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PetBase1 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PetBase1 if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the PetBase1.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static PetBase1 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String discriminatorValue = null;
            try (JsonReader readerToUse = reader.bufferObject()) {
                readerToUse.nextToken(); // Prepare for reading
                while (readerToUse.nextToken() != JsonToken.END_OBJECT) {
                    String fieldName = readerToUse.getFieldName();
                    readerToUse.nextToken();
                    if ("kind".equals(fieldName)) {
                        discriminatorValue = readerToUse.getString();
                        break;
                    } else {
                        readerToUse.skipChildren();
                    }
                }
                // Use the discriminator value to determine which subtype should be deserialized.
                if ("cat".equals(discriminatorValue)) {
                    return Cat1.fromJson(readerToUse.reset());
                } else if ("dog".equals(discriminatorValue)) {
                    return Dog1.fromJson(readerToUse.reset());
                } else {
                    return fromJsonKnownDiscriminator(readerToUse.reset());
                }
            }
        });
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    static PetBase1 fromJsonKnownDiscriminator(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            String kind = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("kind".equals(fieldName)) {
                    kind = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            PetBase1 deserializedPetBase1 = new PetBase1(name);
            deserializedPetBase1.kind = kind;

            return deserializedPetBase1;
        });
    }
}
