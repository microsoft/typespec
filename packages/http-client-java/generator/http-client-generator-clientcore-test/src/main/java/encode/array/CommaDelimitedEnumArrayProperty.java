package encode.array;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * The CommaDelimitedEnumArrayProperty model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class CommaDelimitedEnumArrayProperty implements JsonSerializable<CommaDelimitedEnumArrayProperty> {
    /*
     * The value property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<Colors> value;

    /**
     * Creates an instance of CommaDelimitedEnumArrayProperty class.
     * 
     * @param value the value value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CommaDelimitedEnumArrayProperty(List<Colors> value) {
        this.value = value;
    }

    /**
     * Get the value property: The value property.
     * 
     * @return the value value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public List<Colors> getValue() {
        return this.value;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        if (this.value != null) {
            jsonWriter.writeStringField("value",
                this.value.stream()
                    .map(element -> element == null ? null : element.toString())
                    .collect(Collectors.joining(",")));
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of CommaDelimitedEnumArrayProperty from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of CommaDelimitedEnumArrayProperty if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the CommaDelimitedEnumArrayProperty.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static CommaDelimitedEnumArrayProperty fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<Colors> value = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("value".equals(fieldName)) {
                    value = reader.getNullable(nonNullReader -> {
                        String valueEncodedAsString = nonNullReader.getString();
                        return valueEncodedAsString.isEmpty()
                            ? new LinkedList<>()
                            : new LinkedList<>(Arrays.stream(valueEncodedAsString.split(",", -1))
                                .map(valueAsString -> valueAsString == null ? null : Colors.fromString(valueAsString))
                                .collect(Collectors.toList()));
                    });
                } else {
                    reader.skipChildren();
                }
            }
            return new CommaDelimitedEnumArrayProperty(value);
        });
    }
}
