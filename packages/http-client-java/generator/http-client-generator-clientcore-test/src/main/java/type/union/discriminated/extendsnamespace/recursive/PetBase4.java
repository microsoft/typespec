package type.union.discriminated.extendsnamespace.recursive;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * The PetBase4 model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public class PetBase4 implements JsonSerializable<PetBase4> {
    /*
     * Discriminator property for PetBase.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String kind = "PetBase4";

    /*
     * The name property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final String name;

    /*
     * The friend property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private PetBase4 friend;

    /*
     * The friends property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private List<PetBase4> friends;

    /*
     * The lookup property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Map<String, PetBase4> lookup;

    /**
     * Creates an instance of PetBase4 class.
     * 
     * @param name the name value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetBase4(String name) {
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
     * Get the friend property: The friend property.
     * 
     * @return the friend value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetBase4 getFriend() {
        return this.friend;
    }

    /**
     * Set the friend property: The friend property.
     * 
     * @param friend the friend value to set.
     * @return the PetBase4 object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetBase4 setFriend(PetBase4 friend) {
        this.friend = friend;
        return this;
    }

    /**
     * Get the friends property: The friends property.
     * 
     * @return the friends value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<PetBase4> getFriends() {
        return this.friends;
    }

    /**
     * Set the friends property: The friends property.
     * 
     * @param friends the friends value to set.
     * @return the PetBase4 object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetBase4 setFriends(List<PetBase4> friends) {
        this.friends = friends;
        return this;
    }

    /**
     * Get the lookup property: The lookup property.
     * 
     * @return the lookup value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Map<String, PetBase4> getLookup() {
        return this.lookup;
    }

    /**
     * Set the lookup property: The lookup property.
     * 
     * @param lookup the lookup value to set.
     * @return the PetBase4 object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetBase4 setLookup(Map<String, PetBase4> lookup) {
        this.lookup = lookup;
        return this;
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
        jsonWriter.writeJsonField("friend", this.friend);
        jsonWriter.writeArrayField("friends", this.friends, (writer, element) -> writer.writeJson(element));
        jsonWriter.writeMapField("lookup", this.lookup, (writer, element) -> writer.writeJson(element));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of PetBase4 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of PetBase4 if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the PetBase4.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static PetBase4 fromJson(JsonReader jsonReader) throws IOException {
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
                    return Cat4.fromJson(readerToUse.reset());
                } else if ("dog".equals(discriminatorValue)) {
                    return Dog4.fromJson(readerToUse.reset());
                } else {
                    return fromJsonKnownDiscriminator(readerToUse.reset());
                }
            }
        });
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    static PetBase4 fromJsonKnownDiscriminator(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            String kind = null;
            PetBase4 friend = null;
            List<PetBase4> friends = null;
            Map<String, PetBase4> lookup = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("kind".equals(fieldName)) {
                    kind = reader.getString();
                } else if ("friend".equals(fieldName)) {
                    friend = PetBase4.fromJson(reader);
                } else if ("friends".equals(fieldName)) {
                    friends = reader.readArray(reader1 -> PetBase4.fromJson(reader1));
                } else if ("lookup".equals(fieldName)) {
                    lookup = reader.readMap(reader1 -> PetBase4.fromJson(reader1));
                } else {
                    reader.skipChildren();
                }
            }
            PetBase4 deserializedPetBase4 = new PetBase4(name);
            deserializedPetBase4.kind = kind;
            deserializedPetBase4.friend = friend;
            deserializedPetBase4.friends = friends;
            deserializedPetBase4.lookup = lookup;

            return deserializedPetBase4;
        });
    }
}
