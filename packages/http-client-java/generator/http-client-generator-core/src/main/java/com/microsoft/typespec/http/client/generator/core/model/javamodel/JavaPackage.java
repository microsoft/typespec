// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientBuilder;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientException;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientResponse;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GraalVmConfig;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModuleInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PackageInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProtocolExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceVersion;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.TestContext;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.UnionModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.XmlSequenceWrapper;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.TextFile;
import com.microsoft.typespec.http.client.generator.core.model.xmlmodel.XmlFile;
import com.microsoft.typespec.http.client.generator.core.template.ChangelogTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTestTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ModelTestTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ProtocolSampleBlankTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ProtocolTestBaseTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ProtocolTestTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ReadmeTemplate;
import com.microsoft.typespec.http.client.generator.core.template.ServiceSyncClientTemplate;
import com.microsoft.typespec.http.client.generator.core.template.SwaggerReadmeTemplate;
import com.microsoft.typespec.http.client.generator.core.template.Templates;
import com.microsoft.typespec.http.client.generator.core.template.TestProxyAssetsTemplate;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.PossibleCredentialException;
import org.slf4j.Logger;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

public class JavaPackage {
    private final Logger logger;

    private final JavaSettings settings;
    private final List<JavaFile> javaFiles;
    private final List<XmlFile> xmlFiles;
    protected final List<TextFile> textFiles = new ArrayList<>();

    private final JavaFileFactory javaFileFactory;

    private final Set<String> filePaths = new HashSet<>();

    public JavaPackage(NewPlugin host) {
        this.settings = JavaSettings.getInstance();
        this.javaFiles = new ArrayList<>();
        this.xmlFiles = new ArrayList<>();
        this.javaFileFactory = new JavaFileFactory(settings);
        this.logger = new PluginLogger(host, JavaPackage.class);
    }

    protected JavaFileFactory getJavaFileFactory() {
        return javaFileFactory;
    }

    public List<JavaFile> getJavaFiles() {
        return javaFiles;
    }

    public List<XmlFile> getXmlFiles() {
        return xmlFiles;
    }

    public List<TextFile> getTextFiles() {
        return textFiles;
    }

