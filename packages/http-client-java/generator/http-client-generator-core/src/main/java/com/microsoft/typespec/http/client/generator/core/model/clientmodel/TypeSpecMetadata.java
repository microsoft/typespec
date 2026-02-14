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
    private final Map<String, String> apiVersions;
    private final Map<String, String> crossLanguageDefinitions;

    private final List<String> generatedFiles;

    public TypeSpecMetadata(String artifactId, String flavor, Map<String, String> apiVersions,
        Map<String, String> crossLanguageDefinitions, List<String> generatedFiles) {
        this.artifactId = artifactId;
        this.flavor = flavor;
        this.apiVersions = apiVersions;
        this.crossLanguageDefinitions = crossLanguageDefinitions;
        this.generatedFiles = generatedFiles;
    }

    public String getArtifactId() {
        return artifactId;
    }

    public String getFlavor() {
        return flavor;
    }

    public Map<String, String> getApiVersions() {
        return apiVersions;
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
        if (apiVersions != null) {
            jsonWriter.writeMapField("apiVersions", apiVersions, (writer, element) -> {
                if (element == null) {
                    writer.writeNull();
                } else {
                    writer.writeString(element);
                }
            });
        }
        if (!CoreUtils.isNullOrEmpty(crossLanguageDefinitions)) {
            jsonWriter.writeMapField("crossLanguageDefinitions", crossLanguageDefinitions, (writer, element) -> {
                if (element == null) {
                    writer.writeNull();
                } else {
                    writer.writeString(element);
                }
            });
        }
        if (!CoreUtils.isNullOrEmpty(generatedFiles)) {
            jsonWriter.writeArrayField("generatedFiles", generatedFiles, JsonWriter::writeString);
        }
        return jsonWriter.writeEndObject();
    }

    public static TypeSpecMetadata fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String artifactId = null;
            String flavor = null;
            Map<String, String> apiVersions = null;
            Map<String, String> crossLanguageDefinitions = null;
            List<String> generatedFiles = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("artifactId".equals(fieldName)) {
                    artifactId = reader.getString();
                } else if ("flavor".equals(fieldName)) {
                    flavor = reader.getString();
                } else if ("apiVersions".equals(fieldName)) {
                    apiVersions = reader.readMap(JsonReader::getString);
                } else if ("crossLanguageDefinitions".equals(fieldName)) {
                    crossLanguageDefinitions = reader.readMap(JsonReader::getString);
                } else if ("generatedFiles".equals(fieldName)) {
                    generatedFiles = reader.readArray(JsonReader::getString);
                } else {
                    reader.skipChildren();
                }
            }
            return new TypeSpecMetadata(artifactId, flavor, apiVersions, crossLanguageDefinitions, generatedFiles);
        });
    }
}
