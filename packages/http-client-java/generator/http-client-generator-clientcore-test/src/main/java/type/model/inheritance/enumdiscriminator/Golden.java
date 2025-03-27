package type.model.inheritance.enumdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Golden dog model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Golden extends Dog {
    /*
     * discriminator property
     */
    @Metadata(generated = true)
    private DogKind kind = DogKind.GOLDEN;

    /**
     * Creates an instance of Golden class.
     * 
     * @param weight the weight value to set.
     */
    @Metadata(generated = true)
    public Golden(int weight) {
        super(weight);
    }

    /**
     * Get the kind property: discriminator property.
     * 
     * @return the kind value.
     */
    @Metadata(generated = true)
    @Override
    public DogKind getKind() {
        return this.kind;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("weight", getWeight());
        jsonWriter.writeStringField("kind", this.kind == null ? null : this.kind.getValue());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Golden from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Golden if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Golden.
     */
    @Metadata(generated = true)
    public static Golden fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int weight = 0;
            DogKind kind = DogKind.GOLDEN;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("weight".equals(fieldName)) {
                    weight = reader.getInt();
                } else if ("kind".equals(fieldName)) {
                    kind = DogKind.fromValue(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            Golden deserializedGolden = new Golden(weight);
            deserializedGolden.kind = kind;

            return deserializedGolden;
        });
    }
}
