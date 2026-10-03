// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor;

import com.github.javaparser.StaticJavaParser;
import com.microsoft.typespec.http.client.generator.core.customization.Customization;
import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.partialupdate.util.PartialUpdateHandler;
import com.microsoft.typespec.http.client.generator.core.postprocessor.implementation.CodeFormatterUtil;
import io.clientcore.core.serialization.json.JsonReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import javax.tools.DiagnosticCollector;
import javax.tools.FileObject;
import javax.tools.ForwardingJavaFileManager;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileManager;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import org.slf4j.Logger;

public class Postprocessor {
    protected final NewPlugin plugin;
    private final Logger logger;

    public Postprocessor(NewPlugin plugin) {
        this.plugin = plugin;
        this.logger = new PluginLogger(plugin, Postprocessor.class);
    }

    @SuppressWarnings("unchecked")
    public void postProcess(Map<String, String> fileContents) {
        Editor editor = new Editor(fileContents);
        String jarPath = JavaSettings.getInstance().getCustomizationJarPath();
        String className = JavaSettings.getInstance().getCustomizationClass();

        if (className == null) {
            try {
                writeToFiles(editor, plugin, logger);
            } catch (Exception e) {
                logger.error("Failed to complete postprocessing.", e);
                throw new RuntimeException("Failed to complete postprocessing.", e);
            }
            return;
        }

        if (jarPath == null && !className.endsWith(".java")) {
            logger.warn("Must provide a JAR path or a source file path containing the customization class {}",
                className);
            throw new RuntimeException(
                "Must provide a JAR path or a source file path containing the customization class " + className);
        }

        try {
            // Step 1: post process
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
                URLClassLoader loader
                    = URLClassLoader.newInstance(new URL[] { jarUrl }, ClassLoader.getSystemClassLoader());
                try {
                    customizationClass = (Class<? extends Customization>) Class.forName(className, true, loader);
                } catch (Exception e) {
                    new PluginLogger(plugin, Postprocessor.class, "LoadCustomizationClass").warn(
                        "Customization class " + className + " not found in customization jar. Customization skipped.",
                        e);
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
                customization.run(editor, logger);
            } catch (Exception e) {
                logger.error("Unable to complete customization", e);
                throw new RuntimeException("Unable to complete customization", e);
            }

            // Step 2: Print to files
            writeToFiles(editor, plugin, logger);
        } catch (Exception e) {
            logger.error("Failed to complete postprocessing.", e);
            throw new RuntimeException("Failed to complete postprocessing.", e);
        }
    }

    public static void writeToFiles(Map<String, String> javaFiles, NewPlugin plugin, Logger logger) {
        writeToFiles(new Editor(javaFiles), plugin, logger);
    }

    public static void writeToFiles(Editor editor, NewPlugin plugin, Logger logger) {
        JavaSettings settings = JavaSettings.getInstance();
        if (settings.isHandlePartialUpdate()) {
            handlePartialUpdate(editor, plugin, logger);
        }

        CodeFormatterUtil.formatCode(editor, plugin, logger);
    }

    private static String getReadme(NewPlugin plugin) {
        List<String> configurationFiles = plugin.getValueWithJsonReader("configurationFiles",
            jsonReader -> jsonReader.readArray(JsonReader::getString));

        return configurationFiles == null || configurationFiles.isEmpty()
            ? JavaSettings.getInstance().getProjectSettings().getOutputFolder()
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
        final Path originCustomizationFile = Paths.get(filePath);
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
                originCustomizationFile);
            return null;
        }
    }

    public static Class<? extends Customization> loadCustomizationClass(String className, String code) {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            throw new IllegalStateException(
                "A Java Development Kit (JDK) is required to compile customization source files.");
        }

        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        Map<String, ByteArrayOutputStream> compiledClasses = new HashMap<>();
        JavaFileObject source = new SimpleJavaFileObject(
            URI.create("string:///" + className.replace('.', '/') + JavaFileObject.Kind.SOURCE.extension),
            JavaFileObject.Kind.SOURCE) {
            @Override
            public CharSequence getCharContent(boolean ignoreEncodingErrors) {
                return code;
            }
        };

        try (JavaFileManager fileManager = new ForwardingJavaFileManager<StandardJavaFileManager>(
            compiler.getStandardFileManager(diagnostics, Locale.ROOT, StandardCharsets.UTF_8)) {
            @Override
            public JavaFileObject getJavaFileForOutput(Location location, String binaryName, JavaFileObject.Kind kind,
                FileObject sibling) {
                return new SimpleJavaFileObject(URI.create("bytes:///" + binaryName.replace('.', '/') + kind.extension),
                    kind) {
                    @Override
                    public OutputStream openOutputStream() {
                        ByteArrayOutputStream output = new ByteArrayOutputStream();
                        compiledClasses.put(binaryName, output);
                        return output;
                    }
                };
            }
        }) {
            List<String> options = List.of("-classpath", System.getProperty("java.class.path"), "-proc:none");
            if (!compiler.getTask(null, fileManager, diagnostics, options, null, List.of(source)).call()) {
                throw new IllegalStateException("Failed to compile customization class " + className + ":\n"
                    + diagnostics.getDiagnostics().stream().map(Object::toString).collect(Collectors.joining("\n")));
            }
        } catch (IOException ex) {
            throw new UncheckedIOException("Failed to compile customization class " + className, ex);
        }

        ClassLoader classLoader = new ClassLoader(Customization.class.getClassLoader()) {
            @Override
            protected Class<?> findClass(String binaryName) throws ClassNotFoundException {
                ByteArrayOutputStream output = compiledClasses.get(binaryName);
                if (output == null) {
                    throw new ClassNotFoundException(binaryName);
                }
                byte[] bytes = output.toByteArray();
                return defineClass(binaryName, bytes, 0, bytes.length);
            }
        };
        try {
            return Class.forName(className, true, classLoader).asSubclass(Customization.class);
        } catch (ClassNotFoundException | ClassCastException ex) {
            throw new IllegalStateException("Unable to load compiled customization class " + className, ex);
        }
    }

    private static void handlePartialUpdate(Editor editor, NewPlugin plugin, Logger logger) {
        logger.info("Begin handle partial update...");
        // handle partial update
        // currently only support add additional interface or overload a generated method in sync and async client
        for (String path : editor.getContents().keySet()) {
            if (path.endsWith(".java")) { // only handle for .java file
                // get existing file path
                // use output-folder from autorest, if exists and is absolute path
                String projectBaseDirectoryPath = null;
                String outputFolderPath = JavaSettings.getInstance().getProjectSettings().getOutputFolder();
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
                        PartialUpdateHandler
                            .mergeCompilationUnits(editor.getCompilationUnit(path),
                                StaticJavaParser.parse(existingFileContent))
                            .ifPresent(compilationUnit -> editor.setCompilationUnit(path, compilationUnit));
                    } catch (IOException e) {
                        logger.error("Unable to get content from file path", e);
                        throw new UncheckedIOException(e);
                    }
                }
            }
        }
        logger.info("Finish handle partial update.");
    }

}
