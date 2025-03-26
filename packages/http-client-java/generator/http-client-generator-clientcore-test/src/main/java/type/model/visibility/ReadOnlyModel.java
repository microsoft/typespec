package type.model.visibility;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * RoundTrip model with readonly optional properties.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class ReadOnlyModel implements JsonSerializable<ReadOnlyModel> {
    /*
     * Optional readonly nullable int list.
     */
    @Metadata(generated = true)
    private List<Integer> optionalNullableIntList;

    /*
     * Optional readonly string dictionary.
     */
    @Metadata(generated = true)
    private Map<String, String> optionalStringRecord;

    /**
     * Creates an instance of ReadOnlyModel class.
     */
    @Metadata(generated = true)
    public ReadOnlyModel() {
    }

    /**
     * Get the optionalNullableIntList property: Optional readonly nullable int list.
     * 
     * @return the optionalNullableIntList value.
     */
    @Metadata(generated = true)
    public List<Integer> getOptionalNullableIntList() {
        return this.optionalNullableIntList;
    }

    /**
     * Get the optionalStringRecord property: Optional readonly string dictionary.
     * 
     * @return the optionalStringRecord value.
     */
    @Metadata(generated = true)
    public Map<String, String> getOptionalStringRecord() {
        return this.optionalStringRecord;
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
     * Reads an instance of ReadOnlyModel from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ReadOnlyModel if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the ReadOnlyModel.
     */
    @Metadata(generated = true)
    public static ReadOnlyModel fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            ReadOnlyModel deserializedReadOnlyModel = new ReadOnlyModel();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("optionalNullableIntList".equals(fieldName)) {
                    List<Integer> optionalNullableIntList = reader.readArray(reader1 -> reader1.getInt());
                    deserializedReadOnlyModel.optionalNullableIntList = optionalNullableIntList;
                } else if ("optionalStringRecord".equals(fieldName)) {
                    Map<String, String> optionalStringRecord = reader.readMap(reader1 -> reader1.getString());
                    deserializedReadOnlyModel.optionalStringRecord = optionalStringRecord;
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedReadOnlyModel;
        });
    }
}
