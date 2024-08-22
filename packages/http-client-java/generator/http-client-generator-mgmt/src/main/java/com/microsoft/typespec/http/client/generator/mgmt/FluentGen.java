// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.ExampleParser;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.FluentMapper;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.FluentMapperFactory;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.FluentPomMapper;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentClient;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentLiveTests;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentMethodMockUnitTest;
import com.microsoft.typespec.http.client.generator.mgmt.model.javamodel.FluentJavaPackage;
import com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel.FluentProject;
import com.microsoft.typespec.http.client.generator.mgmt.namer.FluentNamerFactory;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentTemplateFactory;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientBuilder;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientException;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientResponse;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PackageInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.UnionModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.XmlSequenceWrapper;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.TextFile;
import com.microsoft.typespec.http.client.generator.core.model.xmlmodel.XmlFile;
import com.microsoft.typespec.http.client.generator.core.postprocessor.Postprocessor;
import com.microsoft.typespec.http.client.generator.core.template.Templates;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.util.CoreUtils;
import org.slf4j.Logger;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;
import org.yaml.snakeyaml.inspector.TrustedTagInspector;
import org.yaml.snakeyaml.introspector.Property;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.Tag;
import org.yaml.snakeyaml.representer.Representer;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class FluentGen extends Javagen {

    private final Logger logger = new PluginLogger(this, FluentGen.class);
    static FluentGen instance;

    private FluentJavaSettings fluentJavaSettings;
    private FluentMapper fluentMapper;

    private List<FluentExample> fluentPremiumExamples;

    public FluentGen(Connection connection, String plugin, String sessionId) {
        super(connection, plugin, sessionId);
        instance = this;
        Javagen.instance = this;
        ClientModelUtil.setGetClientModelFunction(FluentUtils::getClientModel);
    }

    public static FluentGen getPluginInstance() {
        return instance;
    }

    @Override
    public boolean processInternal() {
        this.clear();

        try {
            JavaSettings settings = JavaSettings.getInstance();

            logger.info("Read YAML");
            // Parse yaml to code model
            CodeModel codeModel = new FluentNamer(this, connection, pluginName, sessionId)
                .processCodeModel();

            // Map code model to client model
            Client client = this.handleMap(codeModel);

            // Write to templates
            FluentJavaPackage javaPackage = this.handleTemplate(client);

            // Fluent Lite
            this.handleFluentLite(codeModel, client, javaPackage);

            // Print to files
            logger.info("Write Java");
            Postprocessor.writeToFiles(javaPackage.getJavaFiles().stream()
                .collect(Collectors.toMap(JavaFile::getFilePath, file -> file.getContents().toString())), this, logger);

            logger.info("Write Xml");
            for (XmlFile xmlFile : javaPackage.getXmlFiles()) {
                writeFile(xmlFile.getFilePath(), xmlFile.getContents().toString(), null);
            }
            logger.info("Write Text");
            for (TextFile textFile : javaPackage.getTextFiles()) {
                writeFile(textFile.getFilePath(), textFile.getContents(), null);
            }
            return true;
        } catch (Exception e) {
            logger.error("Failed to successfully run fluentgen plugin " + e, e);
            //connection.sendError(1, 500, "Error occurred while running fluentgen plugin: " + e.getMessage());
            return false;
        }
    }

    CodeModel handleYaml(String yamlContent) {
        Representer representer = new Representer(new DumperOptions()) {
            @Override
            protected NodeTuple representJavaBeanProperty(Object javaBean, Property property, Object propertyValue, Tag customTag) {
                // if value of property is null, ignore it.
                if (propertyValue == null) {
                    return null;
                }
                else {
                    return super.representJavaBeanProperty(javaBean, property, propertyValue, customTag);
                }
            }
        };
        LoaderOptions loaderOptions = new LoaderOptions();
        loaderOptions.setCodePointLimit(50 * 1024 * 1024);
        loaderOptions.setMaxAliasesForCollections(Integer.MAX_VALUE);
        loaderOptions.setNestingDepthLimit(Integer.MAX_VALUE);
        loaderOptions.setTagInspector(new TrustedTagInspector());
        Yaml newYaml = new Yaml(new Constructor(loaderOptions), representer, new DumperOptions(), loaderOptions);
        return newYaml.loadAs(yamlContent, CodeModel.class);
    }

    protected Client handleMap(CodeModel codeModel) {
        JavaSettings settings = JavaSettings.getInstance();
        FluentStatic.setFluentJavaSettings(getFluentJavaSettings());

        FluentMapper fluentMapper = this.getFluentMapper();

        logger.info("Map code model to client model");
        fluentMapper.preModelMap(codeModel);

        Client client = Mappers.getClientMapper().map(codeModel);

        // samples for Fluent Premium
        if (fluentJavaSettings.isGenerateSamples() && settings.isFluentPremium()) {
            FluentStatic.setClient(client);
            ExampleParser exampleParser = new ExampleParser();
            fluentPremiumExamples = client.getServiceClient().getMethodGroupClients().stream()
                    .flatMap(mg -> exampleParser.parseMethodGroup(mg).stream())
                    .collect(Collectors.toList());
        }

        return client;
    }

    protected FluentJavaPackage handleTemplate(Client client) {
        JavaSettings javaSettings = JavaSettings.getInstance();

        logger.info("Java template for client model");
        FluentJavaPackage javaPackage = new FluentJavaPackage(this);

        // Service client
        String interfacePackage = ClientModelUtil.getServiceClientInterfacePackageName();
        if (CoreUtils.isNullOrEmpty(client.getServiceClients())) {
            ServiceClient serviceClient = client.getServiceClient();
            addServiceClient(javaSettings, javaPackage, interfacePackage, serviceClient);
        } else {
            addServiceClient(javaSettings, javaPackage, interfacePackage, client.getServiceClients().iterator().next());
        }

        // Async/sync service clients
        if (!javaSettings.isFluentLite()) {
            // fluent lite only expose sync client
            for (AsyncSyncClient asyncClient : client.getAsyncClients()) {
                javaPackage.addAsyncServiceClient(asyncClient.getPackageName(), asyncClient);
            }
        }
        for (AsyncSyncClient syncClient : client.getSyncClients()) {
            javaPackage.addSyncServiceClient(syncClient.getPackageName(), syncClient);
        }

        // Service client builder
        for (ClientBuilder clientBuilder : client.getClientBuilders()) {
            javaPackage.addServiceClientBuilder(clientBuilder);
        }

        // Method group
        for (MethodGroupClient methodGroupClient : client.getServiceClient().getMethodGroupClients()) {
            javaPackage.addMethodGroup(methodGroupClient.getPackage(), methodGroupClient.getClassName(), methodGroupClient);
            if (javaSettings.isGenerateClientInterfaces()) {
                javaPackage.addMethodGroupInterface(interfacePackage, methodGroupClient.getInterfaceName(), methodGroupClient);
            }
        }

        // Response
        for (ClientResponse response : client.getResponseModels()) {
            javaPackage.addClientResponse(response.getPackage(), response.getName(), response);
        }

        // Client model
        for (ClientModel model : client.getModels()) {
            javaPackage.addModel(model.getPackage(), model.getName(), model);
        }

        // Enum
        for (EnumType enumType : client.getEnums()) {
            javaPackage.addEnum(enumType.getPackage(), enumType.getName(), enumType);
        }

        // XML sequence wrapper
        for (XmlSequenceWrapper xmlSequenceWrapper : client.getXmlSequenceWrappers()) {
            javaPackage.addXmlSequenceWrapper(xmlSequenceWrapper.getPackage(),
                    xmlSequenceWrapper.getWrapperClassName(), xmlSequenceWrapper);
        }

        // Exception
        for (ClientException exception : client.getExceptions()) {
            javaPackage.addException(exception.getPackage(), exception.getName(), exception);
        }

        // Package-info
        for (PackageInfo packageInfo : client.getPackageInfos()) {
            javaPackage.addPackageInfo(packageInfo.getPackage(), "package-info", packageInfo);
        }

        // GraalVM config
        if (javaSettings.isGenerateGraalVmConfig()) {
            String artifactId = FluentUtils.getArtifactId();
            if (fluentJavaSettings.getGraalVmConfigSuffix().isPresent()) {
                artifactId = artifactId + "_" + fluentJavaSettings.getGraalVmConfigSuffix().get();
            }
            javaPackage.addGraalVmConfig("com.azure.resourcemanager", artifactId, client.getGraalVmConfig());
        }

        // Samples
        if (fluentPremiumExamples != null) {
            for (FluentExample example : fluentPremiumExamples) {
                javaPackage.addSample(example);
            }
        }

        if (javaSettings.isGenerateTests()) {
            // Unit tests for models
            for (ClientModel model : client.getModels()) {
                if (!model.isStronglyTypedHeader()) {
                    javaPackage.addModelUnitTest(model);
                }
            }
        }

        return javaPackage;
    }

    private void addServiceClient(JavaSettings javaSettings, FluentJavaPackage javaPackage, String interfacePackage, ServiceClient serviceClient) {
        javaPackage
                .addServiceClient(serviceClient.getPackage(), serviceClient.getClassName(),
                        serviceClient);
        if (javaSettings.isGenerateClientInterfaces()) {
            javaPackage
                    .addServiceClientInterface(interfacePackage, serviceClient.getInterfaceName(), serviceClient);
        }
    }

    protected FluentClient handleFluentLite(CodeModel codeModel, Client client, FluentJavaPackage javaPackage) {
        FluentJavaSettings fluentJavaSettings = this.getFluentJavaSettings();
        JavaSettings javaSettings = JavaSettings.getInstance();

        FluentClient fluentClient = null;

        // Fluent Lite
        if (javaSettings.isFluentLite()) {
            final boolean isSdkIntegration = fluentJavaSettings.isSdkIntegration();
            FluentStatic.setFluentJavaSettings(fluentJavaSettings);
            FluentStatic.setClient(client);

            logger.info("Process for Fluent Lite, SDK integration {}", (isSdkIntegration ? "enabled" : "disabled"));

            fluentClient = this.getFluentMapper().map(codeModel, client);

            // project
            FluentProject project = new FluentProject(fluentClient);
            if (isSdkIntegration) {
                project.integrateWithSdk();
            }

            // Fluent manager
            javaPackage.addFluentManager(fluentClient.getManager(), project);

            // Fluent resource models
            for (FluentResourceModel model : fluentClient.getResourceModels()) {
                javaPackage.addFluentResourceModel(model);
            }

            // Fluent resource collections
            for (FluentResourceCollection collection : fluentClient.getResourceCollections()) {
                javaPackage.addFluentResourceCollection(collection);
            }

            // Utils
            javaPackage.addResourceManagerUtils();

            // module-info
            javaPackage.addModuleInfo(fluentClient.getModuleInfo());

            // package-info
            ensureModelsPackageInfos(javaPackage, fluentClient);

            // POM
            if (javaSettings.isRegeneratePom()) {
                Pom pom = new FluentPomMapper().map(project);
                javaPackage.addPom(fluentJavaSettings.getPomFilename(), pom);
            }

            // Samples
            List<JavaFile> sampleJavaFiles = new ArrayList<>();
            for (FluentExample example : fluentClient.getExamples()) {
                sampleJavaFiles.add(javaPackage.addSample(example));
            }

            // Readme and Changelog
            if (isSdkIntegration) {
                javaPackage.addReadmeMarkdown(project);
                javaPackage.addChangelogMarkdown(project.getChangelog());
                if (fluentJavaSettings.isGenerateSamples() && project.getSdkRepositoryUri().isPresent()) {
                    javaPackage.addSampleMarkdown(fluentClient.getExamples(), sampleJavaFiles);
                }
            }

            // Tests
            if (javaSettings.isGenerateTests()) {
                // Live tests
                for (FluentLiveTests liveTests : fluentClient.getLiveTests()) {
                    javaPackage.addLiveTests(liveTests);
                }

                // Unit tests for APIs
                for (FluentMethodMockUnitTest unitTest : fluentClient.getMockUnitTests()) {
                    javaPackage.addOperationUnitTest(unitTest);
                }
            }
        }

        return fluentClient;
    }

    // Fix the case where there are no models but only resource collections.
    private void ensureModelsPackageInfos(FluentJavaPackage javaPackage, FluentClient fluentClient) {
        Set<String> packageInfos = fluentClient
            .getInnerClient().getPackageInfos()
            .stream()
            .map(PackageInfo::getPackage)
            .collect(Collectors.toSet());

        for (FluentResourceCollection resourceCollection : fluentClient.getResourceCollections()) {
            String packageName = resourceCollection.getInterfaceType().getPackage();
            if (!packageInfos.contains(packageName)) {
                javaPackage.addPackageInfo(
                    packageName,
                    "package-info",
                    new PackageInfo(
                        packageName,
                        String.format("Package containing the data models for %s.\n%s", fluentClient.getInnerClient().getClientName(),
                            fluentClient.getInnerClient().getClientDescription())));
                packageInfos.add(packageName);
            }
        }
    }

    void clear() {
        FluentStatic.setClient(null);
        FluentStatic.setFluentClient(null);
        FluentStatic.setFluentJavaSettings(null);

        JavaSettings.clear();
        ClientModels.getInstance().clear();
        UnionModels.getInstance().clear();
        fluentJavaSettings = null;
        fluentMapper = null;
        fluentPremiumExamples = null;
    }

    protected FluentJavaSettings getFluentJavaSettings() {
        if (fluentJavaSettings == null) {
            fluentJavaSettings = new FluentJavaSettings(this);
        }
        return fluentJavaSettings;
    }

    protected FluentMapper getFluentMapper() {
        if (fluentMapper == null) {
            // use fluent mapper and template
            Mappers.setFactory(new FluentMapperFactory());
            Templates.setFactory(new FluentTemplateFactory());

            FluentJavaSettings fluentJavaSettings = getFluentJavaSettings();
            CodeNamer.setFactory(new FluentNamerFactory(fluentJavaSettings));

            fluentMapper = new FluentMapper(fluentJavaSettings);
        }
        return fluentMapper;
    }
}
