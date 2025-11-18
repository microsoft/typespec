package type.union.implementation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import type.union.GetResponseProp;

/**
 * The SendRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class SendRequest implements JsonSerializable<SendRequest> {
    /*
     * The prop property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final GetResponseProp prop;

    /**
     * Creates an instance of SendRequest class.
     * 
     * @param prop the prop value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SendRequest(GetResponseProp prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public GetResponseProp getProp() {
        return this.prop;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("prop", this.prop == null ? null : this.prop.toString());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of SendRequest from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SendRequest if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SendRequest.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static SendRequest fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            GetResponseProp prop = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = GetResponseProp.fromString(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            return new SendRequest(prop);
        });
    }
}
