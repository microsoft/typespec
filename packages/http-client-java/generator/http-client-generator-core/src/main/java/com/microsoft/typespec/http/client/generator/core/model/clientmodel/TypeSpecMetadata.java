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
    private final String crossLanguagePackageId;
    private final String crossLanguageVersion;

    TypeSpecMetadata(String artifactId, String flavor, Map<String, String> apiVersions,
        Map<String, String> crossLanguageDefinitions, List<String> generatedFiles, String crossLanguagePackageId,
        String crossLanguageVersion) {
        this.artifactId = artifactId;
        this.flavor = flavor;
        this.apiVersions = apiVersions;
        this.crossLanguageDefinitions = crossLanguageDefinitions;
        this.generatedFiles = generatedFiles;
        this.crossLanguagePackageId = crossLanguagePackageId;
        this.crossLanguageVersion = crossLanguageVersion;
    }

    public static class Builder {
        private String artifactId;
        private String flavor;
        private Map<String, String> apiVersions;
        private Map<String, String> crossLanguageDefinitions;
        private List<String> generatedFiles;
        private String crossLanguagePackageId;
        private String crossLanguageVersion;

        public Builder artifactId(String artifactId) {
            this.artifactId = artifactId;
            return this;
        }

        public Builder flavor(String flavor) {
            this.flavor = flavor;
            return this;
        }

        public Builder apiVersions(Map<String, String> apiVersions) {
            this.apiVersions = apiVersions;
            return this;
        }

        public Builder crossLanguageDefinitions(Map<String, String> crossLanguageDefinitions) {
            this.crossLanguageDefinitions = crossLanguageDefinitions;
            return this;
        }

        public Builder generatedFiles(List<String> generatedFiles) {
            this.generatedFiles = generatedFiles;
            return this;
        }

        public Builder crossLanguagePackageId(String crossLanguagePackageId) {
            this.crossLanguagePackageId = crossLanguagePackageId;
            return this;
        }

        public Builder crossLanguageVersion(String crossLanguageVersion) {
            this.crossLanguageVersion = crossLanguageVersion;
            return this;
        }

        public TypeSpecMetadata build() {
            return new TypeSpecMetadata(artifactId, flavor, apiVersions, crossLanguageDefinitions, generatedFiles,
                crossLanguagePackageId, crossLanguageVersion);
        }
    }

    public String getArtifactId() {
        return artifactId;
    }

    public String getCrossLanguagePackageId() {
        return crossLanguagePackageId;
    }

    public String getCrossLanguageVersion() {
        return crossLanguageVersion;
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
        jsonWriter.writeMapField("apiVersions", apiVersions, (writer, element) -> {
            if (element == null) {
                writer.writeNull();
            } else {
                writer.writeString(element);
            }
        });
        if (crossLanguagePackageId != null) {
            jsonWriter.writeStringField("crossLanguagePackageId", crossLanguagePackageId);
        }
        if (crossLanguageVersion != null) {
            jsonWriter.writeStringField("crossLanguageVersion", crossLanguageVersion);
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
            Builder builder = new Builder();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("artifactId".equals(fieldName)) {
                    builder.artifactId(reader.getString());
                } else if ("flavor".equals(fieldName)) {
                    builder.flavor(reader.getString());
                } else if ("apiVersions".equals(fieldName)) {
                    builder.apiVersions(reader.readMap(JsonReader::getString));
                } else if ("crossLanguageDefinitions".equals(fieldName)) {
                    builder.crossLanguageDefinitions(reader.readMap(JsonReader::getString));
                } else if ("generatedFiles".equals(fieldName)) {
                    builder.generatedFiles(reader.readArray(JsonReader::getString));
                } else if ("crossLanguagePackageId".equals(fieldName)) {
                    builder.crossLanguagePackageId(reader.getString());
                } else if ("crossLanguageVersion".equals(fieldName)) {
                    builder.crossLanguageVersion(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            return builder.build();
        });
    }
}
