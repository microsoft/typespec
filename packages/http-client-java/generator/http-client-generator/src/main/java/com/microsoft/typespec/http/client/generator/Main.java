// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.azure.core.util.Configuration;
import com.azure.core.util.CoreUtils;
import com.azure.json.JsonProviders;
import com.azure.json.JsonReader;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.AnnotatedPropertyUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModelCustomConstructor;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.postprocessor.Postprocessor;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.fluent.TypeSpecFluentPlugin;
import com.microsoft.typespec.http.client.generator.mgmt.model.javamodel.FluentJavaPackage;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import com.microsoft.typespec.http.client.generator.util.FileUtil;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;
import org.yaml.snakeyaml.inspector.TrustedTagInspector;
import org.yaml.snakeyaml.representer.Representer;

public class Main {
    private static final Logger LOGGER = LoggerFactory.getLogger(Main.class);
    private static final String DEFAULT_OUTPUT_DIR = "http-client-generator-test/tsp-output/";
    // private static final String DEFAULT_OUTPUT_DIR = "http-client-generator-clientcore-test/tsp-output/";

    private static Yaml yaml = null;

    // java -jar target/azure-typespec-extension-jar-with-dependencies.jar
    public static void main(String[] args) throws IOException {
        try {
            // parameters
            String inputYamlFileName = DEFAULT_OUTPUT_DIR + "code-model.yaml";
            if (args.length >= 1) {
                inputYamlFileName = args[0];
            }

            LOGGER.info("Code model file: {}", inputYamlFileName);

            // load code-model.yaml
            CodeModel codeModel = loadCodeModel(inputYamlFileName);

            EmitterOptions emitterOptions = loadEmitterOptions(codeModel);

            boolean sdkIntegration = true;
            String outputDir = emitterOptions.getOutputDir();
            Path outputDirPath = Paths.get(outputDir);
            if (Files.exists(outputDirPath)) {
                if (emitterOptions.getArm()) {
                    // check ../../parents/azure-client-sdk-parent
                    sdkIntegration = Files.exists(Paths.get(outputDir, "../../parents/azure-client-sdk-parent"));
                } else {
                    try (Stream<Path> filestream = Files.list(outputDirPath)) {
                        Set<String> filenames = filestream.map(p -> p.getFileName().toString())
                            .map(name -> name.toLowerCase(Locale.ROOT))
                            .collect(Collectors.toSet());

                        // if there is already pom and source, do not overwrite them (includes README.md, CHANGELOG.md
                        // etc.)
                        sdkIntegration = !filenames.containsAll(Arrays.asList("pom.xml", "src"));
                    }
                }
            }

            if (emitterOptions.getArm()) {
                handleFluent(codeModel, emitterOptions, sdkIntegration);
            } else {
                handleDPG(codeModel, emitterOptions, sdkIntegration, outputDir);
            }

            // ensure the process exits as expected
            System.exit(0);
        } catch (Throwable e) {
            LOGGER.error("Unhandled error.", e);
            System.exit(1);
        }
    }

    private static void handleFluent(CodeModel codeModel, EmitterOptions emitterOptions, boolean sdkIntegration) {
        // initialize plugin
        TypeSpecFluentPlugin fluentPlugin = new TypeSpecFluentPlugin(emitterOptions, sdkIntegration);

        codeModel = fluentPlugin.preProcess(codeModel);

        // client
        Client client = fluentPlugin.processClient(codeModel);

        // template
        FluentJavaPackage javaPackage = fluentPlugin.processTemplates(codeModel, client);

        if (emitterOptions.getClearOutputFolder() == Boolean.TRUE) {
            // delete generated Java files
            deleteGeneratedJavaFiles(emitterOptions.getOutputDir(), javaPackage.getJavaFiles(),
                JavaSettings.getInstance());
        }

        // write java files
        Postprocessor.writeToFiles(
            javaPackage.getJavaFiles()
                .stream()
                .collect(Collectors.toMap(JavaFile::getFilePath, file -> file.getContents().toString())),
            fluentPlugin, fluentPlugin.getLogger());

        // XML include POM
        javaPackage.getXmlFiles()
            .forEach(xmlFile -> fluentPlugin.writeFile(xmlFile.getFilePath(), xmlFile.getContents().toString(), null));

        // properties file
        String artifactId = FluentUtils.getArtifactId();
        if (!CoreUtils.isNullOrEmpty(artifactId)) {
            fluentPlugin.writeFile("src/main/resources/" + artifactId + ".properties", "version=${project.version}\n",
                null);
        }

        // Others
        javaPackage.getTextFiles()
            .forEach(textFile -> fluentPlugin.writeFile(textFile.getFilePath(), textFile.getContents(), null));
    }

