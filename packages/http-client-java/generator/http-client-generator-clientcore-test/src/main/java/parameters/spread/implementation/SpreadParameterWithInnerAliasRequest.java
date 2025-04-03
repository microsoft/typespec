package parameters.spread.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The SpreadParameterWithInnerAliasRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class SpreadParameterWithInnerAliasRequest
    implements JsonSerializable<SpreadParameterWithInnerAliasRequest> {
    /*
     * name of the Thing
     */
    @Metadata(generated = true)
    private final String name;

    /*
     * age of the Thing
     */
    @Metadata(generated = true)
    private final int age;

    /**
     * Creates an instance of SpreadParameterWithInnerAliasRequest class.
     * 
     * @param name the name value to set.
     * @param age the age value to set.
     */
    @Metadata(generated = true)
    public SpreadParameterWithInnerAliasRequest(String name, int age) {
        this.name = name;
        this.age = age;
    }

    /**
     * Get the name property: name of the Thing.
     * 
     * @return the name value.
     */
    @Metadata(generated = true)
    public String getName() {
        return this.name;
    }

    /**
     * Get the age property: age of the Thing.
     * 
     * @return the age value.
     */
    @Metadata(generated = true)
    public int getAge() {
        return this.age;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", this.name);
        jsonWriter.writeIntField("age", this.age);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SpreadParameterWithInnerAliasRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SpreadParameterWithInnerAliasRequest if the JsonReader was pointing to an instance of it,
     * or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SpreadParameterWithInnerAliasRequest.
     */
    @Metadata(generated = true)
    public static SpreadParameterWithInnerAliasRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            int age = 0;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("age".equals(fieldName)) {
                    age = reader.getInt();
                } else {
                    reader.skipChildren();
                }
            }
            return new SpreadParameterWithInnerAliasRequest(name, age);
        });
    }
}
