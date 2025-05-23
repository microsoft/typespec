// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.azure.core.util.CoreUtils;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;
import com.microsoft.typespec.http.client.generator.core.mapper.CollectionUtil;
import java.io.IOException;
import java.util.Map;

/**
 * Metadata for TypeSpec generated SDK.
 */
public final class TypeSpecMetadata implements JsonSerializable<TypeSpecMetadata> {

    private final String artifactId;
    private final String flavor;
    private final String apiVersion;
    private final Map<String, String> crossLanguageDefinitions;

    public TypeSpecMetadata(String artifactId, String flavor, String apiVersion,
        Map<String, String> crossLanguageDefinitions) {
        this.artifactId = artifactId;
        this.flavor = flavor;
        this.apiVersion = apiVersion;
        this.crossLanguageDefinitions = crossLanguageDefinitions;
    }

    public String getArtifactId() {
        return artifactId;
    }

    public String getFlavor() {
        return flavor;
    }

    public String getApiVersion() {
        return apiVersion;
    }

    public Map<String, String> getCrossLanguageDefinitions() {
        return CollectionUtil.toImmutableMap(crossLanguageDefinitions);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("flavor", flavor);
        jsonWriter.writeStringField("apiVersion", apiVersion);
        if (!CoreUtils.isNullOrEmpty(crossLanguageDefinitions)) {
            jsonWriter.writeMapField("crossLanguageDefinitions", this.crossLanguageDefinitions, (writer, element) -> {
                if (element == null) {
                    writer.writeNull();
                } else {
                    writer.writeString(element);
                }
            });
        }
        return jsonWriter.writeEndObject();
    }
}
