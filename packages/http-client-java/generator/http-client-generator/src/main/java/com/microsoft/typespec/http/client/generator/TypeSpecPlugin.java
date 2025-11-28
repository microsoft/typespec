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
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientException;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ConvenienceMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.TypeSpecMetadata;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.preprocessor.Preprocessor;
import com.microsoft.typespec.http.client.generator.core.preprocessor.tranformer.Transformer;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.mapper.TypeSpecAzureVNextMapperFactory;
import com.microsoft.typespec.http.client.generator.mapper.TypeSpecClientCoreMapperFactory;
import com.microsoft.typespec.http.client.generator.mapper.TypeSpecMapperFactory;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import com.microsoft.typespec.http.client.generator.util.FileUtil;
import com.microsoft.typespec.http.client.generator.util.MetadataUtil;
import com.microsoft.typespec.http.client.generator.util.ModelUtil;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.OutputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TypeSpecPlugin extends Javagen {

    private static final Logger LOGGER = LoggerFactory.getLogger(TypeSpecPlugin.class);

    private final EmitterOptions emitterOptions;

    public Client processClient(CodeModel codeModel) {
        // transform code model
        codeModel = new Transformer().transform(Preprocessor.convertOptionalConstantsToEnum(codeModel));

        // map to client model
        return Mappers.getClientMapper().map(codeModel);
    }

    public JavaPackage processTemplates(CodeModel codeModel, Client client, JavaSettings settings) {
        JavaPackage javaPackage = super.writeToTemplates(codeModel, client, settings, false);

        if (emitterOptions.getIncludeApiViewProperties() == Boolean.TRUE) {
            TypeSpecMetadata metadata
                = new TypeSpecMetadata(ClientModelUtil.getArtifactId(), emitterOptions.getFlavor(),
                    emitterOptions.getApiVersion() == null
                        ? MetadataUtil.getLatestApiVersionFromClient(codeModel)
                        : emitterOptions.getApiVersion(),
                    collectCrossLanguageDefinitions(client),
                    FileUtil.filterForJavaSourceFiles(javaPackage.getJavaFiles().stream().map(JavaFile::getFilePath)));
            javaPackage.addTypeSpecMetadata(metadata, null);
        }

        return javaPackage;
    }

    @Override
    protected void writeClientModels(Client client, JavaPackage javaPackage, JavaSettings settings) {
        // Client model
        client.getModels().stream().filter(ModelUtil::isGeneratingModel).forEach(model -> {
            javaPackage.addModel(model.getPackage(), model.getName(), model);
        });

        // Enum
        client.getEnums().stream().filter(ModelUtil::isGeneratingModel).forEach(model -> {
            javaPackage.addEnum(model.getPackage(), model.getName(), model);
        });

        // Response
        client.getResponseModels()
            .stream()
            .filter(ModelUtil::isGeneratingModel)
            .forEach(model -> javaPackage.addClientResponse(model.getPackage(), model.getName(), model));

        // Exception
        for (ClientException exception : client.getExceptions()) {
            javaPackage.addException(exception.getPackage(), exception.getName(), exception);
        }

        // Union
        client.getUnionModels().stream().filter(ModelUtil::isGeneratingModel).forEach(javaPackage::addUnionModel);
    }

    @Override
    protected void writeHelperClasses(Client client, CodeModel codeModel, JavaPackage javaPackage,
        JavaSettings settings) {
        // JsonMergePatchHelper
        List<ClientModel> jsonMergePatchModels = client.getModels()
            .stream()
            .filter(
                model -> ModelUtil.isGeneratingModel(model) && ClientModelUtil.isJsonMergePatchModel(model, settings))
            .collect(Collectors.toList());
        if (!jsonMergePatchModels.isEmpty()) {
            javaPackage.addJsonMergePatchHelper(jsonMergePatchModels);
        }

        // MultipartFormDataHelper
        final boolean generateMultipartFormDataHelper = client.getModels()
            .stream()
            .filter(ModelUtil::isGeneratingModel)
            .anyMatch(ClientModelUtil::isMultipartModel);
        if (generateMultipartFormDataHelper) {
            if (JavaSettings.getInstance().isAzureV1()) {
                javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                    ClientModelUtil.MULTI_PART_FORM_DATA_HELPER_CLASS_NAME);
            } else {
                javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                    ClientModelUtil.GENERIC_MULTI_PART_FORM_DATA_HELPER_CLASS_NAME,
                    ClientModelUtil.MULTI_PART_FORM_DATA_HELPER_CLASS_NAME);
            }
        }

        // OperationLocationPollingStrategy
        if (ClientModelUtil.requireOperationLocationPollingStrategy(codeModel)) {
            if (JavaSettings.getInstance().isAzureV2()) {
                javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                    ClientModelUtil.CLIENT_CORE_OPERATION_LOCATION_POLLING_STRATEGY,
                    ClientModelUtil.OPERATION_LOCATION_POLLING_STRATEGY);
                javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                    ClientModelUtil.CLIENT_CORE_POLLING_UTILS, ClientModelUtil.POLLING_UTILS);
            } else {
                javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                    ClientModelUtil.OPERATION_LOCATION_POLLING_STRATEGY);
                javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                    ClientModelUtil.SYNC_OPERATION_LOCATION_POLLING_STRATEGY);
                javaPackage.addJavaFromResources(settings.getPackage(settings.getImplementationSubpackage()),
                    ClientModelUtil.POLLING_UTILS);
            }

        }
    }

    @Override
    public void writeFile(String fileName, String content, List<Object> sourceMap) {
        Path outputFile = FileUtil.writeToFile(emitterOptions.getOutputDir(), fileName, content);
        LOGGER.info("Write file: {}", outputFile.toAbsolutePath());
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
        SETTINGS_MAP.put("use-rest-proxy", false);
    }

    public static class MockConnection extends Connection {
        public MockConnection() {
            super(new OutputStream() {
                @Override
                public void write(int b) {
                    // NO-OP
                }
            }, null);
            // it's a mock connection, we don't need it to do anything
            stop();
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
        if (options.getUseObjectForUnknown()) {
            SETTINGS_MAP.put("use-object-for-unknown", emitterOptions.getUseObjectForUnknown());
        }
        if (options.getUseRestProxy() != null) {
            SETTINGS_MAP.put("use-rest-proxy", emitterOptions.getUseRestProxy());
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

        if (options.getPolling() != null) {
            SETTINGS_MAP.put("polling", options.getPolling());
        }

        if (options.getUseDefaultHttpStatusCodeToExceptionTypeMapping() != null) {
            SETTINGS_MAP.put("use-default-http-status-code-to-exception-type-mapping",
                options.getUseDefaultHttpStatusCodeToExceptionTypeMapping());
        }

        if (options.getRenameModel() != null) {
            SETTINGS_MAP.put("rename-model", options.getRenameModel());
        }

        if (options.getFlavor() != null) {
            SETTINGS_MAP.put("flavor", options.getFlavor());
        }

        if (options.getFlavor() != null && !"azure".equalsIgnoreCase(options.getFlavor())) {
            SETTINGS_MAP.put("data-plane", false);

            SETTINGS_MAP.put("sync-methods", "sync-only");
            SETTINGS_MAP.put("enable-page-size", false);
            SETTINGS_MAP.put("use-default-http-status-code-to-exception-type-mapping", false);
            SETTINGS_MAP.put("generate-samples", false);
            SETTINGS_MAP.put("generate-tests", false);

            if (options.getLicenseHeader() != null) {
                SETTINGS_MAP.put("license-header", options.getLicenseHeader());
            } else {
                SETTINGS_MAP.remove("license-header");
            }
            SETTINGS_MAP.put("disable-typed-headers-methods", true);
        }

        if (options.getFlavor() != null && "azurev2".equalsIgnoreCase(options.getFlavor())) {
            SETTINGS_MAP.put("data-plane", false);
            SETTINGS_MAP.put("sdk-integration", false);
            SETTINGS_MAP.put("license-header", "MICROSOFT_MIT_SMALL_TYPESPEC");
            SETTINGS_MAP.put("use-default-http-status-code-to-exception-type-mapping", false);

            SETTINGS_MAP.put("sync-methods", "sync-only");
            SETTINGS_MAP.put("generate-samples", false);
            SETTINGS_MAP.put("generate-tests", false);
            SETTINGS_MAP.put("disable-typed-headers-methods", true);
        }

        JavaSettingsAccessor.setHost(this);
        LOGGER.info("Output folder: {}", options.getOutputDir());
        LOGGER.info("Namespace: {}", JavaSettings.getInstance().getPackage());

        if (options.getFlavor() != null && options.getFlavor().equalsIgnoreCase("azure")) {
            Mappers.setFactory(new TypeSpecMapperFactory());
        } else if (options.getFlavor() != null && options.getFlavor().equalsIgnoreCase("azurev2")) {
            Mappers.setFactory(new TypeSpecAzureVNextMapperFactory());
        } else {
            Mappers.setFactory(new TypeSpecClientCoreMapperFactory());
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
        return (T) SETTINGS_MAP.get(key);
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T getValueWithJsonReader(String key, IOExceptionCheckedFunction<JsonReader, T> converter) {
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

    private Map<String, String> collectCrossLanguageDefinitions(Client client) {
        final Map<String, String> crossLanguageDefinitionsMap = new TreeMap<>();

        // Client
        client.getAsyncClients()
            .forEach(asyncClient -> crossLanguageDefinitionsMap.put(
                asyncClient.getPackageName() + "." + asyncClient.getClassName(),
                asyncClient.getCrossLanguageDefinitionId()));

        client.getSyncClients()
            .forEach(syncClient -> crossLanguageDefinitionsMap.put(
                syncClient.getPackageName() + "." + syncClient.getClassName(),
                syncClient.getCrossLanguageDefinitionId()));

        client.getClientBuilders()
            .forEach(clientBuilder -> crossLanguageDefinitionsMap.put(
                clientBuilder.getPackageName() + "." + clientBuilder.getClassName(),
                clientBuilder.getCrossLanguageDefinitionId()));

        // Method
        for (AsyncSyncClient asyncClient : client.getAsyncClients()) {
            List<ConvenienceMethod> convenienceMethods = asyncClient.getConvenienceMethods();
            for (ConvenienceMethod convenienceMethod : convenienceMethods) {
                convenienceMethod.getConvenienceMethods()
                    .stream()
                    .filter(method -> !method.getName().endsWith("Async"))
                    .forEach(method -> crossLanguageDefinitionsMap.put(
                        asyncClient.getPackageName() + "." + asyncClient.getClassName() + "." + method.getName(),
                        method.getCrossLanguageDefinitionId()));

                if (!convenienceMethod.getProtocolMethod().getName().endsWith("Async")) {
                    crossLanguageDefinitionsMap.put(
                        asyncClient.getPackageName() + "." + asyncClient.getClassName() + "."
                            + convenienceMethod.getProtocolMethod().getName(),
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
                    .forEach(method -> crossLanguageDefinitionsMap.put(
                        syncClient.getPackageName() + "." + syncClient.getClassName() + "." + method.getName(),
                        method.getCrossLanguageDefinitionId()));

                if (!convenienceMethod.getProtocolMethod().getName().endsWith("Async")) {
                    crossLanguageDefinitionsMap.put(
                        syncClient.getPackageName() + "." + syncClient.getClassName() + "."
                            + convenienceMethod.getProtocolMethod().getName(),
                        convenienceMethod.getProtocolMethod().getCrossLanguageDefinitionId());
                }
            }
        }

        // Client model
        client.getModels().stream().filter(ModelUtil::isGeneratingModel).forEach(model -> {
            crossLanguageDefinitionsMap.put(model.getPackage() + "." + model.getName(),
                model.getCrossLanguageDefinitionId());
        });

        // Enum
        client.getEnums().stream().filter(ModelUtil::isGeneratingModel).forEach(model -> {
            crossLanguageDefinitionsMap.put(model.getPackage() + "." + model.getName(),
                model.getCrossLanguageDefinitionId());
        });

        return crossLanguageDefinitionsMap;
    }
}
