// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor;

import com.microsoft.typespec.http.client.generator.core.customization.Customization;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.FileUtils;
import com.microsoft.typespec.http.client.generator.core.partialupdate.util.PartialUpdateHandler;
import com.microsoft.typespec.http.client.generator.core.postprocessor.implementation.CodeFormatterUtil;
import com.azure.json.JsonReader;
import org.slf4j.Logger;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

public class Postprocessor {
    protected final NewPlugin plugin;
    private final Logger logger;

    public Postprocessor(NewPlugin plugin) {
        this.plugin = plugin;
        this.logger = new PluginLogger(plugin, Postprocessor.class);
    }

    @SuppressWarnings("unchecked")
    public void postProcess(Map<String, String> fileContents) {
        String jarPath = JavaSettings.getInstance().getCustomizationJarPath();
        String className = JavaSettings.getInstance().getCustomizationClass();

        if (className == null) {
            try {
                writeToFiles(fileContents, plugin, logger);
            } catch (Exception e) {
                logger.error("Failed to complete postprocessing.", e);
                throw new RuntimeException("Failed to complete postprocessing.", e);
            }
            return;
        }

        if (jarPath == null && !className.endsWith(".java")) {
            logger.warn("Must provide a JAR path or a source file path containing the customization class {}", className);
            throw new RuntimeException("Must provide a JAR path or a source file path containing the customization class " + className);
        }

        try {
            //Step 1: post process
            Class<? extends Customization> customizationClass;
            if (jarPath != null) {
                URL jarUrl = null;
                if (!jarPath.startsWith("http")) {
                    if (Paths.get(jarPath).isAbsolute()) {
                        jarUrl = new File(jarPath).toURI().toURL();
                    } else {
                        String baseDirectory = getBaseDirectory(plugin);
                        if (baseDirectory != null) {
                            jarUrl = Paths.get(baseDirectory, jarPath).toUri().toURL();
                        }
                    }
                } else {
                    jarUrl = new URI(jarPath).toURL();
                }
                if (jarUrl == null || Files.notExists(Paths.get(jarUrl.toURI()))) {
                    new PluginLogger(plugin, Postprocessor.class, "LoadCustomizationJar")
                        .warn("Customization JAR {} not found. Customization skipped.", jarPath);
                    return;
                }
                URLClassLoader loader = URLClassLoader.newInstance(new URL[]{jarUrl}, ClassLoader.getSystemClassLoader());
                try {
                    customizationClass = (Class<? extends Customization>) Class.forName(className, true, loader);
                } catch (Exception e) {
                    new PluginLogger(plugin, Postprocessor.class, "LoadCustomizationClass")
                        .warn("Customization class " + className +
                            " not found in customization jar. Customization skipped.", e);
                    return;
                }
            } else if (className.endsWith(".java")) {
                customizationClass = loadCustomizationClassFromJavaCode(className, getBaseDirectory(plugin), logger);
            } else {
                throw new RuntimeException("Invalid customization class " + className);
            }

            try {
                Customization customization = customizationClass.getConstructor().newInstance();
                logger.info("Running customization, this may take a while...");
                fileContents = customization.run(fileContents, logger);
            } catch (Exception e) {
                logger.error("Unable to complete customization", e);
                throw new RuntimeException("Unable to complete customization", e);
            }

            //Step 2: Print to files
            writeToFiles(fileContents, plugin, logger);
        } catch (Exception e) {
            logger.error("Failed to complete postprocessing.", e);
            throw new RuntimeException("Failed to complete postprocessing.", e);
        }
    }

