// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.Objects;

/**
 * - since API version formats range from
 * Azure ARM API date style (2018-01-01) to semver (1.2.3)
 * and virtually any other text, this value tends to be an
 * opaque string with the possibility of a modifier to indicate
 * that it is a range.
 * <p>
 * options:
 * - prepend a dash or append a plus to indicate a range
 * (ie, '2018-01-01+' or '-2019-01-01', or '1.0+' )
 * <p>
 * - semver-range style (ie, '^1.0.0' or '~1.0.0' )
 */
public class ApiVersion implements JsonSerializable<ApiVersion> {
    private String version;
    private ApiVersion.Range range;

    /**
     * Creates a new instance of the ApiVersion class.
     */
    public ApiVersion() {
    }

    /**
     * Gets the API version string used in the API. (Required)
     *
     * @return The API version string used in the API.
     */
    public String getVersion() {
        return version;
    }

    /**
     * Sets the API version string used in the API. (Required)
     *
     * @param version The API version string used in the API.
     */
    public void setVersion(String version) {
        this.version = version;
    }

    /**
     * Gets the range of the API version.
     *
     * @return The range of the API version.
     */
    public ApiVersion.Range getRange() {
        return range;
    }

    /**
     * Sets the range of the API version.
     *
     * @param range The range of the API version.
     */
    public void setRange(ApiVersion.Range range) {
        this.range = range;
    }

    @Override
    public String toString() {
        return ApiVersion.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[version="
            + Objects.toString(version, "<null>") + ",range=" + Objects.toString(range, "<null>") + ']';
    }

    @Override
    public int hashCode() {
        return Objects.hash(version, range);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof ApiVersion)) {
            return false;
        }

        ApiVersion rhs = ((ApiVersion) other);
        return Objects.equals(version, rhs.version) && Objects.equals(range, rhs.range);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("version", version)
            .writeStringField("range", range == null ? null : range.toString())
            .writeEndObject();
    }

    /**
     * Deserializes an ApiVersion instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An ApiVersion instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ApiVersion fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ApiVersion::new, (version, fieldName, reader) -> {
            if ("version".equals(fieldName)) {
                version.version = reader.getString();
            } else if ("range".equals(fieldName)) {
                version.range = ApiVersion.Range.fromValue(reader.getString());
            } else {
                reader.skipChildren();
            }
        });
    }

    /**
     * Represents the range of the API version.
     */
    public enum Range {
        /**
         * Represents a range that is empty.
         */
        __EMPTY__("+"),

        /**
         * Represents a range that is empty.
         */
        __EMPTY___("-");
        private final String value;

        Range(String value) {
            this.value = value;
        }

        @Override
        public String toString() {
            return this.value;
        }

        /**
         * Gets the value of the range.
         *
         * @return The value of the range.
         */
        public String value() {
            return this.value;
        }

        /**
         * Parses a string value into a range value.
         *
         * @param value The string value to parse.
         * @return The parsed range value.
         * @throws IllegalArgumentException thrown if the value does not match any of the known range values.
         */
        public static ApiVersion.Range fromValue(String value) {
            if ("+".equals(value)) {
                return __EMPTY__;
            } else if ("-".equals(value)) {
                return __EMPTY___;
            } else {
                throw new IllegalArgumentException(value);
            }
        }
    }
}