    public final void addServiceClient(String packageKeyword, String name, ServiceClient model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyword, name);
        Templates.getServiceClientTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addAsyncServiceClient(String packageKeyWord, AsyncSyncClient asyncClient) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyWord, asyncClient.getClassName());
        Templates.getServiceAsyncClientTemplate().write(asyncClient, javaFile);
        addJavaFile(javaFile);
    }

    public final void addSyncServiceClient(String packageKeyWord, AsyncSyncClient syncClient) {
        addSyncServiceClient(packageKeyWord, syncClient, false);
    }

    public final void addSyncServiceClient(String packageKeyWord, AsyncSyncClient syncClient, boolean syncClientWrapAsync) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyWord, syncClient.getClassName());
        ServiceSyncClientTemplate template = syncClientWrapAsync
                ? Templates.getServiceSyncClientWrapAsyncClientTemplate()
                : Templates.getServiceSyncClientTemplate();
        template.write(syncClient, javaFile);
        addJavaFile(javaFile);
    }

    public final void addServiceClientInterface(String name, ServiceClient model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(settings.getPackage(), name);
        Templates.getServiceClientInterfaceTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addServiceClientInterface(String packageKeyword, String name, ServiceClient model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyword, name);
        Templates.getServiceClientInterfaceTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addServiceClientBuilder(ClientBuilder model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(model.getPackageName(), model.getClassName());
        Templates.getServiceClientBuilderTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addServiceVersion(String packageKeyword, ServiceVersion serviceVersion) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyword, serviceVersion.getClassName());
        Templates.getServiceVersionTemplate().write(serviceVersion, javaFile);
        addJavaFile(javaFile);
    }

    public final void addMethodGroup(String packageKeyword, String name, MethodGroupClient model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyword, name);
        Templates.getMethodGroupTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addMethodGroupInterface(String name, MethodGroupClient model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(settings.getPackage(), name);
        Templates.getMethodGroupInterfaceTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addMethodGroupInterface(String packageKeyword, String name, MethodGroupClient model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyword, name);
        Templates.getMethodGroupInterfaceTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addModel(String packageKeyword, String name, ClientModel model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyword, name);

        if (settings.isStreamStyleSerialization()) {
            Templates.getStreamStyleModelTemplate().write(model, javaFile);
        } else {
            Templates.getModelTemplate().write(model, javaFile);
        }

        addJavaFile(javaFile);
    }

    public final void addException(String packageKeyword, String name, ClientException model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyword, name);
        Templates.getExceptionTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addEnum(String packageKeyword, String name, EnumType model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyword, name);
        Templates.getEnumTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addClientResponse(String packageKeyword, String name, ClientResponse model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyword, name);
        Templates.getResponseTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addXmlSequenceWrapper(String packageKeyword, String name, XmlSequenceWrapper model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageKeyword, name);
        Templates.getXmlSequenceWrapperTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addUnionModel(UnionModel model) {
        JavaFile javaFile = javaFileFactory.createSourceFile(model.getPackage(), model.getName());
        Templates.getUnionModelTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addPackageInfo(String packageKeyword, String name, PackageInfo model) {
        JavaFile javaFile = javaFileFactory.createEmptySourceFile(packageKeyword, name);
        Templates.getPackageInfoTemplate().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addModuleInfo(ModuleInfo moduleInfo) {
        JavaFile javaFile = javaFileFactory.createEmptySourceFile("", "module-info");
        Templates.getModuleInfoTemplate().write(moduleInfo, javaFile);
        addJavaFile(javaFile);
    }

    public final void addPom(String name, Pom pom) {
        XmlFile xmlFile = new XmlFile(name, new XmlFile.Options().setIndent(2));
        Templates.getPomTemplate().write(pom, xmlFile);
        this.checkDuplicateFile(xmlFile.getFilePath());
        xmlFiles.add(xmlFile);
    }

    public final void addJavaFromResources(String packageName, String name) {
        addJavaFromResources(packageName, name, name);
    }

    public final void addJavaFromResources(String packageName, String resourceName, String fileName) {
        JavaFile javaFile = javaFileFactory.createSourceFile(packageName, fileName);
        try (InputStream inputStream = JavaPackage.class.getClassLoader().getResourceAsStream(resourceName + ".java");
             BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream))) {
            Iterator<String> linesIterator = bufferedReader.lines().iterator();
            while (linesIterator.hasNext()) {
                javaFile.line(linesIterator.next());
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read " + resourceName + ".java from resources.", e);
        }
        addJavaFile(javaFile);
    }

    protected void addJavaFile(JavaFile javaFile) {
        this.checkDuplicateFile(javaFile.getFilePath());
        filePaths.add(javaFile.getFilePath());
        javaFiles.add(javaFile);
    }

    public void addProtocolExamples(ProtocolExample protocolExample) {
        JavaFile javaFile = javaFileFactory.createSampleFile(settings.getPackage("generated"), protocolExample.getFilename());
        Templates.getProtocolSampleTemplate().write(protocolExample, javaFile);
        this.checkDuplicateFile(javaFile.getFilePath());
        javaFiles.add(javaFile);
    }

    public void addClientMethodExamples(ClientMethodExample clientMethodExample) {
        JavaFile javaFile = javaFileFactory.createSampleFile(settings.getPackage("generated"), clientMethodExample.getFilename());
        Templates.getClientMethodSampleTemplate().write(clientMethodExample, javaFile);
        this.checkDuplicateFile(javaFile.getFilePath());
        javaFiles.add(javaFile);
    }

    public void addProtocolExamplesBlank() {
        JavaFile javaFile = javaFileFactory.createSampleFile(settings.getPackage(), "ReadmeSamples");
        new ProtocolSampleBlankTemplate().write(null, javaFile);
        this.checkDuplicateFile(javaFile.getFilePath());
        javaFiles.add(javaFile);
    }

    public void addProtocolTestBase(TestContext testContext) {
        JavaFile javaFile = javaFileFactory.createTestFile(testContext.getPackageName(), testContext.getTestBaseClassName());
        ProtocolTestBaseTemplate.getInstance().write(testContext, javaFile);
        this.checkDuplicateFile(javaFile.getFilePath());
        javaFiles.add(javaFile);
    }

    public void addProtocolTest(TestContext<ProtocolExample> testContext) {
        String className = testContext.getTestCase().getFilename() + "Tests";
        JavaFile javaFile = javaFileFactory.createTestFile(testContext.getPackageName(), className);
        ProtocolTestTemplate.getInstance().write(testContext, javaFile);
        this.checkDuplicateFile(javaFile.getFilePath());
        javaFiles.add(javaFile);
    }

    public void addClientMethodTest(TestContext<ClientMethodExample> testContext) {
        String className = testContext.getTestCase().getFilename() + "Tests";
        JavaFile javaFile = javaFileFactory.createTestFile(testContext.getPackageName(), className);
        ClientMethodTestTemplate.getInstance().write(testContext, javaFile);
        this.checkDuplicateFile(javaFile.getFilePath());
        javaFiles.add(javaFile);
    }

    public void addModelUnitTest(ClientModel model) {
        try {
            String className = model.getName() + "Tests";
            JavaFile javaFile = javaFileFactory.createTestFile(JavaSettings.getInstance().getPackage("generated"), className);
            ModelTestTemplate.getInstance().write(model, javaFile);
            this.checkDuplicateFile(javaFile.getFilePath());
            javaFiles.add(javaFile);
        } catch (PossibleCredentialException e) {
            // skip this test file
            logger.warn("Skip unit test for model '{}', caused by key '{}'", model.getName(), e.getKeyName());
        }
    }

    public void addReadmeMarkdown(Project project) {
        TextFile textFile = new TextFile("README.md", new ReadmeTemplate().write(project));
        this.checkDuplicateFile(textFile.getFilePath());
        textFiles.add(textFile);
    }

    public void addSwaggerReadmeMarkdown(Project project) {
        TextFile textFile = new TextFile("swagger/README.md", new SwaggerReadmeTemplate().write(project));
        this.checkDuplicateFile(textFile.getFilePath());
        textFiles.add(textFile);
    }

    public void addChangelogMarkdown(Project project) {
        TextFile textFile = new TextFile("CHANGELOG.md", new ChangelogTemplate().write(project));
        this.checkDuplicateFile(textFile.getFilePath());
        textFiles.add(textFile);
    }

    public void addTestProxyAssetsJson(Project project) {
        TextFile textFile = new TextFile("assets.json", new TestProxyAssetsTemplate().write(project));
        this.checkDuplicateFile(textFile.getFilePath());
        textFiles.add(textFile);
    }

    public final void addGraalVmConfig(String groupId, String artifactId, GraalVmConfig graalVmConfig) {
        String metaInfPath = Paths.get("src", "main", "resources", "META-INF", "native-image", groupId, artifactId).toString();

        TextFile proxyConfigFile = new TextFile(Paths.get(metaInfPath, "proxy-config.json").toString(), graalVmConfig.toProxyConfigJson());
        textFiles.add(proxyConfigFile);

        TextFile reflectConfigFile = new TextFile(Paths.get(metaInfPath, "reflect-config.json").toString(), graalVmConfig.toReflectConfigJson());
        textFiles.add(reflectConfigFile);

        if (graalVmConfig.generateResourceConfig()) {
            TextFile resourceConfigFile = new TextFile(Paths.get(metaInfPath, "resource-config.json").toString(), graalVmConfig.toResourceConfigJson(artifactId));
            textFiles.add(resourceConfigFile);
        }
    }

    protected void checkDuplicateFile(String filePath) {
        if (filePaths.contains(filePath)) {
//            throw new IllegalStateException(String.format("Name conflict for output file '%1$s'.", filePath));
            logger.warn(String.format("Name conflict for output file '%1$s'.", filePath));
        }
    }

    public void addJsonMergePatchHelper(List<ClientModel> models) {
        JavaFile javaFile = javaFileFactory.createSourceFile(settings.getPackage(settings.getImplementationSubpackage()), ClientModelUtil.JSON_MERGE_PATCH_HELPER_CLASS_NAME);
        Templates.getJsonMergePatchHelperTemplate().write(models, javaFile);
        this.checkDuplicateFile(javaFile.getFilePath());
        javaFiles.add(javaFile);
    }
}
