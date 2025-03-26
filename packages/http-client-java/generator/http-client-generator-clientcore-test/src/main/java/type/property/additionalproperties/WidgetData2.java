package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The WidgetData2 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class WidgetData2 implements JsonSerializable<WidgetData2> {
    /*
     * The kind property.
     */
    @Metadata(generated = true)
    private final String kind = "kind1";

    /*
     * The start property.
     */
    @Metadata(generated = true)
    private final String start;

    /**
     * Creates an instance of WidgetData2 class.
     * 
     * @param start the start value to set.
     */
    @Metadata(generated = true)
    public WidgetData2(String start) {
        this.start = start;
    }

    /**
     * Get the kind property: The kind property.
     * 
     * @return the kind value.
     */
    @Metadata(generated = true)
    public String getKind() {
        return this.kind;
    }

    /**
     * Get the start property: The start property.
     * 
     * @return the start value.
     */
    @Metadata(generated = true)
    public String getStart() {
        return this.start;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("kind", this.kind);
        jsonWriter.writeStringField("start", this.start);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of WidgetData2 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of WidgetData2 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the WidgetData2.
     */
    @Metadata(generated = true)
    public static WidgetData2 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String start = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("start".equals(fieldName)) {
                    start = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new WidgetData2(start);
        });
    }
}
