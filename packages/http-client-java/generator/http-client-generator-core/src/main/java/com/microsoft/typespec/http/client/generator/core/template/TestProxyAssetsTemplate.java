// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;

public class TestProxyAssetsTemplate {
    private static class Assets implements JsonSerializable<Assets> {
        private String assetsRepo = "Azure/azure-sdk-assets";
        private String assetsRepoPrefixPath = "java";
        private String tagPrefix;
        private String tag = "";

        public void setTagPrefix(String tagPrefix) {
            this.tagPrefix = tagPrefix;
        }

        @Override
        public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
            return jsonWriter.writeStartObject()
                .writeStringField("AssetsRepo", assetsRepo)
                .writeStringField("AssetsRepoPrefixPath", assetsRepoPrefixPath)
                .writeStringField("TagPrefix", tagPrefix)
                .writeStringField("Tag", tag)
                .writeEndObject();
        }

        /**
         * Deserialize the JSON data into an Assets instance.
         *
         * @param jsonReader JSON reader
         * @return Assets instance
         * @throws IOException thrown if the JSON data cannot be deserialized
         */
        public static Assets fromJson(JsonReader jsonReader) throws IOException {
            return JsonUtils.readObject(jsonReader, Assets::new, (assets, fieldName, reader) -> {
                if ("AssetsRepo".equals(fieldName)) {
                    assets.assetsRepo = reader.getString();
                } else if ("AssetsRepoPrefixPath".equals(fieldName)) {
                    assets.assetsRepoPrefixPath = reader.getString();
                } else if ("TagPrefix".equals(fieldName)) {
                    assets.tagPrefix = reader.getString();
                } else if ("Tag".equals(fieldName)) {
                    assets.tag = reader.getString();
                } else {
                    reader.skipChildren();
                }
            });
        }
    }

    public String write(Project project) {
        Assets asserts = new Assets();
        String group;
        if (project.getSdkRepositoryUri().isPresent()) {
            String[] segments = project.getSdkRepositoryUri().get().split("/");
            group = segments[segments.length - 2];
        } else {
            // fallback to last segment of artifactId, this could be incorrect
            String[] segments = project.getArtifactId().split("-");
            group = segments[segments.length - 1];
        }
        asserts.setTagPrefix(String.format("java/%1$s/%2$s", group, project.getArtifactId()));
        return TemplateUtil.prettyPrintToJson(asserts);
    }
}
