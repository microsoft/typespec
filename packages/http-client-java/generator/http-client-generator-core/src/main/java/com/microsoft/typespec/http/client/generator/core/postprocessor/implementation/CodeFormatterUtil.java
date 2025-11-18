// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor.implementation;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.printer.configuration.ImportOrderingStrategy;
import com.github.javaparser.printer.configuration.imports.DefaultImportOrderingStrategy;
import com.google.googlejavaformat.FormatterDiagnostic;
import com.google.googlejavaformat.java.FormatterException;
import com.google.googlejavaformat.java.RemoveUnusedImports;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.util.Constants;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.eclipse.jdt.core.ToolFactory;
import org.eclipse.jdt.core.formatter.CodeFormatter;
import org.eclipse.jdt.internal.compiler.env.IModule;
import org.eclipse.jface.text.Document;
import org.eclipse.jface.text.IDocument;
import org.eclipse.text.edits.TextEdit;
import org.slf4j.Logger;
import org.w3c.dom.NodeList;

/**
 * Utility class that handles code formatting.
 */
public final class CodeFormatterUtil {

    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format.
     * @param plugin The plugin to use to write the formatted files.
     */
    public static void formatCode(Map<String, String> files, NewPlugin plugin, Logger logger) {
        formatCodeInternal(files, logger).forEach(entry -> plugin.writeFile(entry.getKey(), entry.getValue(), null));
    }

    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format. The entry is filename and content.
     * @return the files after format.
     * @throws RuntimeException If code formatting fails.
     */
    public static List<String> formatCode(Map<String, String> files) {
        return formatCodeInternal(files, null).map(Map.Entry::getValue).collect(Collectors.toList());
    }

    private static Stream<Map.Entry<String, String>> formatCodeInternal(Map<String, String> files, Logger logger) {
        Map<String, String> eclipseSettings = loadEclipseSettings();
        DefaultImportOrderingStrategy orderingStrategy = new DefaultImportOrderingStrategy();
        orderingStrategy.setSortImportsAlphabetically(true);

        return removeUnusedImports(files.entrySet(), logger).stream().map(entry -> {
            try {
                String file = reorderImports(entry.getValue(), orderingStrategy);
                file = formatCode(file, entry.getKey(), ToolFactory.createCodeFormatter(eclipseSettings));
                return Map.entry(entry.getKey(), file);
            } catch (Exception e) {
                // print file content
                String errorMessage
                    = "Failed to format file: " + entry.getKey() + ". File content: \n" + entry.getValue();
                if (logger != null) {
                    logger.error(errorMessage);
                }

                throw new RuntimeException(errorMessage, e);
            }
        });
    }

