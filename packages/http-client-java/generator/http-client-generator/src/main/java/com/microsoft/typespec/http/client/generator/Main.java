// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.AnnotatedPropertyUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModelCustomConstructor;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.TypeSpecMetadata;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.postprocessor.Postprocessor;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.fluent.TypeSpecFluentPlugin;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.javamodel.FluentJavaPackage;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import com.microsoft.typespec.http.client.generator.util.FileUtil;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.configuration.Configuration;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
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
        TypeSpecFluentPlugin fluentPlugin
            = new TypeSpecFluentPlugin(emitterOptions, sdkIntegration, codeModel.getInfo().getTitle());

        codeModel = fluentPlugin.preProcess(codeModel);

        // client
        Client client = fluentPlugin.processClient(codeModel);

        // template
        FluentJavaPackage javaPackage = fluentPlugin.processTemplates(codeModel, client);

        // delete generated Java files
        deleteGeneratedJavaFiles(emitterOptions.getOutputDir(), javaPackage.getJavaFiles(), JavaSettings.getInstance(),
            FluentStatic.getFluentJavaSettings().getMetadataSuffix().orElse(null));

        // write java files

        // handle customization
        // write output java files
        new Postprocessor(fluentPlugin).postProcess(javaPackage.getJavaFiles()
            .stream()
            .collect(Collectors.toMap(JavaFile::getFilePath, file -> file.getContents().toString())));

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

        // delete generated Java files
        deleteGeneratedJavaFiles(outputDir, javaPackage.getJavaFiles(), settings, null);

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

    /**
     * Deletes generated Java files. It includes "test" and "samples", if these files are to be generated.
     *
     * @param outputDir the absolute path of output directory
     * @param javaFiles the list of Java files to be generated
     * @param settings the Java settings
     */
    private static void deleteGeneratedJavaFiles(String outputDir, List<JavaFile> javaFiles, JavaSettings settings,
        String suffix) {
        Set<String> filesToDelete = new HashSet<>();

        // clean up source code, based on metadata
        String metadataFilename = "src/main/resources/META-INF/"
            + (settings.isFluent() ? FluentUtils.getArtifactId() : ClientModelUtil.getArtifactId()) + "_metadata"
            + (suffix == null ? "" : "_" + suffix) + ".json";
        Path metadataFilePath = Paths.get(outputDir, metadataFilename).toAbsolutePath();
        if (Files.isRegularFile(metadataFilePath) && metadataFilePath.toFile().canRead()) {
            try (BufferedReader reader = Files.newBufferedReader(metadataFilePath, StandardCharsets.UTF_8);
                JsonReader jsonReader = JsonReader.fromReader(reader)) {
                TypeSpecMetadata metadata = TypeSpecMetadata.fromJson(jsonReader);
                if (metadata != null && !CoreUtils.isNullOrEmpty(metadata.getGeneratedFiles())) {
                    filesToDelete.addAll(metadata.getGeneratedFiles()
                        .stream()
                        .filter(filename -> filename.startsWith("src/main/") && filename.endsWith(".java"))
                        .collect(Collectors.toSet()));
                }
            } catch (IOException e) {
                LOGGER.warn("Unable to read file: {}", metadataFilePath.toAbsolutePath(), e);
            }
        }

        if (!CoreUtils.isNullOrEmpty(filesToDelete)) {
            // these files are either to be replaced, or to be merged during "partial update"
            // in latter case, we should not delete them
            filesToDelete.removeAll(javaFiles.stream().map(JavaFile::getFilePath).collect(Collectors.toSet()));

            FileUtil.deleteFiles(outputDir, filesToDelete);
        }

        if (JavaSettings.getInstance().isGenerateTests()) {
            // clean up tests
            String packageName = settings.getPackage("generated");
            Path path = Paths.get("src", "test", "java", packageName.replace('.', File.separatorChar));
            FileUtil.deleteFilesInDirectory(Paths.get(outputDir).resolve(path));
        }

        if (JavaSettings.getInstance().isGenerateSamples()) {
            // clean up samples
            String packageName = settings.getPackage("generated");
            Path path = Paths.get("src", "samples", "java", packageName.replace('.', File.separatorChar));
            FileUtil.deleteFilesInDirectory(Paths.get(outputDir).resolve(path));
        }
    }

    private static EmitterOptions loadEmitterOptions(CodeModel codeModel) {

        EmitterOptions options = null;
        String emitterOptionsJson = Configuration.getGlobalConfiguration().get("emitterOptions");

        if (emitterOptionsJson != null) {
            try (JsonReader jsonReader = JsonReader.fromString(emitterOptionsJson)) {
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
