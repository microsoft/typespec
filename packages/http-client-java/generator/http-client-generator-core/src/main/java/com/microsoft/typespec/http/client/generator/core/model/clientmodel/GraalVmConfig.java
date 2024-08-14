// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class GraalVmConfig {

    private final List<String> proxies;
    private final List<String> reflects;
    private final boolean fluent;

    public GraalVmConfig(List<String> proxies, List<String> reflects, boolean fluent) {
        this.proxies = proxies;
        this.reflects = reflects;
        this.fluent = fluent;

        Collections.sort(this.proxies);
        Collections.sort(this.reflects);
    }

    private static class ReflectConfig implements JsonSerializable<ReflectConfig> {
        private final String name;

        private ReflectConfig(String name) {
            this.name = name;
        }

        @Override
        public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
            return jsonWriter.writeStartObject()
                .writeStringField("name", name)
                .writeBooleanField("allDeclaredConstructors", true)
                .writeBooleanField("allDeclaredFields", true)
                .writeBooleanField("allDeclaredMethods", true)
                .writeEndObject();
        }
    }

    private static class ResourceConfig implements JsonSerializable<ResourceConfig> {

        private static class Pattern implements JsonSerializable<Pattern> {
            private final String pattern;

            private Pattern(String pattern) {
                this.pattern = pattern;
            }

            @Override
            public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
                return jsonWriter.writeStartObject()
                    .writeStringField("pattern", pattern)
                    .writeEndObject();
            }
        }

        private static class Resource implements JsonSerializable<Resource>{
            private final List<Pattern> includes;

            public Resource(List<Pattern> includes) {
                this.includes = includes;
            }

            @Override
            public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
                return jsonWriter.writeStartObject()
                    .writeArrayField("includes", includes, JsonWriter::writeJson)
                    .writeEndObject();
            }
        }

        private final Resource resources;
        private final List<Object> bundles = Collections.emptyList();

        private ResourceConfig(String artifactId) {
            this.resources = new Resource(Collections.singletonList(
                    new Pattern("\\Q" + artifactId + ".properties" + "\\E")));
        }

        @Override
        public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
            return jsonWriter.writeStartObject()
                .writeJsonField("resources", resources)
                .writeArrayField("bundles", bundles, JsonWriter::writeUntyped)
                .writeEndObject();
        }
    }

    public boolean generateResourceConfig() {
        return !this.fluent;
    }

    // TODO: Template
    public String toProxyConfigJson() {
        List<List<String>> result = proxies.stream().map(Collections::singletonList).collect(Collectors.toList());
        return TemplateUtil.prettyPrintToJson(result);
    }

    public String toReflectConfigJson() {
        List<ReflectConfig> result = reflects.stream().map(ReflectConfig::new).collect(Collectors.toList());
        return TemplateUtil.prettyPrintToJson(result);
    }

    public String toResourceConfigJson(String artifactId) {
        return TemplateUtil.prettyPrintToJson(new ResourceConfig(artifactId));
    }
}
