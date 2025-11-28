// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent;

import com.microsoft.typespec.http.client.generator.JavaSettingsAccessor;
import com.microsoft.typespec.http.client.generator.TypeSpecPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.TypeSpecMetadata;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.FluentMapper;
import com.microsoft.typespec.http.client.generator.mgmt.model.javamodel.FluentJavaPackage;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import com.microsoft.typespec.http.client.generator.util.FileUtil;
import com.microsoft.typespec.http.client.generator.util.MetadataUtil;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TypeSpecFluentPlugin extends FluentGen {
    private static final Logger LOGGER = LoggerFactory.getLogger(TypeSpecFluentPlugin.class);
    private final EmitterOptions emitterOptions;

    public TypeSpecFluentPlugin(EmitterOptions options, boolean sdkIntegration, String title) {
        super(new TypeSpecPlugin.MockConnection(), "dummy", "dummy");
        this.emitterOptions = options;

        SETTINGS_MAP.put("title", title);
        SETTINGS_MAP.put("namespace", options.getNamespace());
        if (!CoreUtils.isNullOrEmpty(options.getOutputDir())) {
            SETTINGS_MAP.put("output-folder", options.getOutputDir());
        }
        if (!CoreUtils.isNullOrEmpty(options.getServiceName())) {
            SETTINGS_MAP.put("service-name", options.getServiceName());
        }
        if (options.getGenerateSamples() != null) {
            SETTINGS_MAP.put("generate-samples", options.getGenerateSamples());
        }
        if (options.getGenerateTests() != null) {
            SETTINGS_MAP.put("generate-tests", options.getGenerateTests());
        }
        if (options.getClientSideValidations() != null) {
            SETTINGS_MAP.put("client-side-validations", options.getClientSideValidations());
        }
        if (options.getArm()) {
            if (options.getPremium()) {
                SETTINGS_MAP.put("fluent", "premium");
            } else {
                SETTINGS_MAP.put("fluent", "lite");
            }
        }
        if (options.getPackageVersion() != null) {
            SETTINGS_MAP.put("package-version", options.getPackageVersion());
        }
        if (options.getEnableSyncStack() != null) {
            SETTINGS_MAP.put("enable-sync-stack", options.getEnableSyncStack());
        }
        SETTINGS_MAP.put("sdk-integration", sdkIntegration);
        SETTINGS_MAP.put("output-model-immutable", true);
        SETTINGS_MAP.put("stream-style-serialization", options.getStreamStyleSerialization());
        SETTINGS_MAP.put("uuid-as-string", options.getUuidAsString());
        SETTINGS_MAP.put("use-object-for-unknown", options.getUseObjectForUnknown());
        if (options.getRenameModel() != null) {
            SETTINGS_MAP.put("rename-model", options.getRenameModel());
        }

        // mgmt
        if (options.getAddInner() != null) {
            SETTINGS_MAP.put("add-inner", options.getAddInner());
        }
        if (options.getRemoveInner() != null) {
            SETTINGS_MAP.put("remove-inner", options.getRemoveInner());
        }
        if (options.getPreserveModel() != null) {
            SETTINGS_MAP.put("preserve-model", options.getPreserveModel());
        }
        if (options.getGenerateAsyncMethods() != null) {
            SETTINGS_MAP.put("generate-async-methods", options.getGenerateAsyncMethods());
        }
        if (options.getPropertyIncludeAlways() != null) {
            // always serialize this property, even if the value is null
            SETTINGS_MAP.put("property-include-always", options.getPropertyIncludeAlways());
        }
        if (options.getResourceCollectionAssociations() != null) {
            SETTINGS_MAP.put("resource-collection-associations", options.getResourceCollectionAssociations());
        }
        if (options.getMetadataSuffix() != null) {
            SETTINGS_MAP.put("metadata-suffix", options.getMetadataSuffix());
        }

        if (options.getCustomizationClass() != null) {
            SETTINGS_MAP.put("customization-class",
                Paths.get(options.getOutputDir()).resolve(options.getCustomizationClass()).toAbsolutePath().toString());
        }

        JavaSettingsAccessor.setHost(this);
        LOGGER.info("Output folder: {}", options.getOutputDir());
        LOGGER.info("Namespace: {}", JavaSettings.getInstance().getPackage());
    }

    public CodeModel preProcess(CodeModel codeModel) {
        // transform code model
        FluentNamer fluentNamer = new TypeSpecFluentNamer(this, pluginName, sessionId, SETTINGS_MAP, codeModel);
        return fluentNamer.processCodeModel();
    }

    public Client processClient(CodeModel codeModel) {
        // call FluentGen.handleMap
        return handleMap(codeModel);
    }

    public FluentJavaPackage processTemplates(CodeModel codeModel, Client client) {
        final String apiVersion = emitterOptions.getApiVersion() == null
            ? MetadataUtil.getLatestApiVersionFromClient(codeModel)
            : emitterOptions.getApiVersion();

        FluentJavaPackage javaPackage = handleTemplate(client);
        handleFluentLite(codeModel, client, javaPackage, apiVersion);

        if (emitterOptions.getIncludeApiViewProperties() == Boolean.TRUE) {
            TypeSpecMetadata metadata = new TypeSpecMetadata(FluentUtils.getArtifactId(), emitterOptions.getFlavor(),
                apiVersion, collectCrossLanguageDefinitions(client),
                FileUtil.filterForJavaSourceFiles(javaPackage.getJavaFiles().stream().map(JavaFile::getFilePath)));
            javaPackage.addTypeSpecMetadata(metadata, getFluentJavaSettings().getMetadataSuffix().orElse(null));
        }

        return javaPackage;
    }

    @Override
    public void writeFile(String fileName, String content, List<Object> sourceMap) {
        Path outputFile = FileUtil.writeToFile(emitterOptions.getOutputDir(), fileName, content);
        LOGGER.info("Write file: {}", outputFile.toAbsolutePath());
    }

    @Override
    protected FluentMapper getFluentMapper() {
        FluentMapper fluentMapper = super.getFluentMapper();
        Mappers.setFactory(new TypeSpecFluentMapperFactory());
        return fluentMapper;
    }

    private static final Map<String, Object> SETTINGS_MAP = new HashMap<>();

    // from fluentnamer/readme.md
    static {
        SETTINGS_MAP.put("data-plane", false);

        SETTINGS_MAP.put("sdk-integration", true);
        SETTINGS_MAP.put("regenerate-pom", true);

        SETTINGS_MAP.put("license-header", "MICROSOFT_MIT_SMALL_TYPESPEC");

        SETTINGS_MAP.put("generic-response-type", false);
        SETTINGS_MAP.put("generate-client-interfaces", true);
        SETTINGS_MAP.put("client-logger", true);

        SETTINGS_MAP.put("required-parameter-client-methods", true);
        SETTINGS_MAP.put("client-flattened-annotation-target", "none");
        SETTINGS_MAP.put("null-byte-array-maps-to-empty-array", true);
        SETTINGS_MAP.put("graal-vm-config", true);
        SETTINGS_MAP.put("sync-methods", "all");
        SETTINGS_MAP.put("stream-style-serialization", false);
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
        if (!JavaSettings.getInstance().isFluentLite()) {
            return null;
        }

        final Map<String, String> crossLanguageDefinitionsMap = new TreeMap<>();

        String interfacePackage = ClientModelUtil.getServiceClientInterfacePackageName();

        // Client interface
        crossLanguageDefinitionsMap.put(interfacePackage + "." + client.getServiceClient().getInterfaceName(),
            client.getServiceClient().getCrossLanguageDefinitionId());

        client.getServiceClient()
            .getMethodGroupClients()
            .forEach(methodGroupClient -> crossLanguageDefinitionsMap.put(
                interfacePackage + "." + methodGroupClient.getInterfaceName(),
                methodGroupClient.getCrossLanguageDefinitionId()));

        client.getClientBuilders()
            .forEach(clientBuilder -> crossLanguageDefinitionsMap.put(
                clientBuilder.getPackageName() + "." + clientBuilder.getClassName(),
                clientBuilder.getCrossLanguageDefinitionId()));

        // Methods
        client.getServiceClient()
            .getMethodGroupClients()
            .forEach(methodGroupClient -> methodGroupClient.getClientMethods().forEach(method -> {
                if (method.getMethodVisibility() == JavaVisibility.Public) {
                    crossLanguageDefinitionsMap.put(
                        interfacePackage + "." + methodGroupClient.getInterfaceName() + "." + method.getName(),
                        method.getCrossLanguageDefinitionId());
                }
            }));

        // Client model
        client.getModels().forEach(model -> {
            crossLanguageDefinitionsMap.put(model.getPackage() + "." + model.getName(),
                model.getCrossLanguageDefinitionId());
        });

        // Enum
        client.getEnums().forEach(model -> {
            crossLanguageDefinitionsMap.put(model.getPackage() + "." + model.getName(),
                model.getCrossLanguageDefinitionId());
        });

        return crossLanguageDefinitionsMap;
    }
}
