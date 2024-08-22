// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.AnnotatedPropertyUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModelCustomConstructor;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.fluent.TypeSpecFluentPlugin;
import com.microsoft.typespec.http.client.generator.mgmt.model.javamodel.FluentJavaPackage;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.postprocessor.Postprocessor;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.azure.core.util.Configuration;
import com.azure.core.util.CoreUtils;
import com.azure.json.JsonProviders;
import com.azure.json.JsonReader;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import com.microsoft.typespec.http.client.generator.util.TspLocationUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;
import org.yaml.snakeyaml.inspector.TrustedTagInspector;
import org.yaml.snakeyaml.representer.Representer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Main {
    private static final Logger LOGGER = LoggerFactory.getLogger(Main.class);

    private static final String TSP_LOCATION_FILENAME = "tsp-location.yaml";

    private static Yaml yaml = null;

    // java -jar target/azure-typespec-extension-jar-with-dependencies.jar
    public static void main(String[] args) throws IOException {
        // parameters
        String inputYamlFileName = "typespec-tests/tsp-output/code-model.yaml";
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

                    // if there is already pom and source, do not overwrite them (includes README.md, CHANGELOG.md etc.)
                    sdkIntegration = !filenames.containsAll(Arrays.asList("pom.xml", "src"));
                }
            }

            // load tsp-location.yaml
            try (Stream<Path> filestream = Files.list(outputDirPath)) {
                Set<String> filenames = filestream.map(p -> p.getFileName().toString())
                    .map(name -> name.toLowerCase(Locale.ROOT))
                    .collect(Collectors.toSet());
                if (filenames.contains(TSP_LOCATION_FILENAME)) {
                    String directory = TspLocationUtil.getDirectory(getYaml(),
                        outputDirPath.resolve(TSP_LOCATION_FILENAME));
                    if (!CoreUtils.isNullOrEmpty(directory)) {
                        ProxyMethodExample.setTspDirectory(directory);
                    }
                }
            }
        }

        if (emitterOptions.getArm()) {
            handleFluent(codeModel, emitterOptions, sdkIntegration);
        } else {
            handleDPG(codeModel, emitterOptions, sdkIntegration, outputDir);
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

        // write

        // java files
        Postprocessor.writeToFiles(javaPackage.getJavaFiles()
                .stream()
                .collect(Collectors.toMap(JavaFile::getFilePath, file -> file.getContents().toString())), fluentPlugin,
            fluentPlugin.getLogger());

        // XML include POM
        javaPackage.getXmlFiles()
            .forEach(xmlFile -> fluentPlugin.writeFile(xmlFile.getFilePath(), xmlFile.getContents().toString(), null));
        // Others
        javaPackage.getTextFiles()
            .forEach(textFile -> fluentPlugin.writeFile(textFile.getFilePath(), textFile.getContents(), null));
    }

    private static void handleDPG(CodeModel codeModel, EmitterOptions emitterOptions, boolean sdkIntegration,
        String outputDir) {
        // initialize plugin
        TypeSpecPlugin typeSpecPlugin = new TypeSpecPlugin(emitterOptions, sdkIntegration);

        // client
        Client client = typeSpecPlugin.processClient(codeModel);

        // template
        JavaPackage javaPackage = typeSpecPlugin.processTemplates(codeModel, client, JavaSettings.getInstance());

        LOGGER.info("Count of Java files: {}", javaPackage.getJavaFiles().size());
        LOGGER.info("Count of XML files: {}", javaPackage.getXmlFiles().size());
        LOGGER.info("Count of text files: {}", javaPackage.getTextFiles().size());

        // handle partial update
        Map<String, String> javaFiles = new ConcurrentHashMap<>();
        JavaSettings settings = JavaSettings.getInstance();
        javaPackage.getJavaFiles()
            .parallelStream()
            .forEach(javaFile -> javaFiles.put(javaFile.getFilePath(), javaFile.getContents().toString()));

        // handle customization
        // write output
        // java files
        new Postprocessor(typeSpecPlugin).postProcess(javaFiles);

        // XML include POM
        javaPackage.getXmlFiles()
            .forEach(
                xmlFile -> typeSpecPlugin.writeFile(xmlFile.getFilePath(), xmlFile.getContents().toString(), null));
        // Others
        javaPackage.getTextFiles()
            .forEach(textFile -> typeSpecPlugin.writeFile(textFile.getFilePath(), textFile.getContents(), null));
        // resources
        String artifactId = ClientModelUtil.getArtifactId();
        if (settings.isBranded()) {
            if (!CoreUtils.isNullOrEmpty(artifactId)) {
                typeSpecPlugin.writeFile("src/main/resources/" + artifactId + ".properties",
                    "name=${project.artifactId}\nversion=${project.version}\n", null);
            }
        }

        boolean includeApiViewProperties = emitterOptions.includeApiViewProperties() != null
            && emitterOptions.includeApiViewProperties();
        if (includeApiViewProperties && !CoreUtils.isNullOrEmpty(typeSpecPlugin.getCrossLanguageDefinitionMap())) {
            String flavor = emitterOptions.getFlavor() == null ? "azure" : emitterOptions.getFlavor();
            StringBuilder sb = new StringBuilder(
                "{\n  \"flavor\": \"" + flavor + "\", \n  \"CrossLanguageDefinitionId\": {\n");
            AtomicBoolean first = new AtomicBoolean(true);
            typeSpecPlugin.getCrossLanguageDefinitionMap().forEach((key, value) -> {
                if (first.get()) {
                    first.set(false);
                } else {
                    sb.append(",\n");
                }
                sb.append("    \"").append(key).append("\": \"").append(value).append("\"");
            });
            sb.append("\n  }\n}\n");

            typeSpecPlugin.writeFile("src/main/resources/META-INF/" + artifactId + "_apiview_properties.json",
                sb.toString(), null);
        }
        System.exit(0);
    }

    private static EmitterOptions loadEmitterOptions(CodeModel codeModel) {

        EmitterOptions options = null;
        String emitterOptionsJson = Configuration.getGlobalConfiguration().get("emitterOptions");

        if (emitterOptionsJson != null) {
            try (JsonReader jsonReader = JsonProviders.createReader(emitterOptionsJson)) {
                options = EmitterOptions.fromJson(jsonReader);
                // namespace
                if (CoreUtils.isNullOrEmpty(options.getNamespace())) {
                    if (codeModel.getLanguage().getJava() != null && !CoreUtils.isNullOrEmpty(
                        codeModel.getLanguage().getJava().getNamespace())) {
                        options.setNamespace(codeModel.getLanguage().getJava().getNamespace());
                    }
                }

                // output path
                if (CoreUtils.isNullOrEmpty(options.getOutputDir())) {
                    options.setOutputDir("typespec-tests/tsp-output/");
                } else if (!options.getOutputDir().endsWith("/")) {
                    options.setOutputDir(options.getOutputDir() + "/");
                }
            } catch (IOException e) {
                LOGGER.info("Read emitter options failed, emitter options json: {}", emitterOptionsJson);
            }
        }

        if (options == null) {
            // default if emitterOptions fails
            options = new EmitterOptions();
            options.setOutputDir("typespec-tests/tsp-output/");
            if (codeModel.getLanguage().getJava() != null && !CoreUtils.isNullOrEmpty(
                codeModel.getLanguage().getJava().getNamespace())) {
                options.setNamespace(codeModel.getLanguage().getJava().getNamespace());
            }
        }
        return options;
    }

    private static CodeModel loadCodeModel(String filename) throws IOException {
        String file = Files.readString(Paths.get(filename));
        return getYaml().loadAs(file, CodeModel.class);
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
