package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The EnumsOnlyCases model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class EnumsOnlyCases implements JsonSerializable<EnumsOnlyCases> {
    /*
     * This should be receive/send the left variant
     */
    @Metadata(generated = true)
    private final EnumsOnlyCasesLr lr;

    /*
     * This should be receive/send the up variant
     */
    @Metadata(generated = true)
    private final EnumsOnlyCasesUd ud;

    /**
     * Creates an instance of EnumsOnlyCases class.
     * 
     * @param lr the lr value to set.
     * @param ud the ud value to set.
     */
    @Metadata(generated = true)
    public EnumsOnlyCases(EnumsOnlyCasesLr lr, EnumsOnlyCasesUd ud) {
        this.lr = lr;
        this.ud = ud;
    }

    /**
     * Get the lr property: This should be receive/send the left variant.
     * 
     * @return the lr value.
     */
    @Metadata(generated = true)
    public EnumsOnlyCasesLr getLr() {
        return this.lr;
    }

    /**
     * Get the ud property: This should be receive/send the up variant.
     * 
     * @return the ud value.
     */
    @Metadata(generated = true)
    public EnumsOnlyCasesUd getUd() {
        return this.ud;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("lr", this.lr == null ? null : this.lr.toString());
        jsonWriter.writeStringField("ud", this.ud == null ? null : this.ud.toString());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of EnumsOnlyCases from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of EnumsOnlyCases if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the EnumsOnlyCases.
     */
    @Metadata(generated = true)
    public static EnumsOnlyCases fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            EnumsOnlyCasesLr lr = null;
            EnumsOnlyCasesUd ud = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("lr".equals(fieldName)) {
                    lr = EnumsOnlyCasesLr.fromString(reader.getString());
                } else if ("ud".equals(fieldName)) {
                    ud = EnumsOnlyCasesUd.fromString(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            return new EnumsOnlyCases(lr, ud);
        });
    }
}
