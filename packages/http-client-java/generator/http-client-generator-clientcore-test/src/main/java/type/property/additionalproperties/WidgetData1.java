package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

/**
 * The WidgetData1 model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class WidgetData1 implements JsonSerializable<WidgetData1> {
    /*
     * The kind property.
     */
    @Metadata(generated = true)
    private final String kind = "kind1";

    /*
     * The start property.
     */
    @Metadata(generated = true)
    private final OffsetDateTime start;

    /*
     * The end property.
     */
    @Metadata(generated = true)
    private OffsetDateTime end;

    /**
     * Creates an instance of WidgetData1 class.
     * 
     * @param start the start value to set.
     */
    @Metadata(generated = true)
    public WidgetData1(OffsetDateTime start) {
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
    public OffsetDateTime getStart() {
        return this.start;
    }

    /**
     * Get the end property: The end property.
     * 
     * @return the end value.
     */
    @Metadata(generated = true)
    public OffsetDateTime getEnd() {
        return this.end;
    }

    /**
     * Set the end property: The end property.
     * 
     * @param end the end value to set.
     * @return the WidgetData1 object itself.
     */
    @Metadata(generated = true)
    public WidgetData1 setEnd(OffsetDateTime end) {
        this.end = end;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("kind", this.kind);
        jsonWriter.writeStringField("start",
            this.start == null ? null : DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(this.start));
        jsonWriter.writeStringField("end",
            this.end == null ? null : DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(this.end));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of WidgetData1 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of WidgetData1 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the WidgetData1.
     */
    @Metadata(generated = true)
    public static WidgetData1 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            OffsetDateTime start = null;
            OffsetDateTime end = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("start".equals(fieldName)) {
                    start = reader.getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()));
                } else if ("end".equals(fieldName)) {
                    end = reader.getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }
            WidgetData1 deserializedWidgetData1 = new WidgetData1(start);
            deserializedWidgetData1.end = end;

            return deserializedWidgetData1;
        });
    }
}
