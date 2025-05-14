// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;
import java.io.IOException;
import java.util.Map;
import java.util.TreeMap;

public final class TypeSpecMetadata implements JsonSerializable<TypeSpecMetadata> {

    private final String artifactId;
    private final String flavor;
    private final String apiVersion;
    private final Map<String, String> crossLanguageDefinitions = new TreeMap<>();

    public TypeSpecMetadata(String artifactId, String flavor, String apiVersion) {
        this.artifactId = artifactId;
        this.flavor = flavor;
        this.apiVersion = apiVersion;
    }

    public String getArtifactId() {
        return artifactId;
    }

    public String getApiVersion() {
        return apiVersion;
    }

    public Map<String, String> getCrossLanguageDefinitions() {
        return crossLanguageDefinitions;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("flavor", flavor);
        jsonWriter.writeStringField("apiVersion", apiVersion);
        jsonWriter.writeMapField("crossLanguageDefinitions", this.crossLanguageDefinitions, (writer, element) -> {
            if (element == null) {
                writer.writeNull();
            } else {
                writer.writeString(element);
            }
        });
        return jsonWriter.writeEndObject();
    }
}
