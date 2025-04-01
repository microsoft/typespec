package type.model.empty;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Empty model used in operation return type.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class EmptyOutput implements JsonSerializable<EmptyOutput> {
    /**
     * Creates an instance of EmptyOutput class.
     */
    @Metadata(generated = true)
    private EmptyOutput() {
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of EmptyOutput from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of EmptyOutput if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the EmptyOutput.
     */
    @Metadata(generated = true)
    public static EmptyOutput fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            EmptyOutput deserializedEmptyOutput = new EmptyOutput();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                reader.skipChildren();
            }

            return deserializedEmptyOutput;
        });
    }
}
