// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.mapper.CollectionUtil;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import io.clientcore.core.utils.CoreUtils;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Metadata for TypeSpec generated SDK.
 */
public final class TypeSpecMetadata implements JsonSerializable<TypeSpecMetadata> {

    private final String artifactId;
    private final String flavor;
    private final String apiVersion;
    private final Map<String, String> crossLanguageDefinitions;

    private final List<String> generatedFiles;

    public TypeSpecMetadata(String artifactId, String flavor, String apiVersion,
        Map<String, String> crossLanguageDefinitions, List<String> generatedFiles) {
        this.artifactId = artifactId;
        this.flavor = flavor;
        this.apiVersion = apiVersion;
        this.crossLanguageDefinitions = crossLanguageDefinitions;
        this.generatedFiles = generatedFiles;
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

    /**
     * Gets the list of generated Java source files (tests and samples excluded).
     *
     * @return the list of generated Java source files
     */
    public List<String> getGeneratedFiles() {
        return generatedFiles;
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
        if (!CoreUtils.isNullOrEmpty(generatedFiles)) {
            jsonWriter.writeArrayField("generatedFiles", this.generatedFiles, JsonWriter::writeString);
        }
        return jsonWriter.writeEndObject();
    }

    public static TypeSpecMetadata fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String artifactId = null;
            String flavor = null;
            String apiVersion = null;
            Map<String, String> crossLanguageDefinitions = null;
            List<String> generatedFiles = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("artifactId".equals(fieldName)) {
                    artifactId = reader.getString();
                } else if ("flavor".equals(fieldName)) {
                    flavor = reader.getString();
                } else if ("apiVersion".equals(fieldName)) {
                    apiVersion = reader.getString();
                } else if ("crossLanguageDefinitions".equals(fieldName)) {
                    crossLanguageDefinitions = reader.readMap(JsonReader::getString);
                } else if ("generatedFiles".equals(fieldName)) {
                    generatedFiles = reader.readArray(JsonReader::getString);
                } else {
                    reader.skipChildren();
                }
            }
            return new TypeSpecMetadata(artifactId, flavor, apiVersion, crossLanguageDefinitions, generatedFiles);
        });
    }
}
