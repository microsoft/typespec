package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The StringAndArrayCases model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class StringAndArrayCases implements JsonSerializable<StringAndArrayCases> {
    /*
     * This should be receive/send the string variant
     */
    @Metadata(generated = true)
    private final BinaryData string;

    /*
     * This should be receive/send the array variant
     */
    @Metadata(generated = true)
    private final BinaryData array;

    /**
     * Creates an instance of StringAndArrayCases class.
     * 
     * @param string the string value to set.
     * @param array the array value to set.
     */
    @Metadata(generated = true)
    public StringAndArrayCases(BinaryData string, BinaryData array) {
        this.string = string;
        this.array = array;
    }

    /**
     * Get the string property: This should be receive/send the string variant.
     * 
     * @return the string value.
     */
    @Metadata(generated = true)
    public BinaryData getString() {
        return this.string;
    }

    /**
     * Get the array property: This should be receive/send the array variant.
     * 
     * @return the array value.
     */
    @Metadata(generated = true)
    public BinaryData getArray() {
        return this.array;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeFieldName("string");
        this.string.writeTo(jsonWriter);
        jsonWriter.writeFieldName("array");
        this.array.writeTo(jsonWriter);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of StringAndArrayCases from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of StringAndArrayCases if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the StringAndArrayCases.
     */
    @Metadata(generated = true)
    public static StringAndArrayCases fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BinaryData string = null;
            BinaryData array = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("string".equals(fieldName)) {
                    string = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("array".equals(fieldName)) {
                    array = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else {
                    reader.skipChildren();
                }
            }
            return new StringAndArrayCases(string, array);
        });
    }
}
