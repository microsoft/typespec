// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;
import java.io.IOException;
import java.util.Map;
import java.util.TreeMap;

public final class TypeSpecMetadata implements JsonSerializable<TypeSpecMetadata> {

    private String flavor = "generic";
    private String apiVersion;
    private final Map<String, String> crossLanguageDefinitions = new TreeMap<>();

    public TypeSpecMetadata() {
    }

    public void setFlavor(String flavor) {
        this.flavor = flavor;
    }

    public void setApiVersion(String apiVersion) {
        this.apiVersion = apiVersion;
    }

    public String getFlavor() {
        return flavor;
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
