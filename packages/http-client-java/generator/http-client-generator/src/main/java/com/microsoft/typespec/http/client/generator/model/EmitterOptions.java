// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.model;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PollingSettings;
import com.microsoft.typespec.http.client.generator.mgmt.model.ResourceCollectionAssociation;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import io.clientcore.core.utils.CoreUtils;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class EmitterOptions implements JsonSerializable<EmitterOptions> {
    private String namespace;
    private String flavor = "generic";
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
    private String packageVersion;
    private Boolean useObjectForUnknown = false;
    private Map<String, PollingSettings> polling = new HashMap<>();
    private String modelsSubpackage;
    private String apiVersion;
    private Boolean useRestProxy;
    private Boolean useDefaultHttpStatusCodeToExceptionTypeMapping = true;
    private Boolean clientSideValidations = false;
    private Boolean uuidAsString = true;
    private DevOptions devOptions;

    // mgmt
    private Boolean premium = false;
    private String renameModel;
    private String addInner;
    private String removeInner;
    private String preserveModel;
    private Boolean generateAsyncMethods;
    private String propertyIncludeAlways;
    private List<ResourceCollectionAssociation> resourceCollectionAssociations = new ArrayList<>();
    private String metadataSuffix;

    // internal
    private String outputDir;
    private Boolean arm = false;
    private String licenseHeader;

    public String getNamespace() {
        return namespace;
    }

    public EmitterOptions setNamespace(String namespace) {
        this.namespace = namespace;
        return this;
    }

    public String getOutputDir() {
        return outputDir;
    }

    public EmitterOptions setOutputDir(String outputDir) {
        this.outputDir = outputDir;
        return this;
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

    public Boolean getUuidAsString() {
        return uuidAsString;
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

    public Map<String, PollingSettings> getPolling() {
        return polling;
    }

    public Boolean getIncludeApiViewProperties() {
        return includeApiViewProperties;
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

    public String getApiVersion() {
        return apiVersion;
    }

    public Boolean getUseRestProxy() {
        return useRestProxy;
    }

    public Boolean getUseDefaultHttpStatusCodeToExceptionTypeMapping() {
        return useDefaultHttpStatusCodeToExceptionTypeMapping;
    }

    public Boolean getClientSideValidations() {
        return clientSideValidations;
    }

    public String getRenameModel() {
        return renameModel;
    }

    public String getAddInner() {
        return addInner;
    }

    public String getRemoveInner() {
        return removeInner;
    }

    public String getPreserveModel() {
        return preserveModel;
    }

    public Boolean getGenerateAsyncMethods() {
        return generateAsyncMethods;
    }

    public String getPropertyIncludeAlways() {
        return propertyIncludeAlways;
    }

    public Boolean getPremium() {
        return premium;
    }

    public List<ResourceCollectionAssociation> getResourceCollectionAssociations() {
        return resourceCollectionAssociations;
    }

    public String getMetadataSuffix() {
        return metadataSuffix;
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
                options.polling = reader.readMap(PollingSettings::fromJson);
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
            } else if ("api-version".equals(fieldName)) {
                options.apiVersion = emptyToNull(reader.getString());
            } else if ("use-rest-proxy".equals(fieldName)) {
                options.useRestProxy = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("use-default-http-status-code-to-exception-type-mapping".equals(fieldName)) {
                options.useDefaultHttpStatusCodeToExceptionTypeMapping = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("rename-model".equals(fieldName)) {
                options.renameModel = reader.getNullable(EmitterOptions::getStringOrMap);
            } else if ("add-inner".equals(fieldName)) {
                options.addInner = reader.getNullable(EmitterOptions::getStringOrList);
            } else if ("remove-inner".equals(fieldName)) {
                options.removeInner = reader.getNullable(EmitterOptions::getStringOrList);
            } else if ("preserve-model".equals(fieldName)) {
                options.preserveModel = reader.getNullable(EmitterOptions::getStringOrList);
            } else if ("generate-async-methods".equals(fieldName)) {
                options.generateAsyncMethods = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("property-include-always".equals(fieldName)) {
                options.propertyIncludeAlways = reader.getNullable(EmitterOptions::getStringOrList);
            } else if ("resource-collection-associations".equals(fieldName)) {
                options.resourceCollectionAssociations = reader.readArray(ResourceCollectionAssociation::fromJson);
            } else if ("premium".equals(fieldName)) {
                options.premium = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("client-side-validations".equals(fieldName)) {
                options.clientSideValidations = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("uuid-as-string".equals(fieldName)) {
                options.uuidAsString = reader.getNullable(EmitterOptions::getBoolean);
            } else if ("metadata-suffix".equals(fieldName)) {
                options.metadataSuffix = emptyToNull(reader.getString());
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
     * but we currently have such tests in test cases.
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

    private static String getStringOrMap(JsonReader jsonReader) throws IOException {
        JsonToken currentToken = jsonReader.currentToken();
        if (currentToken == JsonToken.STRING) {
            return jsonReader.getString();
        } else if (currentToken == JsonToken.START_OBJECT) {
            Map<String, String> renameMap = jsonReader.readMap(JsonReader::getString);
            if (!renameMap.isEmpty()) {
                return renameMap.entrySet()
                    .stream()
                    .map(e -> e.getKey() + ":" + e.getValue())
                    .collect(Collectors.joining(","));
            } else {
                return null;
            }
        } else if (currentToken == JsonToken.START_ARRAY) {
            jsonReader.skipChildren();
        }
        throw new IllegalStateException("Unexpected token to begin object deserialization: " + currentToken);
    }

    private static String getStringOrList(JsonReader jsonReader) throws IOException {
        JsonToken currentToken = jsonReader.currentToken();
        if (currentToken == JsonToken.STRING) {
            return jsonReader.getString();
        } else if (currentToken == JsonToken.START_ARRAY) {
            List<String> list = jsonReader.readArray(JsonReader::getString);
            if (!list.isEmpty()) {
                return String.join(",", list);
            } else {
                return null;
            }
        } else if (currentToken == JsonToken.START_OBJECT) {
            jsonReader.skipChildren();
        }
        throw new IllegalStateException("Unexpected token to begin object deserialization: " + currentToken);
    }
}
