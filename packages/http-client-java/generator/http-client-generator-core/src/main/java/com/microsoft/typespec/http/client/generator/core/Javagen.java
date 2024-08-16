// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core;

import com.microsoft.typespec.http.client.generator.core.extension.jsonrpc.Connection;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ApiVersion;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.mapper.PomMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientBuilder;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientException;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientResponse;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PackageInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProtocolExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceVersion;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.TestContext;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.UnionModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.XmlSequenceWrapper;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.TextFile;
import com.microsoft.typespec.http.client.generator.core.model.xmlmodel.XmlFile;
import com.microsoft.typespec.http.client.generator.core.postprocessor.Postprocessor;
import com.microsoft.typespec.http.client.generator.core.preprocessor.Preprocessor;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
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

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class Javagen extends NewPlugin {
    private final Logger logger = new PluginLogger(this, Javagen.class);
    protected static Javagen instance;

    public Javagen(Connection connection, String plugin, String sessionId) {
        super(connection, plugin, sessionId);
        instance = this;
    }

    public static Javagen getPluginInstance() {
        return instance;
    }

    @Override
    public boolean processInternal() {
        this.clear();

        JavaSettings settings = JavaSettings.getInstance();

        try {
            // Step 1: Parse input yaml as CodeModel
            CodeModel codeModel = new Preprocessor(this, connection, pluginName, sessionId)
                .processCodeModel();

            // Step 2: Map
            Client client = Mappers.getClientMapper().map(codeModel);

            // Step 3: Write to templates
            JavaPackage javaPackage = writeToTemplates(codeModel, client, settings, true);

            //Step 4: Print to files
            // Then for each formatted file write the file. This is done synchronously as there is potential race
            // conditions that can lead to deadlocking.
            new Postprocessor(this).postProcess(javaPackage.getJavaFiles().stream()
                .collect(Collectors.toMap(JavaFile::getFilePath, file -> file.getContents().toString())));

            for (XmlFile xmlFile : javaPackage.getXmlFiles()) {
                writeFile(xmlFile.getFilePath(), xmlFile.getContents().toString(), null);
            }
            for (TextFile textFile : javaPackage.getTextFiles()) {
                writeFile(textFile.getFilePath(), textFile.getContents(), null);
            }

            String artifactId = ClientModelUtil.getArtifactId();
            if (!CoreUtils.isNullOrEmpty(artifactId)) {
                writeFile("src/main/resources/" + artifactId + ".properties",
                    "name=${project.artifactId}\nversion=${project.version}\n", null);
            }
        } catch (Exception ex) {
            logger.error("Failed to generate code.", ex);
            return false;
        }
        return true;
    }

    CodeModel parseCodeModel(String fileName) {
        String file = readFile(fileName);
        Representer representer = new Representer(new DumperOptions()) {
            @Override
            protected NodeTuple representJavaBeanProperty(Object javaBean, Property property, Object propertyValue,
                Tag customTag) {
                // if value of property is null, ignore it.
                if (propertyValue == null) {
                    return null;
                } else {
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
        return newYaml.loadAs(file, CodeModel.class);
    }

    protected JavaPackage writeToTemplates(CodeModel codeModel, Client client, JavaSettings settings,
                                           boolean generateSwaggerMarkdown) {
        JavaPackage javaPackage = new JavaPackage(this);
        if (client.getServiceClient() != null || !CoreUtils.isNullOrEmpty(client.getServiceClients())) {
            // Service client
            if (CoreUtils.isNullOrEmpty(client.getServiceClients())) {
                javaPackage.addServiceClient(client.getServiceClient().getPackage(),
                        client.getServiceClient().getClassName(), client.getServiceClient());
            } else {
                // multi-client from TypeSpec
                for (ServiceClient serviceClient : client.getServiceClients()) {
                    javaPackage.addServiceClient(serviceClient.getPackage(), serviceClient.getClassName(), serviceClient);
                }
            }

            if (settings.isGenerateClientInterfaces()) {
                javaPackage.addServiceClientInterface(client.getServiceClient().getInterfaceName(),
                        client.getServiceClient());
            }

            // Async/sync service clients
            for (AsyncSyncClient asyncClient : client.getAsyncClients()) {
                javaPackage.addAsyncServiceClient(asyncClient.getPackageName(), asyncClient);
            }
            for (AsyncSyncClient syncClient : client.getSyncClients()) {
                boolean syncClientWrapAsync = settings.isSyncClientWrapAsyncClient()
                        // HLC could have sync method that is harder to convert, e.g. Flux<ByteBuffer> -> InputStream
                        && settings.isDataPlaneClient()
                        // 1-1 match of SyncClient and AsyncClient
                        && client.getAsyncClients().size() == client.getSyncClients().size();
                javaPackage.addSyncServiceClient(syncClient.getPackageName(), syncClient, syncClientWrapAsync);
            }

            // Service client builder
            for (ClientBuilder clientBuilder : client.getClientBuilders()) {
                javaPackage.addServiceClientBuilder(clientBuilder);
            }

            // Method group
            if (CoreUtils.isNullOrEmpty(client.getServiceClients())) {
                writeMethodGroupClient(javaPackage, client.getServiceClient(), settings);
            } else {
                // multi-client from TypeSpec
                for (ServiceClient serviceClient : client.getServiceClients()) {
                    writeMethodGroupClient(javaPackage, serviceClient, settings);
                }
            }

            // Sample
            if (settings.isDataPlaneClient() && settings.isGenerateSamples()) {
                for (ProtocolExample protocolExample : client.getProtocolExamples()) {
                    javaPackage.addProtocolExamples(protocolExample);
                }
                for (ClientMethodExample clientMethodExample : client.getClientMethodExamples()) {
                    javaPackage.addClientMethodExamples(clientMethodExample);
                }
            }

            // Test
            if (settings.isDataPlaneClient() && settings.isGenerateTests()) {
                if (!client.getSyncClients().isEmpty() && client.getSyncClients().iterator().next().getClientBuilder() != null) {
                    List<ServiceClient> serviceClients = client.getServiceClients();
                    if (CoreUtils.isNullOrEmpty(serviceClients)) {
                        serviceClients = Collections.singletonList(client.getServiceClient());
                    }
                    TestContext testContext = new TestContext(serviceClients, client.getSyncClients());

                    // base test class
                    javaPackage.addProtocolTestBase(testContext);

                    // test cases as Disabled
                    if (!client.getProtocolExamples().isEmpty()) {
                        client.getProtocolExamples().forEach(protocolExample -> javaPackage.addProtocolTest(new TestContext<>(testContext, protocolExample)));
                    }
                    if (!client.getClientMethodExamples().isEmpty()) {
                        client.getClientMethodExamples().forEach(clientMethodExample -> javaPackage.addClientMethodTest(new TestContext<>(testContext, clientMethodExample)));
                    }
                }
            }

            // Service version
            if (settings.isDataPlaneClient()) {
                String packageName = settings.getPackage();
                if (CoreUtils.isNullOrEmpty(client.getServiceClients())) {
                    List<String> serviceVersions = settings.getServiceVersions();
                    if (CoreUtils.isNullOrEmpty(serviceVersions)) {
                        List<String> apiVersions = ClientModelUtil.getApiVersions(codeModel);
                        if (!CoreUtils.isNullOrEmpty(apiVersions)) {
                            serviceVersions = apiVersions;
                        } else {
                            throw new IllegalArgumentException("'api-version' not found. Please configure 'serviceVersions' option.");
                        }
                    }

                    String serviceName;
                    if (settings.getServiceName() == null) {
                        serviceName = client.getServiceClient().getInterfaceName();
                    } else {
                        serviceName = settings.getServiceName();
                    }
                    String className = ClientModelUtil.getServiceVersionClassName(ClientModelUtil.getClientInterfaceName(codeModel));
                    javaPackage.addServiceVersion(packageName, new ServiceVersion(className, serviceName, serviceVersions));
                } else {
                    // multi-client from TypeSpec
                    for (com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client client1 : codeModel.getClients()) {
                        if (client1.getServiceVersion() != null) {
                            javaPackage.addServiceVersion(packageName,
                                    new ServiceVersion(
                                            SchemaUtil.getJavaName(client1.getServiceVersion()),
                                            client1.getServiceVersion().getLanguage().getDefault().getDescription(),
                                            client1.getApiVersions().stream().map(ApiVersion::getVersion).collect(Collectors.toList())));
                        }
                    }
                }
            }
        }

        // GraalVM config
        if (settings.isGenerateGraalVmConfig()) {
            javaPackage.addGraalVmConfig(Project.AZURE_GROUP_ID, ClientModelUtil.getArtifactId(), client.getGraalVmConfig());
        }

        writeClientModels(client, javaPackage, settings);

        writeHelperClasses(client, codeModel, javaPackage, settings);

        // Unit tests on client model
        if (settings.isGenerateTests() && !settings.isDataPlaneClient()) {
            for (ClientModel model : client.getModels()) {
                if (!model.isStronglyTypedHeader()) {
                    javaPackage.addModelUnitTest(model);
                }
            }
        }

        // Package-info
        for (PackageInfo packageInfo : client.getPackageInfos()) {
            javaPackage.addPackageInfo(packageInfo.getPackage(), "package-info", packageInfo);
        }

        if (settings.isDataPlaneClient()) {
            Project project = new Project(client, ClientModelUtil.getApiVersions(codeModel));
            if (settings.isSdkIntegration()) {
                project.integrateWithSdk();
            }

            Set<String> externalPackageNames = ClientModelUtil.getExternalPackageNamesUsedInClient(client.getModels(), codeModel);
            client.getModuleInfo().checkForAdditionalDependencies(externalPackageNames);
            project.checkForAdditionalDependencies(externalPackageNames);

            // Module-info
            javaPackage.addModuleInfo(client.getModuleInfo());

            // POM
            if (settings.isRegeneratePom()) {
                Pom pom = new PomMapper().map(project);
                javaPackage.addPom("pom.xml", pom);
            }

            // Readme, Changelog
            if (settings.isSdkIntegration()) {
                javaPackage.addReadmeMarkdown(project);
                if (generateSwaggerMarkdown) {
                    javaPackage.addSwaggerReadmeMarkdown(project);
                }
                javaPackage.addChangelogMarkdown(project);

                // test proxy asserts.json
                javaPackage.addTestProxyAssetsJson(project);

                // Blank readme sample
                javaPackage.addProtocolExamplesBlank();
            }
        }
        return javaPackage;
    }

    protected void writeClientModels(Client client, JavaPackage javaPackage, JavaSettings settings) {
        if (!settings.isDataPlaneClient()) {
            // Client model
            for (ClientModel model : client.getModels()) {
                javaPackage.addModel(model.getPackage(), model.getName(), model);
            }

            // Enum
            for (EnumType enumType : client.getEnums()) {
                javaPackage.addEnum(enumType.getPackage(), enumType.getName(), enumType);
            }

            // Response
            for (ClientResponse response : client.getResponseModels()) {
                javaPackage.addClientResponse(response.getPackage(), response.getName(), response);
            }

            // Exception
            for (ClientException exception : client.getExceptions()) {
                javaPackage.addException(exception.getPackage(), exception.getName(), exception);
            }

            // XML sequence wrapper
            for (XmlSequenceWrapper xmlSequenceWrapper : client.getXmlSequenceWrappers()) {
                javaPackage.addXmlSequenceWrapper(xmlSequenceWrapper.getPackage(),
                        xmlSequenceWrapper.getWrapperClassName(), xmlSequenceWrapper);
            }
        }
    }

    protected void writeHelperClasses(Client client, CodeModel codeModel, JavaPackage javaPackage, JavaSettings settings) {
    }

    private static void writeMethodGroupClient(JavaPackage javaPackage, ServiceClient serviceClient, JavaSettings settings) {
        for (MethodGroupClient methodGroupClient : serviceClient.getMethodGroupClients()) {
            javaPackage.addMethodGroup(methodGroupClient.getPackage(), methodGroupClient.getClassName(), methodGroupClient);
            if (settings.isGenerateClientInterfaces()) {
                javaPackage.addMethodGroupInterface(methodGroupClient.getInterfaceName(), methodGroupClient);
            }
        }
    }

    private void clear() {
        ClientModels.getInstance().clear();
        UnionModels.getInstance().clear();
        JavaSettings.clear();
    }

    public Logger getLogger() {
        return this.logger;
    }
}
