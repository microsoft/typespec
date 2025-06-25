package type.model.inheritance.nesteddiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * The second level model in polymorphic multiple levels inheritance which contains references to other polymorphic
 * instances.
 */
@Metadata(properties = { MetadataProperties.FLUENT })
public final class Salmon extends Fish {
    /*
     * Discriminator property for Fish.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String kind = "salmon";

    /*
     * The friends property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private List<Fish> friends;

    /*
     * The hate property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Map<String, Fish> hate;

    /*
     * The partner property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Fish partner;

    /**
     * Creates an instance of Salmon class.
     * 
     * @param age the age value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Salmon(int age) {
        super(age);
    }

    /**
     * Get the kind property: Discriminator property for Fish.
     * 
     * @return the kind value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public String getKind() {
        return this.kind;
    }

    /**
     * Get the friends property: The friends property.
     * 
     * @return the friends value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<Fish> getFriends() {
        return this.friends;
    }

    /**
     * Set the friends property: The friends property.
     * 
     * @param friends the friends value to set.
     * @return the Salmon object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Salmon setFriends(List<Fish> friends) {
        this.friends = friends;
        return this;
    }

    /**
     * Get the hate property: The hate property.
     * 
     * @return the hate value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Map<String, Fish> getHate() {
        return this.hate;
    }

    /**
     * Set the hate property: The hate property.
     * 
     * @param hate the hate value to set.
     * @return the Salmon object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Salmon setHate(Map<String, Fish> hate) {
        this.hate = hate;
        return this;
    }

    /**
     * Get the partner property: The partner property.
     * 
     * @return the partner value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Fish getPartner() {
        return this.partner;
    }

    /**
     * Set the partner property: The partner property.
     * 
     * @param partner the partner value to set.
     * @return the Salmon object itself.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Salmon setPartner(Fish partner) {
        this.partner = partner;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("age", getAge());
        jsonWriter.writeStringField("kind", this.kind);
        jsonWriter.writeArrayField("friends", this.friends, (writer, element) -> writer.writeJson(element));
        jsonWriter.writeMapField("hate", this.hate, (writer, element) -> writer.writeJson(element));
        jsonWriter.writeJsonField("partner", this.partner);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Salmon from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Salmon if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Salmon.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Salmon fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int age = 0;
            String kind = "salmon";
            List<Fish> friends = null;
            Map<String, Fish> hate = null;
            Fish partner = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("age".equals(fieldName)) {
                    age = reader.getInt();
                } else if ("kind".equals(fieldName)) {
                    kind = reader.getString();
                } else if ("friends".equals(fieldName)) {
                    friends = reader.readArray(reader1 -> Fish.fromJson(reader1));
                } else if ("hate".equals(fieldName)) {
                    hate = reader.readMap(reader1 -> Fish.fromJson(reader1));
                } else if ("partner".equals(fieldName)) {
                    partner = Fish.fromJson(reader);
                } else {
                    reader.skipChildren();
                }
            }
            Salmon deserializedSalmon = new Salmon(age);
            deserializedSalmon.kind = kind;
            deserializedSalmon.friends = friends;
            deserializedSalmon.hate = hate;
            deserializedSalmon.partner = partner;

            return deserializedSalmon;
        });
    }
}
