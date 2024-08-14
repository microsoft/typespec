// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents the C# language.
 */
public class CSharpLanguage implements JsonSerializable<CSharpLanguage> {

    /**
     * Creates a new instance of the CSharpLanguage class.
     */
    public CSharpLanguage() {
    }

    @Override
    public String toString() {
        return CSharpLanguage.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[]";
    }

    @Override
    public int hashCode() {
        return 1;
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        return other instanceof CSharpLanguage;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject().writeEndObject();
    }

    /**
     * Deserializes a CSharpLanguage instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A CSharpLanguage instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static CSharpLanguage fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readEmptyObject(jsonReader, CSharpLanguage::new);
    }
}