    public static void writeToFiles(Map<String, String> javaFiles, NewPlugin plugin, Logger logger) {
        JavaSettings settings = JavaSettings.getInstance();
        if (settings.isHandlePartialUpdate()) {
            handlePartialUpdate(javaFiles, plugin, logger);
        }

        try {
            CodeFormatterUtil.formatCode(javaFiles, plugin);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }

    private static String getReadme(NewPlugin plugin) {
        List<String> configurationFiles = plugin.getValueWithJsonReader("configurationFiles",
            jsonReader -> jsonReader.readArray(JsonReader::getString));

        return configurationFiles == null || configurationFiles.isEmpty()
            ? JavaSettings.getInstance().getAutorestSettings().getOutputFolder()
            : configurationFiles.stream().filter(key -> !key.contains(".autorest")).findFirst().orElse(null);
    }

    private static String getBaseDirectory(NewPlugin plugin) {
        String readme = getReadme(plugin);
        if (readme != null) {
            return new File(URI.create(readme).getPath()).getParent();
        }

        // TODO: get autorest running directory
        return null;
    }

    public static Class<? extends Customization> loadCustomizationClassFromJavaCode(String filePath,
        String baseDirectory, Logger logger) {
        Path customizationFile = Paths.get(filePath);
        if (!customizationFile.isAbsolute()) {
            if (baseDirectory != null) {
                customizationFile = Paths.get(baseDirectory, filePath);
            }
        }

        try {
            String code = Files.readString(customizationFile);
            return loadCustomizationClass(customizationFile.getFileName().toString().replace(".java", ""), code);
        } catch (IOException e) {
            logger.error("Cannot read customization from base directory {} and file {}", baseDirectory,
                customizationFile);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public static Class<? extends Customization> loadCustomizationClass(String className, String code) {
        Path customizationCompile = null;
        try {
            customizationCompile = FileUtils.createTempDirectory("customizationCompile" + UUID.randomUUID());

            Path pomPath = customizationCompile.resolve("compile-pom.xml");
            Files.copy(Postprocessor.class.getClassLoader().getResourceAsStream("readme/pom.xml"), pomPath);

            Path sourcePath = customizationCompile.resolve("src/main/java/" + className + ".java");
            Files.createDirectories(sourcePath.getParent());

            Files.writeString(sourcePath, code);

            attemptMavenInstall(pomPath);

            URL fileUrl = customizationCompile.resolve("target/classes").toUri().toURL();
            URLClassLoader classLoader = URLClassLoader.newInstance(new URL[]{fileUrl},
                ClassLoader.getSystemClassLoader());
            return (Class<? extends Customization>) Class.forName(className, true, classLoader);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        } finally {
            if (customizationCompile != null) {
                Utils.deleteDirectory(customizationCompile.toFile());
            }
        }
    }

    private static void handlePartialUpdate(Map<String, String> fileContents, NewPlugin plugin, Logger logger) {
        logger.info("Begin handle partial update...");
        // handle partial update
        // currently only support add additional interface or overload a generated method in sync and async client
        fileContents.replaceAll((path, generatedFileContent) -> {
            if (path.endsWith(".java")) { // only handle for .java file
                // get existing file path
                // use output-folder from autorest, if exists and is absolute path
                String projectBaseDirectoryPath = null;
                String outputFolderPath = JavaSettings.getInstance().getAutorestSettings().getOutputFolder();
                if (Paths.get(outputFolderPath).isAbsolute()) {
                    projectBaseDirectoryPath = outputFolderPath;
                }
                if (projectBaseDirectoryPath == null || !(new File(projectBaseDirectoryPath).isDirectory())) {
                    // use parent directory of swagger/readme.md
                    projectBaseDirectoryPath = new File(getBaseDirectory(plugin)).getParent();
                }
                Path existingFilePath = Paths.get(projectBaseDirectoryPath, path);
                // check if existingFile exists, if not, no need to handle partial update
                if (Files.exists(existingFilePath)) {
                    try {
                        String existingFileContent = Files.readString(existingFilePath);
                        return PartialUpdateHandler.handlePartialUpdateForFile(generatedFileContent, existingFileContent);
                    } catch (Exception e) {
                        logger.error("Unable to get content from file path", e);
                        throw new RuntimeException(e);
                    }
                }
            }
            return generatedFileContent;
        });
        logger.info("Finish handle partial update.");
    }

    private static void attemptMavenInstall(Path pomPath) {
        String[] command = Utils.isWindows()
            ? new String[] { "cmd", "/c", "mvn", "compiler:compile", "-f", pomPath.toString() }
            : new String[] { "mvn", "compiler:compile", "-f", pomPath.toString() };

        try {
            File outputFile = Files.createTempFile(pomPath.getParent(), "compile", ".log").toFile();
            Process process = new ProcessBuilder(command)
                .redirectErrorStream(true)
                .redirectOutput(ProcessBuilder.Redirect.to(outputFile))
                .start();
            process.waitFor(60, TimeUnit.SECONDS);

            if (process.isAlive() || process.exitValue() != 0) {
                process.destroyForcibly();
                throw new RuntimeException("Compile failed to complete within 60 seconds or failed with an error code. "
                    + Files.readString(outputFile.toPath())
                    + "If this happens 'mvn compile -f " + pomPath + "' to install dependencies manually.");
            }
        } catch (IOException | InterruptedException ex) {
            throw new RuntimeException("Failed to run compile on generated code.", ex);
        }
    }
}
