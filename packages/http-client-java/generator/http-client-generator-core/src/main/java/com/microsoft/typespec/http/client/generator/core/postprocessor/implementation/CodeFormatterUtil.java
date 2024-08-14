// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor.implementation;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.PackageDeclaration;
import com.github.javaparser.ast.comments.JavadocComment;
import com.github.javaparser.ast.nodeTypes.NodeWithIdentifier;
import com.github.javaparser.ast.nodeTypes.NodeWithName;
import com.github.javaparser.ast.nodeTypes.NodeWithSimpleName;
import org.eclipse.jdt.core.ToolFactory;
import org.eclipse.jdt.core.formatter.CodeFormatter;
import org.eclipse.jdt.internal.compiler.env.IModule;
import org.eclipse.jface.text.Document;
import org.eclipse.jface.text.IDocument;
import org.eclipse.text.edits.TextEdit;
import org.slf4j.Logger;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

/**
 * Utility class that handles code formatting.
 */
public final class CodeFormatterUtil {
    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format.
     * @param plugin The plugin to use to write the formatted files.
     * @throws Exception If code formatting fails.
     */
    public static void formatCode(Map<String, String> files, NewPlugin plugin) throws Exception {
        AtomicReference<Logger> loggerReference = new AtomicReference<>();
        Map<String, String> eclipseSettings = loadEclipseSettings();
        files.entrySet().parallelStream().forEach(fileEntry -> {
            try {
                String file = removeUnusedImports(fileEntry.getValue());
                file = formatCode(file, fileEntry.getKey(), ToolFactory.createCodeFormatter(eclipseSettings));

                plugin.writeFile(fileEntry.getKey(), file, null);
            } catch (Exception e) {
                // print file content
                Logger logger = loggerReference.updateAndGet(logger1 ->
                    logger1 == null ? new PluginLogger(plugin, CodeFormatterUtil.class) : logger1);
                String errorMessage = "Failed to format file: " + fileEntry.getKey() + ". File content: \n" + fileEntry.getValue();
                logger.error(errorMessage);

                throw new RuntimeException("Failed to format: " + fileEntry.getKey(), e);
            }
        });
    }

    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format. The entry is filename and content.
     * @return the files after format.
     * @throws Exception If code formatting fails.
     */
    public static List<String> formatCode(List<Map.Entry<String, String>> files) throws Exception {
        Map<String, String> eclipseSettings = loadEclipseSettings();
        return files.parallelStream().map(fileEntry -> {
            try {
                String file = removeUnusedImports(fileEntry.getValue());
                file = formatCode(file, fileEntry.getKey(), ToolFactory.createCodeFormatter(eclipseSettings));
                return file;
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }).collect(Collectors.toList());
    }

    /**
     * Loads the Eclipse formatter settings from the XML file.
     *
     * @return The Eclipse formatter settings.
     * @throws Exception If the formatter settings could not be loaded.
     */
    private static Map<String, String> loadEclipseSettings() throws Exception {
        DocumentBuilder documentBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
        org.w3c.dom.Document document = documentBuilder.parse(CodeFormatterUtil.class.getClassLoader()
            .getResourceAsStream("readme/eclipse-format-azure-sdk-for-java.xml"));

        NodeList formatterSettingXml = document.getElementsByTagName("setting");
        Map<String, String> formatterSettings = new HashMap<>();
        for (int i = 0; i < formatterSettingXml.getLength(); i++) {
            org.w3c.dom.Node node = formatterSettingXml.item(i);
            formatterSettings.put(node.getAttributes().getNamedItem("id").getNodeValue(),
                node.getAttributes().getNamedItem("value").getNodeValue());
        }

        return formatterSettings;
    }

    /**
     * Removes unused imports from the given file.
     *
     * @param file The file to remove unused imports from.
     * @return The file with unused imports removed.
     */
    private static String removeUnusedImports(String file) {
        CompilationUnit compilationUnit = StaticJavaParser.parse(file);
        com.github.javaparser.ast.NodeList<ImportDeclaration> imports = compilationUnit.getImports();

        // Nothing to clean up.
        if (imports.isEmpty()) {
            return file;
        }

        // Package declaration could be null.
        PackageDeclaration packageDeclaration = compilationUnit.getPackageDeclaration().orElse(null);
        String packageName = packageDeclaration != null ? packageDeclaration.getNameAsString() : null;

        // Collect all names used in the file that aren't associated with the package or imports.
        Set<String> types = compilationUnit.stream()
            .filter(node -> node instanceof NodeWithIdentifier || node instanceof NodeWithName
                || node instanceof NodeWithSimpleName)
            .filter(node -> !node.isDescendantOf(packageDeclaration) && !(node instanceof PackageDeclaration))
            .filter(node -> imports.stream().noneMatch(node::isDescendantOf) && !(node instanceof ImportDeclaration))
            .map(node -> {
                if (node instanceof NodeWithIdentifier) {
                    return ((NodeWithIdentifier<?>) node).getIdentifier();
                } else if (node instanceof NodeWithName) {
                    return ((NodeWithName<?>) node).getNameAsString();
                } else {
                    return ((NodeWithSimpleName<?>) node).getNameAsString();
                }
            })
            .collect(Collectors.toSet());

        // Collect all the types used in the Javadoc comments.
        compilationUnit.getAllComments().stream()
            .filter(comment -> comment instanceof JavadocComment)
            .map(comment -> (JavadocComment) comment)
            .forEach(javadoc -> javadoc.parse().getBlockTags()
                .forEach(tag -> tag.getName().ifPresent(types::add)));

        // Get the list of imports that are unused.
        Map<Integer, ImportDeclaration> importsToRemove = imports.stream().filter(importDeclaration -> {
            String fullImportName = importDeclaration.getNameAsString();
            if (Objects.equals(fullImportName, packageName)) {
                return true;
            }

            String importType = importDeclaration.getName().getIdentifier();
            return !types.contains(importType);
        }).collect(Collectors.toMap(importDeclaration -> importDeclaration.getRange().get().begin.line,
            importDeclaration -> importDeclaration));

        // Get the list of duplicate imports.
        imports.stream().collect(Collectors.groupingBy(ImportDeclaration::getNameAsString)).entrySet().stream()
            .filter(entry -> entry.getValue().size() > 1)
            .flatMap(entry -> entry.getValue().stream().skip(1))
            .forEach(importDeclaration -> importsToRemove.put(importDeclaration.getRange().get().begin.line,
                importDeclaration));

        // Nothing to clean up.
        if (importsToRemove.isEmpty()) {
            return file;
        }

        // Split the file into lines to remove the unused imports.
        List<String> lines = new ArrayList<>(Arrays.asList(file.split("\r?\n")));

        List<ImportDeclaration> sortedImportsToRemove = importsToRemove.entrySet().stream()
            .sorted(Map.Entry.comparingByKey(Comparator.reverseOrder())).map(Map.Entry::getValue)
            .collect(Collectors.toList());

        for (ImportDeclaration importDeclaration : sortedImportsToRemove) {
            int startLine = importDeclaration.getRange().get().begin.line - 1;
            int endLine = importDeclaration.getRange().get().end.line - 1;

            for (int i = startLine; i <= endLine; i++) {
                lines.remove(i);
            }
        }

        return String.join(System.lineSeparator(), lines);
    }

    private static String formatCode(String file, String fileName, CodeFormatter codeFormatter) throws Exception {
        IDocument doc = new Document(file);

        int kind = IModule.MODULE_INFO_JAVA.equals(fileName)
            ? CodeFormatter.K_MODULE_INFO : CodeFormatter.K_COMPILATION_UNIT;
        kind |= CodeFormatter.F_INCLUDE_COMMENTS;
        TextEdit edit = codeFormatter.format(kind, file, 0, file.length(), 0, null);
        edit.apply(doc);

        return doc.get();
    }
}
