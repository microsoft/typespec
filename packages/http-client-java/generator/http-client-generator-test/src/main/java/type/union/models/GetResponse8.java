// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package type.union.models;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.Immutable;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;

/**
 * The GetResponse8 model.
 */
@Immutable
public final class GetResponse8 implements JsonSerializable<GetResponse8> {
    /*
     * The prop property.
     */
    @Generated
    private final GetResponseProp3 prop;

    /**
     * Creates an instance of GetResponse8 class.
     * 
     * @param prop the prop value to set.
     */
    @Generated
    private GetResponse8(GetResponseProp3 prop) {
        this.prop = prop;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Generated
    public GetResponseProp3 getProp() {
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
     * Reads an instance of GetResponse8 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of GetResponse8 if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the GetResponse8.
     */
    @Generated
    public static GetResponse8 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            GetResponseProp3 prop = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = GetResponseProp3.fromString(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            return new GetResponse8(prop);
        });
    }
}
