// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents security information.
 */
public class Security implements JsonSerializable<Security> {
    private boolean authenticationRequired;
    private List<Scheme> schemes = new ArrayList<>();

    /**
     * Creates a new instance of the Security class.
     */
    public Security() {
    }

    /**
     * Gets whether authentication is required.
     *
     * @return Whether authentication is required.
     */
    public boolean isAuthenticationRequired() {
        return authenticationRequired;
    }

    /**
     * Sets whether authentication is required.
     *
     * @param authenticationRequired Whether authentication is required.
     */
    public void setAuthenticationRequired(boolean authenticationRequired) {
        this.authenticationRequired = authenticationRequired;
    }

    /**
     * Gets the security schemes.
     *
     * @return The security schemes.
     */
    public List<Scheme> getSchemes() {
        return schemes;
    }

    /**
     * Sets the security schemes.
     *
     * @param schemes The security schemes.
     */
    public void setSchemes(List<Scheme> schemes) {
        this.schemes = schemes;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeBooleanField("authenticationRequired", authenticationRequired)
            .writeArrayField("schemes", schemes, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a Security instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Security instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Security fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Security::new, (security, fieldName, reader) -> {
            if ("authenticationRequired".equals(fieldName)) {
                security.authenticationRequired = reader.getBoolean();
            } else if ("schemes".equals(fieldName)) {
                security.schemes = reader.readArray(Scheme::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
