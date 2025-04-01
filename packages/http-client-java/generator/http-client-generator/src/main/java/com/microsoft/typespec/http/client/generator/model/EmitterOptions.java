// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.model;

import com.azure.core.util.CoreUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EmitterOptions implements JsonSerializable<EmitterOptions> {
    private String namespace;
    private String flavor = "generic";
    private String serviceName;
    private List<String> serviceVersions;
    private Boolean generateTests = true;
    private Boolean generateSamples = true;
    private Boolean enableSyncStack;
    private Boolean streamStyleSerialization = true;
    private Boolean partialUpdate;
    private String customTypes;
    private String customTypeSubpackage;
    private String customizationClass;
    private Boolean includeApiViewProperties = true;
    private String packageVersion;
    private Boolean useObjectForUnknown = false;
    private Map<String, JavaSettings.PollingDetails> polling = new HashMap<>();
    private String modelsSubpackage;
    private DevOptions devOptions;

    // internal
    private String outputDir;
    private Boolean arm = false;
    private String licenseHeader;

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

    public Boolean getUseObjectForUnknown() {
        return useObjectForUnknown;
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

    public Boolean getIncludeApiViewProperties() {
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

    public String getPackageVersion() {
        return packageVersion;
    }

    public String getLicenseHeader() {
        return licenseHeader;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        // it does not need to be written to JSON
        return jsonWriter.writeStartObject().writeEndObject();
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
                options.generateTests = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("generate-samples".equals(fieldName)) {
                options.generateSamples = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("enable-sync-stack".equals(fieldName)) {
                options.enableSyncStack = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("stream-style-serialization".equals(fieldName)) {
                options.streamStyleSerialization = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("partial-update".equals(fieldName)) {
                options.partialUpdate = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("custom-types".equals(fieldName)) {
                options.customTypes = emptyToNull(reader.getString());
            } else if ("custom-types-subpackage".equals(fieldName)) {
                options.customTypeSubpackage = emptyToNull(reader.getString());
            } else if ("customization-class".equals(fieldName)) {
                options.customizationClass = emptyToNull(reader.getString());
            } else if ("include-api-view-properties".equals(fieldName)) {
                options.includeApiViewProperties = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("use-object-for-unknown".equals(fieldName)) {
                options.useObjectForUnknown = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("polling".equals(fieldName)) {
                options.polling = reader.readMap(JavaSettings.PollingDetails::fromJson);
            } else if ("arm".equals(fieldName)) {
                options.arm = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("models-subpackage".equals(fieldName)) {
                options.modelsSubpackage = emptyToNull(reader.getString());
            } else if ("package-version".equals(fieldName)) {
                options.packageVersion = emptyToNull(reader.getString());
            } else if ("license-header".equals(fieldName)) {
                options.licenseHeader = emptyToNull(reader.getString());
            } else if ("dev-options".equals(fieldName)) {
                options.devOptions = DevOptions.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }

    /*
     * Protection for use of undocumented emitter options in unbranded.
     * Without description in "EmitterOptions" in $lib of emitter,
     * tsp compiler will not automatically convert "true" option to JSON boolean.
     * We did not expect user to use these undocumented options in unbranded,
     * but we currently have such test in test cases.
     */
    private static boolean getBoolean(JsonReader jsonReader) throws IOException {
        JsonToken currentToken = jsonReader.currentToken();
        if (currentToken == JsonToken.STRING) {
            return Boolean.parseBoolean(jsonReader.getString());
        } else {
            return jsonReader.getBoolean();
        }
    }

    private static String emptyToNull(String str) {
        return CoreUtils.isNullOrEmpty(str) ? null : str;
    }
}
