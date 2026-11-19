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
 * The Cat4 model.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class Cat4 extends PetBase4 {
    /*
     * Discriminator property for PetBase.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String kind = "cat";

    /*
     * The meow property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final boolean meow;

    /**
     * Creates an instance of Cat4 class.
     * 
     * @param name the name value to set.
     * @param meow the meow value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Cat4(String name, boolean meow) {
        super(name);
        this.meow = meow;
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
    public Cat4 setFriend(PetBase4 friend) {
        super.setFriend(friend);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public Cat4 setFriends(List<PetBase4> friends) {
        super.setFriends(friends);
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public Cat4 setLookup(Map<String, PetBase4> lookup) {
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
        jsonWriter.writeBooleanField("meow", this.meow);
        jsonWriter.writeStringField("kind", this.kind);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Cat4 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Cat4 if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Cat4.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Cat4 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            PetBase4 friend = null;
            List<PetBase4> friends = null;
            Map<String, PetBase4> lookup = null;
            boolean meow = false;
            String kind = "cat";
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
                } else if ("meow".equals(fieldName)) {
                    meow = reader.getBoolean();
                } else if ("kind".equals(fieldName)) {
                    kind = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Cat4 deserializedCat4 = new Cat4(name, meow);
            deserializedCat4.setFriend(friend);
            deserializedCat4.setFriends(friends);
            deserializedCat4.setLookup(lookup);
            deserializedCat4.kind = kind;

            return deserializedCat4;
        });
    }
}
