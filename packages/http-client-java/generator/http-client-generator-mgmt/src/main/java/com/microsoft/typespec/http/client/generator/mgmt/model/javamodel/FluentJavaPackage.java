// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.javamodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentLiveTests;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentManager;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentMethodMockUnitTest;
import com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel.Changelog;
import com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel.FluentProject;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentMethodMockTestTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentLiveTestsTemplate;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.TextFile;
import com.microsoft.typespec.http.client.generator.mgmt.template.ChangelogTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentExampleTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentManagerTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentResourceCollectionImplementationTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentResourceCollectionInterfaceTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentResourceModelImplementationTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentResourceModelInterfaceTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.ReadmeTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.SampleTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.ResourceManagerUtilsTemplate;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.util.ClassNameUtil;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.List;

public class FluentJavaPackage extends JavaPackage {

    public FluentJavaPackage(NewPlugin host) {
        super(host);
    }

    public void addReadmeMarkdown(FluentProject project) {
        TextFile textFile = new TextFile("README.md", new ReadmeTemplate().write(project));
        this.checkDuplicateFile(textFile.getFilePath());
        textFiles.add(textFile);
    }

    public void addChangelogMarkdown(Changelog changelog) {
        TextFile textFile = new TextFile("CHANGELOG.md", new ChangelogTemplate().write(changelog));
        this.checkDuplicateFile(textFile.getFilePath());
        textFiles.add(textFile);
    }

    public final void addSampleMarkdown(List<FluentExample> examples, List<JavaFile> sampleJavaFiles) {
        TextFile textFile = new TextFile("SAMPLE.md", new SampleTemplate().write(examples, sampleJavaFiles));
        this.checkDuplicateFile(textFile.getFilePath());
        textFiles.add(textFile);
    }

    public final void addFluentResourceModel(FluentResourceModel model) {
        JavaFile javaFile = getJavaFileFactory().createSourceFile(
                model.getInterfaceType().getPackage(),
                model.getInterfaceType().getName());
        FluentResourceModelInterfaceTemplate.getInstance().write(model, javaFile);
        addJavaFile(javaFile);

        javaFile = getJavaFileFactory().createSourceFile(
                model.getImplementationType().getPackage(),
                model.getImplementationType().getName());
        FluentResourceModelImplementationTemplate.getInstance().write(model, javaFile);
        addJavaFile(javaFile);
    }

    public final void addFluentResourceCollection(FluentResourceCollection collection) {
        JavaFile javaFile = getJavaFileFactory().createSourceFile(
                collection.getInterfaceType().getPackage(),
                collection.getInterfaceType().getName());
        FluentResourceCollectionInterfaceTemplate.getInstance().write(collection, javaFile);
        addJavaFile(javaFile);

        javaFile = getJavaFileFactory().createSourceFile(
                collection.getImplementationType().getPackage(),
                collection.getImplementationType().getName());
        FluentResourceCollectionImplementationTemplate.getInstance().write(collection, javaFile);
        addJavaFile(javaFile);
    }

    public final void addFluentManager(FluentManager model, FluentProject project) {
        JavaFile javaFile = getJavaFileFactory().createSourceFile(
                model.getType().getPackage(),
                model.getType().getName());
        FluentManagerTemplate.getInstance().write(model, project, javaFile);
        addJavaFile(javaFile);
    }

    public final void addResourceManagerUtils() {
        JavaSettings settings = JavaSettings.getInstance();
        JavaFile javaFile = getJavaFileFactory().createSourceFile(
                settings.getPackage(settings.getImplementationSubpackage()),
                ModelNaming.CLASS_RESOURCE_MANAGER_UTILS);
        ResourceManagerUtilsTemplate.getInstance().write(javaFile);
        addJavaFile(javaFile);
    }

    public final JavaFile addSample(FluentExample example) {
        JavaFile javaFile = getJavaFileFactory().createSampleFile(
                example.getPackageName(), example.getClassName());
        FluentExampleTemplate.getInstance().write(example, javaFile);
        addJavaFile(javaFile);
        return javaFile;
    }

    public void addOperationUnitTest(FluentMethodMockUnitTest unitTest) {
        final String packageName = JavaSettings.getInstance().getPackage("generated");
        String className = unitTest.getResourceCollection().getInterfaceType().getName()
                + CodeNamer.toPascalCase(unitTest.getCollectionMethod().getMethodName());

        final String classNameSuffix = "MockTests";

        className = ClassNameUtil.truncateClassName(
                JavaSettings.getInstance().getPackage(),
                "src/tests/java"
                        // a hack to count "MockTests" suffix into the length of the full path
                        + classNameSuffix,
                packageName, className);

        className += classNameSuffix;

        JavaFile javaFile = getJavaFileFactory().createTestFile(packageName, className);
        FluentMethodMockTestTemplate.ClientMethodInfo info = new FluentMethodMockTestTemplate.ClientMethodInfo(
                className, unitTest);
        FluentMethodMockTestTemplate.getInstance().write(info, javaFile);
        addJavaFile(javaFile);
    }

    public void addLiveTests(FluentLiveTests liveTests) {
        JavaFile javaFile = getJavaFileFactory().createTestFile(
            liveTests.getPackageName(), liveTests.getClassName());
        FluentLiveTestsTemplate.getInstance().write(liveTests, javaFile);
        addJavaFile(javaFile);
    }
}
