// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;
import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ConvenienceMethod;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.preprocessor.Preprocessor;
import com.microsoft.typespec.http.client.generator.core.preprocessor.tranformer.Transformer;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.azure.core.util.CoreUtils;
import com.azure.json.JsonReader;
import com.azure.json.ReadValueCallback;
import com.microsoft.typespec.http.client.generator.mapper.TypeSpecMapperFactory;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import com.microsoft.typespec.http.client.generator.util.FileUtil;
import com.microsoft.typespec.http.client.generator.util.ModelUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.OutputStream;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class TypeSpecPlugin extends Javagen {

    private static final Logger LOGGER = LoggerFactory.getLogger(TypeSpecPlugin.class);

    private final EmitterOptions emitterOptions;

    private final Map<String, String> crossLanguageDefinitionsMap = new TreeMap<>();

    public Client processClient(CodeModel codeModel) {
        // transform code model
        codeModel = new Transformer().transform(Preprocessor.convertOptionalConstantsToEnum(codeModel));

        // map to client model
        Client client = Mappers.getClientMapper().map(codeModel);

        client.getAsyncClients()
                .forEach(asyncClient -> crossLanguageDefinitionsMap
                        .put(asyncClient.getPackageName() + "." + asyncClient.getClassName(), asyncClient.getCrossLanguageDefinitionId()));

        client.getSyncClients()
                .forEach(syncClient -> crossLanguageDefinitionsMap
                        .put(syncClient.getPackageName() + "." + syncClient.getClassName(), syncClient.getCrossLanguageDefinitionId()));

        client.getClientBuilders()
                .forEach(clientBuilder -> crossLanguageDefinitionsMap
                        .put(clientBuilder.getPackageName() + "." + clientBuilder.getClassName(), clientBuilder.getCrossLanguageDefinitionId()));

        for (AsyncSyncClient asyncClient : client.getAsyncClients()) {
            List<ConvenienceMethod> convenienceMethods = asyncClient.getConvenienceMethods();
            for (ConvenienceMethod convenienceMethod : convenienceMethods) {
                convenienceMethod.getConvenienceMethods()
                        .stream()
                        .filter(method -> !method.getName().endsWith("Async"))
                        .forEach(method -> crossLanguageDefinitionsMap.put(asyncClient.getPackageName() + "." + asyncClient.getClassName() + "." + method.getName(), method.getCrossLanguageDefinitionId()));
                if (!convenienceMethod.getProtocolMethod().getName().endsWith("Async")) {
                    crossLanguageDefinitionsMap.put(asyncClient.getPackageName() + "." + asyncClient.getClassName() + "." + convenienceMethod.getProtocolMethod().getName(),
                            convenienceMethod.getProtocolMethod().getCrossLanguageDefinitionId());
                }
            }
        }

        for (AsyncSyncClient syncClient : client.getSyncClients()) {
            List<ConvenienceMethod> convenienceMethods = syncClient.getConvenienceMethods();
            for (ConvenienceMethod convenienceMethod : convenienceMethods) {
                convenienceMethod.getConvenienceMethods()
                        .stream()
                        .filter(method -> !method.getName().endsWith("Async"))
                        .forEach(method -> crossLanguageDefinitionsMap.put(syncClient.getPackageName() + "." + syncClient.getClassName() + "." + method.getName(), method.getCrossLanguageDefinitionId()));

                if (!convenienceMethod.getProtocolMethod().getName().endsWith("Async")) {
                    crossLanguageDefinitionsMap.put(syncClient.getPackageName() + "." + syncClient.getClassName() + "." + convenienceMethod.getProtocolMethod().getName(),
                            convenienceMethod.getProtocolMethod().getCrossLanguageDefinitionId());
                }

            }
        }
        return client;
    }

    public JavaPackage processTemplates(CodeModel codeModel, Client client, JavaSettings settings) {
        return super.writeToTemplates(codeModel, client, settings, false);
    }

    @Override
    protected void writeClientModels(Client client, JavaPackage javaPackage, JavaSettings settings) {
        // Client model
        client.getModels().stream()
                .filter(ModelUtil::isGeneratingModel)
                .forEach(model -> {
                    crossLanguageDefinitionsMap.put(model.getPackage() + "." + model.getName(), model.getCrossLanguageDefinitionId());
                    javaPackage.addModel(model.getPackage(), model.getName(), model);
                });

        // Enum
        client.getEnums().stream()
                .filter(ModelUtil::isGeneratingModel)
                .forEach(model -> {
                    crossLanguageDefinitionsMap.put(model.getPackage() + "." + model.getName(), model.getCrossLanguageDefinitionId());
                    javaPackage.addEnum(model.getPackage(), model.getName(), model);
                });

        // Response
        client.getResponseModels().stream()
                .filter(ModelUtil::isGeneratingModel)
                .forEach(model -> javaPackage.addClientResponse(model.getPackage(), model.getName(), model));

        // Union
        client.getUnionModels().stream()
                .filter(ModelUtil::isGeneratingModel)
                .forEach(javaPackage::addUnionModel);
    }

    @Override
    protected void writeHelperClasses(Client client, CodeModel codeModel, JavaPackage javaPackage, JavaSettings settings) {
        // JsonMergePatchHelper
        List<ClientModel> jsonMergePatchModels = client.getModels().stream()
            .filter(model -> ModelUtil.isGeneratingModel(model) && ClientModelUtil.isJsonMergePatchModel(model, settings))
            .collect(Collectors.toList());
        if (!jsonMergePatchModels.isEmpty()) {
            javaPackage.addJsonMergePatchHelper(jsonMergePatchModels);
        }

        // MultipartFormDataHelper
        final boolean generateMultipartFormDataHelper = client.getModels().stream()
                .filter(ModelUtil::isGeneratingModel)
                .anyMatch(ClientModelUtil::isMultipartModel);
        if (generateMultipartFormDataHelper) {
            if (JavaSettings.getInstance().isBranded()) {
                javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()), ClientModelUtil.MULTI_PART_FORM_DATA_HELPER_CLASS_NAME);
            } else {
                javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                        ClientModelUtil.GENERIC_MULTI_PART_FORM_DATA_HELPER_CLASS_NAME,
                        ClientModelUtil.MULTI_PART_FORM_DATA_HELPER_CLASS_NAME);
            }
        }

        // OperationLocationPollingStrategy
        if (ClientModelUtil.requireOperationLocationPollingStrategy(codeModel)) {
            javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                    ClientModelUtil.OPERATION_LOCATION_POLLING_STRATEGY);
            javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                    ClientModelUtil.SYNC_OPERATION_LOCATION_POLLING_STRATEGY);
            javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                    ClientModelUtil.POLLING_UTILS);
        }
    }

    @Override
    public void writeFile(String fileName, String content, List<Object> sourceMap) {
        File outputFile = FileUtil.writeToFile(emitterOptions.getOutputDir(), fileName, content);
        LOGGER.info("Write file: {}", outputFile.getAbsolutePath());
    }

    private static final Map<String, Object> SETTINGS_MAP = new HashMap<>();

    static {
        SETTINGS_MAP.put("data-plane", true);

        SETTINGS_MAP.put("sdk-integration", true);
        SETTINGS_MAP.put("regenerate-pom", true);

        SETTINGS_MAP.put("license-header", "MICROSOFT_MIT_SMALL_TYPESPEC");
        SETTINGS_MAP.put("generate-client-interfaces", false);
        SETTINGS_MAP.put("generate-client-as-impl", true);
        SETTINGS_MAP.put("generate-sync-async-clients", true);
        SETTINGS_MAP.put("generate-builder-per-client", false);
        SETTINGS_MAP.put("sync-methods", "all");
        SETTINGS_MAP.put("enable-sync-stack", true);
        SETTINGS_MAP.put("enable-page-size", true);

        SETTINGS_MAP.put("use-default-http-status-code-to-exception-type-mapping", true);
        SETTINGS_MAP.put("polling", new HashMap<String, Object>());

        SETTINGS_MAP.put("client-logger", true);
        SETTINGS_MAP.put("required-fields-as-ctor-args", true);
        SETTINGS_MAP.put("required-parameter-client-methods", true);
        SETTINGS_MAP.put("generic-response-type", true);
        SETTINGS_MAP.put("output-model-immutable", true);
        SETTINGS_MAP.put("client-flattened-annotation-target", "disabled");
        SETTINGS_MAP.put("disable-required-property-annotation", true);
        // Defaulting to KeyCredential and not providing TypeSpec services to generate with AzureKeyCredential.
        SETTINGS_MAP.put("use-key-credential", true);
    }

    public Map<String, String> getCrossLanguageDefinitionMap() {
        return this.crossLanguageDefinitionsMap;
    }

    public static class MockConnection extends Connection {
        public MockConnection() {
            super(new OutputStream() {
                @Override
                public void write(int b) {
                    // NO-OP
                }
            }, null);
        }
    }

    public TypeSpecPlugin(EmitterOptions options, boolean sdkIntegration) {
        super(new MockConnection(), "dummy", "dummy");
        this.emitterOptions = options;
        SETTINGS_MAP.put("namespace", options.getNamespace());
        if (!CoreUtils.isNullOrEmpty(options.getOutputDir())) {
            SETTINGS_MAP.put("output-folder", options.getOutputDir());
        }
        if (!CoreUtils.isNullOrEmpty(options.getServiceName())) {
            SETTINGS_MAP.put("service-name", options.getServiceName());
        }
        if (options.getPartialUpdate() != null) {
            SETTINGS_MAP.put("partial-update", options.getPartialUpdate());
        }
        if (!CoreUtils.isNullOrEmpty(options.getServiceVersions())) {
            SETTINGS_MAP.put("service-versions", options.getServiceVersions());
        }
        if (options.getGenerateSamples() != null) {
            SETTINGS_MAP.put("generate-samples", options.getGenerateSamples());
        }
        if (options.getGenerateTests() != null) {
            SETTINGS_MAP.put("generate-tests", options.getGenerateTests());
        }
        if (options.getEnableSyncStack() != null) {
            SETTINGS_MAP.put("enable-sync-stack", options.getEnableSyncStack());
        }
        if (options.getStreamStyleSerialization() != null) {
            SETTINGS_MAP.put("stream-style-serialization", options.getStreamStyleSerialization());
        }

        SETTINGS_MAP.put("sdk-integration", sdkIntegration);
        SETTINGS_MAP.put("regenerate-pom", sdkIntegration);

        if (options.getCustomTypes() != null) {
            SETTINGS_MAP.put("custom-types", options.getCustomTypes());
        }

        if (options.getCustomTypeSubpackage() != null) {
            SETTINGS_MAP.put("custom-types-subpackage", options.getCustomTypeSubpackage());
        }

        if (options.getModelsSubpackage() != null) {
            SETTINGS_MAP.put("models-subpackage", options.getModelsSubpackage());
        }

        if (options.getCustomizationClass() != null) {
            SETTINGS_MAP.put("customization-class",
                Paths.get(options.getOutputDir()).resolve(options.getCustomizationClass()).toAbsolutePath().toString());
        }

        if (emitterOptions.getPolling() != null) {
            SETTINGS_MAP.put("polling", options.getPolling());
        }

        if (options.getFlavor() != null) {
            SETTINGS_MAP.put("flavor", options.getFlavor());
        }

        if (options.getFlavor() != null && !"azure".equalsIgnoreCase(options.getFlavor())) {
            SETTINGS_MAP.put("sdk-integration", false);
            SETTINGS_MAP.put("license-header", "SMALL_TYPESPEC");

            SETTINGS_MAP.put("sync-methods", "sync-only");
            SETTINGS_MAP.put("generate-samples", false);
            SETTINGS_MAP.put("generate-tests", false);
        }
        JavaSettingsAccessor.setHost(this);
        LOGGER.info("Output folder: {}", options.getOutputDir());
        LOGGER.info("Namespace: {}", JavaSettings.getInstance().getPackage());

        Mappers.setFactory(new TypeSpecMapperFactory());
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T getValue(String key, ReadValueCallback<String, T> converter) {
        return (T) SETTINGS_MAP.get(key);
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T getValueWithJsonReader(String key, ReadValueCallback<JsonReader, T> converter) {
        return (T) SETTINGS_MAP.get(key);
    }

    @Override
    public void message(Message message) {
        String log = message.getText();
        switch (message.getChannel()) {
            case INFORMATION:
                LOGGER.info(log);
                break;

            case WARNING:
                LOGGER.warn(log);
                break;

            case ERROR:
            case FATAL:
                LOGGER.error(log);
                break;

            case DEBUG:
                LOGGER.debug(log);
                break;

            default:
                LOGGER.info(log);
                break;
        }
    }
}
