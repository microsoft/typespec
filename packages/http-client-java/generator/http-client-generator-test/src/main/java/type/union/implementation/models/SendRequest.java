// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package type.union.implementation.models;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.Immutable;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;
import type.union.models.GetResponseProp;

/**
 * The SendRequest model.
 */
@Immutable
public final class SendRequest implements JsonSerializable<SendRequest> {
    /*
     * The prop property.
     */
    @Generated
    private final GetResponseProp prop;

    /**
     * Creates an instance of SendRequest class.
     * 
     * @param prop the prop value to set.
     */
    @Generated
    public SendRequest(GetResponseProp prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Generated
    public GetResponseProp getProp() {
        return this.prop;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
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
    @Generated
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
