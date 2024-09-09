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
import java.util.Objects;

/**
 * Represents deprecation information.
 */
public class Deprecation implements JsonSerializable<Deprecation> {
    private String message;
    private List<ApiVersion> apiVersions = new ArrayList<>();

    /**
     * Creates a new instance of the Deprecation class.
     */
    public Deprecation() {
    }

    /**
     * Gets the deprecated message. (Required)
     *
     * @return The deprecated message.
     */
    public String getMessage() {
        return message;
    }

    /**
     * Sets the deprecated message. (Required)
     *
     * @param message The deprecated message.
     */
    public void setMessage(String message) {
        this.message = message;
    }

    /**
     * Gets the API versions that this deprecation is applicable to. (Required)
     *
     * @return The API versions that this deprecation is applicable to.
     */
    public List<ApiVersion> getApiVersions() {
        return apiVersions;
    }

    /**
     * Sets the API versions that this deprecation is applicable to. (Required)
     *
     * @param apiVersions The API versions that this deprecation is applicable to.
     */
    public void setApiVersions(List<ApiVersion> apiVersions) {
        this.apiVersions = apiVersions;
    }

    @Override
    public String toString() {
        return Deprecation.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[message="
                + Objects.toString(message, "<null>") + ",apiVersions=" + Objects.toString(apiVersions, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(message, apiVersions);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof Deprecation)) {
            return false;
        }

        Deprecation rhs = ((Deprecation) other);
        return Objects.equals(message, rhs.message) && Objects.equals(apiVersions, rhs.apiVersions);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("message", message)
            .writeArrayField("apiVersions", apiVersions, JsonWriter::writeJson)
            .writeEndObject();
    }

    /**
     * Deserializes a Deprecation instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Deprecation instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Deprecation fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Deprecation::new, (deprecation, fieldName, reader) -> {
            if ("message".equals(fieldName)) {
                deprecation.message = reader.getString();
            } else if ("apiVersions".equals(fieldName)) {
                deprecation.apiVersions = reader.readArray(ApiVersion::fromJson);
            } else {
                reader.skipChildren();
            }
        });
    }
}
