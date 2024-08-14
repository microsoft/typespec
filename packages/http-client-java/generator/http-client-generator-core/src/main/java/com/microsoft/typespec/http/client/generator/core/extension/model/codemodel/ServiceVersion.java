// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents a service version.
 */
public class ServiceVersion extends Metadata {
    /**
     * Creates a new instance of the ServiceVersion class.
     */
    public ServiceVersion() {
        super();
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.toJson(jsonWriter);
    }

    /**
     * Deserializes a ServiceVersion instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A ServiceVersion instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ServiceVersion fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ServiceVersion::new, (serviceVersion, fieldName, reader) -> {
            if (!serviceVersion.tryConsumeParentProperties(serviceVersion, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }
}