    /**
     * Loads the Eclipse formatter settings from the XML file.
     *
     * @return The Eclipse formatter settings.
     * @throws RuntimeException If the formatter settings could not be loaded.
     */
    private static Map<String, String> loadEclipseSettings() {
        try {
            DocumentBuilder documentBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            org.w3c.dom.Document document = documentBuilder.parse(
                CodeFormatterUtil.class.getClassLoader().getResourceAsStream("eclipse-format-azure-sdk-for-java.xml"));

            NodeList formatterSettingXml = document.getElementsByTagName("setting");
            Map<String, String> formatterSettings = new HashMap<>();
            for (int i = 0; i < formatterSettingXml.getLength(); i++) {
                org.w3c.dom.Node node = formatterSettingXml.item(i);
                formatterSettings.put(node.getAttributes().getNamedItem("id").getNodeValue(),
                    node.getAttributes().getNamedItem("value").getNodeValue());
            }

            return formatterSettings;
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }

    /**
     * Reorders the imports in alphabetical ordering.
     * <p>
     * This helper method performs many tasks manually to maintain the original formatting of the file as much as
     * possible. Using {@link CompilationUnit} to manipulate the imports and then printing the entire file back
     * results in newline removal and trailing space removal which is just noise for us.
     *
     * @param file The Java file to reorder imports for.
     * @param orderingStrategy The import ordering strategy to use.
     * @return The Java file with reordered imports, or if the file has no imports the file as-is.
     */
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    private static String reorderImports(String file, ImportOrderingStrategy orderingStrategy) {
        CompilationUnit compilationUnit = StaticJavaParser.parse(file);
        com.github.javaparser.ast.NodeList<ImportDeclaration> imports = compilationUnit.getImports();
        if (imports.isEmpty()) {
            // File has no imports, nothing to reorder.
            return file;
        }

        // Positions of the existing imports in the file.
        // Position uses 1-based indexing, so when we replace imports later we need to adjust this to 0-based indexing
        // for Java's List.
        int importStartLine = imports.stream().mapToInt(i -> i.getBegin().get().line).min().getAsInt();
        int importEndLine = imports.stream().mapToInt(i -> i.getEnd().get().line).max().getAsInt();

        // Using DefaultImportOrderingStrategy which returns a single NodeList after sorting.
        // If this strategy is changed, inspect the orderer used for how many NodeLists are returned.
        // For example, a made up SplitInstanceAndStaticImportOrderingStrategy could return two NodeLists,
        // one for sorted instance imports and one for sorted static imports.
        imports = orderingStrategy.sortImports(imports).get(0);

        List<String> lines = file.lines().collect(Collectors.toList());

        int lastLineReplaced = importStartLine - 1;
        for (ImportDeclaration importDeclaration : distinctImports(imports)) {
            lines.set(lastLineReplaced, importToString(importDeclaration));
            lastLineReplaced++;
        }

        // Remove any remaining old import lines if the new import list is shorter.
        if (importEndLine >= lastLineReplaced) {
            // Use importLineEnd as-is since Position is 1-based and subList's end index is exclusive.
            lines.subList(lastLineReplaced, importEndLine).clear();
        }

        return String.join("\n", lines);
    }

    private static List<ImportDeclaration> distinctImports(List<ImportDeclaration> imports) {
        Map<String, ImportDeclaration> importMap = new LinkedHashMap<>();
        for (ImportDeclaration importDecl : imports) {
            importMap.putIfAbsent(importDecl.toString(), importDecl);
        }
        return new ArrayList<>(importMap.values());
    }

    /**
     * Converts an {@link ImportDeclaration} to its string representation.
     * <p>
     * This is done as {@link ImportDeclaration#toString()} uses an internal printer which adds newline characters we
     * don't want. And instead of configuring our own printer just for this, we manually build the string.
     *
     * @param importDeclaration The import declaration.
     * @return The import statement representation of the import declaration.
     */
    private static String importToString(ImportDeclaration importDeclaration) {
        StringBuilder sb = new StringBuilder();
        sb.append("import ");
        if (importDeclaration.isStatic()) {
            sb.append("static ");
        }
        sb.append(importDeclaration.getNameAsString());
        if (importDeclaration.isAsterisk()) {
            sb.append(".*");
        }
        sb.append(";");
        return sb.toString();
    }

    private static String formatCode(String file, String fileName, CodeFormatter codeFormatter) throws Exception {
        IDocument doc = new Document(file);

        boolean isModuleInfo = IModule.MODULE_INFO_JAVA.equals(fileName);
        int kind = isModuleInfo ? CodeFormatter.K_MODULE_INFO : CodeFormatter.K_COMPILATION_UNIT;
        kind |= CodeFormatter.F_INCLUDE_COMMENTS;
        TextEdit edit = codeFormatter.format(kind, file, 0, file.length(), 0, Constants.NEW_LINE);
        edit.apply(doc);

        return doc.get();
    }

    /*
     * In previous iterations of code formatting, we let Spotless use Google Java Formatter to remove unused imports.
     * This worked well when code was valid, but when there were errors Spotless would halt processing on the first
     * issue found. This meant that resolving issues were difficult, as it could take many iterations to resolve the
     * regressions introduced.
     *
     * This then resulted in a new design where when Spotless failed on the entire fileset we would run Spotless
     * individually on each file, and log the error message with the file content. This worked, but was tremendously
     * slow as it required running many Maven processes, one for each file.
     *
     * This new implementation takes a dependency on google-java-format to run Google Java Formatter ourselves. This
     * allows us to control error handling by processing all files, in-memory (much faster than letting Spotless run
     * Google Java Formatter), and capturing all issues before attempting Spotless formatting (which now excludes
     * unused import removal).
     */
    private static List<Map.Entry<String, String>> removeUnusedImports(Collection<Map.Entry<String, String>> files,
        Logger logger) {
        List<Map.Entry<String, String>> updatedFiles = new ArrayList<>(files.size());

        // Tracker for errors encountered while running Google Java Formatter.
        StringBuilder errorCapture = new StringBuilder();

        for (Map.Entry<String, String> file : files) {
            String content = file.getValue();
            try {
                // Use Google Java Formatter to remove unused imports.
                updatedFiles.add(
                    new AbstractMap.SimpleEntry<>(file.getKey(), RemoveUnusedImports.removeUnusedImports(content)));
            } catch (FormatterException ex) {
                String[] fileLines = content.split("\n");
                // Capture the error message and continue processing other files.
                for (FormatterDiagnostic diagnostic : ex.diagnostics()) {
                    appendDiagnosticError(errorCapture, diagnostic, file.getKey(), fileLines, logger);
                }
            }
            file.setValue(content);
        }

        if (errorCapture.length() > 0) {
            throw new IllegalStateException("Google Java Formatter encountered errors:\n" + errorCapture);
        }

        return updatedFiles;
    }

    private static void appendDiagnosticError(StringBuilder errorCapture, FormatterDiagnostic diagnostic,
        String fileName, String[] fileLines, Logger logger) {
        int lineNumber = diagnostic.line();
        int columnNumber = diagnostic.column();
        int startLine = Math.max(0, lineNumber - 3);
        int endLine = Math.min(fileLines.length - 1, lineNumber + 2);

        StringBuilder diagnosticMessageBuilder = new StringBuilder();
        diagnosticMessageBuilder.append("Error in file '")
            .append(fileName)
            .append("', ")
            .append(diagnostic)
            .append(":\n");

        for (int i = startLine; i <= endLine; i++) {
            String prefix = (i + 1) + ": ";
            diagnosticMessageBuilder.append(prefix).append(fileLines[i]).append("\n");
            if (i == lineNumber - 1) {
                diagnosticMessageBuilder.append(" ".repeat(columnNumber + prefix.length() - 1)).append("^\n");
            }
        }

        String diagnosticMessage = diagnosticMessageBuilder.toString();
        if (logger != null) {
            logger.error(diagnosticMessage);
        }
        errorCapture.append(diagnosticMessage);
    }

}
