// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.model;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.core.util.CoreUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EmitterOptions implements JsonSerializable<EmitterOptions> {
    private String namespace;
    private String outputDir;
    private String flavor = "Azure";
    private String serviceName;
    private List<String> serviceVersions;
    private Boolean generateTests = true;
    private Boolean generateSamples = true;
    private Boolean enableSyncStack = true;
    private Boolean streamStyleSerialization = true;
    private Boolean partialUpdate;
    private String customTypes;
    private String customTypeSubpackage;
    private String customizationClass;
    private Boolean includeApiViewProperties = true;
    private Map<String, JavaSettings.PollingDetails> polling = new HashMap<>();
    private Boolean arm = false;
    private String modelsSubpackage;
    private DevOptions devOptions;

    public String getNamespace() {
        return namespace;
    }

    public String getOutputDir() {
        return outputDir;
    }

    public String getServiceName() {
        return serviceName;
    }

    public Boolean getPartialUpdate() {
        return partialUpdate;
    }

    public Boolean getGenerateTests() {
        return generateTests;
    }

    public Boolean getGenerateSamples() {
        return generateSamples;
    }

    public Boolean getEnableSyncStack() {
        return enableSyncStack;
    }

    public Boolean getStreamStyleSerialization() {
        return streamStyleSerialization;
    }

    public EmitterOptions setNamespace(String namespace) {
        this.namespace = namespace;
        return this;
    }

    public EmitterOptions setOutputDir(String outputDir) {
        this.outputDir = outputDir;
        return this;
    }

    public List<String> getServiceVersions() {
        return serviceVersions;
    }

    public DevOptions getDevOptions() {
        return devOptions;
    }

    public String getCustomTypes() {
        return customTypes;
    }

    public String getCustomTypeSubpackage() {
        return customTypeSubpackage;
    }

    public String getCustomizationClass() {
        return customizationClass;
    }

    public Boolean includeApiViewProperties() {
        return includeApiViewProperties;
    }

    public Map<String, JavaSettings.PollingDetails> getPolling() {
        return polling;
    }

    public void setPolling(Map<String, JavaSettings.PollingDetails> polling) {
        this.polling = polling;
    }

    public Boolean getArm() {
        return arm;
    }

    public String getModelsSubpackage() {
        return modelsSubpackage;
    }

    public String getFlavor() {
        return flavor;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("namespace", namespace)
            .writeStringField("output-dir", outputDir)
            .writeStringField("flavor", flavor)
            .writeStringField("service-name", serviceName)
            .writeArrayField("service-versions", serviceVersions, JsonWriter::writeString)
            .writeBooleanField("generate-tests", generateTests)
            .writeBooleanField("generate-samples", generateSamples)
            .writeBooleanField("enable-sync-stack", enableSyncStack)
            .writeBooleanField("stream-style-serialization", streamStyleSerialization)
            .writeBooleanField("partial-update", partialUpdate)
            .writeStringField("custom-types", customTypes)
            .writeStringField("custom-types-subpackage", customTypeSubpackage)
            .writeStringField("customization-class", customizationClass)
            .writeBooleanField("include-api-view-properties", includeApiViewProperties)
            .writeMapField("polling", polling, JsonWriter::writeJson)
            .writeBooleanField("arm", arm)
            .writeStringField("models-subpackage", modelsSubpackage)
            .writeJsonField("dev-options", devOptions)
            .writeEndObject();
    }

    public static EmitterOptions fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, EmitterOptions::new, (options, fieldName, reader) -> {
            if ("namespace".equals(fieldName)) {
                options.namespace = emptyToNull(reader.getString());
            } else if ("output-dir".equals(fieldName)) {
                options.outputDir = emptyToNull(reader.getString());
            } else if ("flavor".equals(fieldName)) {
                options.flavor = emptyToNull(reader.getString());
            } else if ("service-name".equals(fieldName)) {
                options.serviceName = emptyToNull(reader.getString());
            } else if ("service-versions".equals(fieldName)) {
                options.serviceVersions = reader.readArray(JsonReader::getString);
            } else if ("generate-tests".equals(fieldName)) {
                options.generateTests = reader.getNullable(JsonReader::getBoolean);
            } else if ("generate-samples".equals(fieldName)) {
                options.generateSamples = reader.getNullable(JsonReader::getBoolean);
            } else if ("enable-sync-stack".equals(fieldName)) {
                options.enableSyncStack = reader.getNullable(JsonReader::getBoolean);
            } else if ("stream-style-serialization".equals(fieldName)) {
                options.streamStyleSerialization = reader.getNullable(JsonReader::getBoolean);
            } else if ("partial-update".equals(fieldName)) {
                options.partialUpdate = reader.getNullable(JsonReader::getBoolean);
            } else if ("custom-types".equals(fieldName)) {
                options.customTypes = emptyToNull(reader.getString());
            } else if ("custom-types-subpackage".equals(fieldName)) {
                options.customTypeSubpackage = emptyToNull(reader.getString());
            } else if ("customization-class".equals(fieldName)) {
                options.customizationClass = emptyToNull(reader.getString());
            } else if ("include-api-view-properties".equals(fieldName)) {
                options.includeApiViewProperties = reader.getNullable(JsonReader::getBoolean);
            } else if ("polling".equals(fieldName)) {
                options.polling = reader.readMap(JavaSettings.PollingDetails::fromJson);
            } else if ("arm".equals(fieldName)) {
                options.arm = reader.getNullable(JsonReader::getBoolean);
            } else if ("models-subpackage".equals(fieldName)) {
                options.modelsSubpackage = emptyToNull(reader.getString());
            } else if ("dev-options".equals(fieldName)) {
                options.devOptions = DevOptions.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }

    private static String emptyToNull(String str) {
        return CoreUtils.isNullOrEmpty(str) ? null : str;
    }
}
