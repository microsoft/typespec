package type.union.discriminated.extendsnamespace.recursive;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * The Dog4 model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class Dog4 extends PetBase4 {
    /*
     * Discriminator property for PetBase.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String kind = "dog";

    /*
     * The bark property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final boolean bark;

    /**
     * Creates an instance of Dog4 class.
     * 
     * @param name the name value to set.
     * @param bark the bark value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Dog4(String name, boolean bark) {
        super(name);
        this.bark = bark;
    }

    /**
     * Get the kind property: Discriminator property for PetBase.
     * 
     * @return the kind value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public String getKind() {
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
    public Dog4 setFriend(PetBase4 friend) {
        super.setFriend(friend);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public Dog4 setFriends(List<PetBase4> friends) {
        super.setFriends(friends);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public Dog4 setLookup(Map<String, PetBase4> lookup) {
        super.setLookup(lookup);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", getName());
        jsonWriter.writeJsonField("friend", getFriend());
        jsonWriter.writeArrayField("friends", getFriends(), (writer, element) -> writer.writeJson(element));
        jsonWriter.writeMapField("lookup", getLookup(), (writer, element) -> writer.writeJson(element));
        jsonWriter.writeBooleanField("bark", this.bark);
        jsonWriter.writeStringField("kind", this.kind);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Dog4 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Dog4 if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Dog4.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Dog4 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            PetBase4 friend = null;
            List<PetBase4> friends = null;
            Map<String, PetBase4> lookup = null;
            boolean bark = false;
            String kind = "dog";
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("friend".equals(fieldName)) {
                    friend = PetBase4.fromJson(reader);
                } else if ("friends".equals(fieldName)) {
                    friends = reader.readArray(reader1 -> PetBase4.fromJson(reader1));
                } else if ("lookup".equals(fieldName)) {
                    lookup = reader.readMap(reader1 -> PetBase4.fromJson(reader1));
                } else if ("bark".equals(fieldName)) {
                    bark = reader.getBoolean();
                } else if ("kind".equals(fieldName)) {
                    kind = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Dog4 deserializedDog4 = new Dog4(name, bark);
            deserializedDog4.setFriend(friend);
            deserializedDog4.setFriends(friends);
            deserializedDog4.setLookup(lookup);
            deserializedDog4.kind = kind;

            return deserializedDog4;
        });
    }
}