    private static void handleDPG(CodeModel codeModel, EmitterOptions emitterOptions, boolean sdkIntegration,
        String outputDir) {
        // initialize plugin
        TypeSpecPlugin typeSpecPlugin = new TypeSpecPlugin(emitterOptions, sdkIntegration);

        JavaSettings settings = JavaSettings.getInstance();

        // client
        Client client = typeSpecPlugin.processClient(codeModel);

        // template
        JavaPackage javaPackage = typeSpecPlugin.processTemplates(codeModel, client, JavaSettings.getInstance());

        LOGGER.info("Count of Java files: {}", javaPackage.getJavaFiles().size());
        LOGGER.info("Count of XML files: {}", javaPackage.getXmlFiles().size());
        LOGGER.info("Count of text files: {}", javaPackage.getTextFiles().size());

        if (emitterOptions.getClearOutputFolder() == Boolean.TRUE) {
            // delete generated Java files
            deleteGeneratedJavaFiles(outputDir, javaPackage.getJavaFiles(), settings);
        }

        Map<String, String> javaFiles = new ConcurrentHashMap<>();
        javaPackage.getJavaFiles()
            .parallelStream()
            .forEach(javaFile -> javaFiles.put(javaFile.getFilePath(), javaFile.getContents().toString()));
        // handle partial update
        // handle customization
        // write output java files
        new Postprocessor(typeSpecPlugin).postProcess(javaFiles);

        // XML include POM
        javaPackage.getXmlFiles()
            .forEach(
                xmlFile -> typeSpecPlugin.writeFile(xmlFile.getFilePath(), xmlFile.getContents().toString(), null));
        // Others
        javaPackage.getTextFiles()
            .forEach(textFile -> typeSpecPlugin.writeFile(textFile.getFilePath(), textFile.getContents(), null));
        // resources
        if (settings.isAzureV1()) {
            String artifactId = ClientModelUtil.getArtifactId();
            if (!CoreUtils.isNullOrEmpty(artifactId)) {
                typeSpecPlugin.writeFile("src/main/resources/" + artifactId + ".properties",
                    "name=${project.artifactId}\nversion=${project.version}\n", null);
            }
        }
    }

    private static void deleteGeneratedJavaFiles(String outputDir, List<JavaFile> javaFiles, JavaSettings settings) {
        Set<String> filesToKeep = new HashSet<>();
        // keep ReadmeSamples.java
        filesToKeep.add("src/samples/java/" + settings.getPackage().replace(".", "/") + "/ReadmeSamples.java");
        if (settings.isHandlePartialUpdate()) {
            // keep files that is known to be generated, as they are candidate for partial update process
            filesToKeep.addAll(javaFiles.stream().map(JavaFile::getFilePath).collect(Collectors.toSet()));
        }
        FileUtil.deleteGeneratedJavaFiles(outputDir,
            new FileUtil.DeleteGeneratedJavaFilesOptions().setRelativePathOfJavaFilesToKeep(filesToKeep)
                .setIncludeSamplesDir(settings.isGenerateSamples())
                .setIncludeTestDir(settings.isGenerateTests()));
    }

    private static EmitterOptions loadEmitterOptions(CodeModel codeModel) {

        EmitterOptions options = null;
        String emitterOptionsJson = Configuration.getGlobalConfiguration().get("emitterOptions");

        if (emitterOptionsJson != null) {
            try (JsonReader jsonReader = JsonProviders.createReader(emitterOptionsJson)) {
                options = EmitterOptions.fromJson(jsonReader);
                // namespace
                if (CoreUtils.isNullOrEmpty(options.getNamespace())) {
                    if (codeModel.getLanguage().getJava() != null
                        && !CoreUtils.isNullOrEmpty(codeModel.getLanguage().getJava().getNamespace())) {
                        options.setNamespace(codeModel.getLanguage().getJava().getNamespace());
                    }
                }

                // output path
                if (CoreUtils.isNullOrEmpty(options.getOutputDir())) {
                    options.setOutputDir(DEFAULT_OUTPUT_DIR);
                } else if (!options.getOutputDir().endsWith("/")) {
                    options.setOutputDir(options.getOutputDir() + "/");
                }
            } catch (IOException e) {
                LOGGER.warn("Read emitter options failed, emitter options json: {}", emitterOptionsJson);
            }
        }

        if (options == null) {
            // default if emitterOptions fails
            options = new EmitterOptions();
            options.setOutputDir(DEFAULT_OUTPUT_DIR);
            if (codeModel.getLanguage().getJava() != null
                && !CoreUtils.isNullOrEmpty(codeModel.getLanguage().getJava().getNamespace())) {
                options.setNamespace(codeModel.getLanguage().getJava().getNamespace());
            }
        }
        return options;
    }

    private static CodeModel loadCodeModel(String filename) throws IOException {
        String file = Files.readString(Paths.get(filename));
        CodeModel codeModel = getYaml().loadAs(file, CodeModel.class);
        return codeModel;
    }

    private static Yaml getYaml() {
        if (yaml == null) {
            Representer representer = new Representer(new DumperOptions());
            representer.setPropertyUtils(new AnnotatedPropertyUtils());
            representer.getPropertyUtils().setSkipMissingProperties(true);
            LoaderOptions loaderOptions = new LoaderOptions();
            loaderOptions.setCodePointLimit(50 * 1024 * 1024);
            loaderOptions.setMaxAliasesForCollections(Integer.MAX_VALUE);
            loaderOptions.setNestingDepthLimit(Integer.MAX_VALUE);
            loaderOptions.setTagInspector(new TrustedTagInspector());
            Constructor constructor = new CodeModelCustomConstructor(loaderOptions);
            yaml = new Yaml(constructor, representer, new DumperOptions(), loaderOptions);
        }
        return yaml;
    }
}
