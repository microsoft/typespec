// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor.implementation;

import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.printer.configuration.ImportOrderingStrategy;
import com.github.javaparser.printer.configuration.imports.DefaultImportOrderingStrategy;
import com.google.googlejavaformat.FormatterDiagnostic;
import com.google.googlejavaformat.java.FormatterException;
import com.google.googlejavaformat.java.RemoveUnusedImports;
import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.util.Constants;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.eclipse.jdt.core.ToolFactory;
import org.eclipse.jdt.core.compiler.IScanner;
import org.eclipse.jdt.core.compiler.ITerminalSymbols;
import org.eclipse.jdt.core.compiler.InvalidInputException;
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
    private static final int MAX_FORMATTER_WORKERS = 4;
    private static final int FILES_PER_FORMATTER_WORKER = 32;

    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format.
     * @param plugin The plugin to use to write the formatted files.
     */
    public static void formatCode(Map<String, String> files, NewPlugin plugin, Logger logger) {
        formatCode(new Editor(files), plugin, logger);
    }

    public static void formatCode(Editor editor, NewPlugin plugin, Logger logger) {
        formatCodeInternal(editor, logger).forEach(entry -> plugin.writeFile(entry.getKey(), entry.getValue(), null));
    }

    /**
     * Formats the given files by removing unused imports and applying Eclipse code formatting.
     *
     * @param files The files to format. The entry is filename and content.
     * @return the files after format.
     * @throws RuntimeException If code formatting fails.
     */
    public static List<String> formatCode(Map<String, String> files) {
        return formatCode(new Editor(files));
    }

    public static List<String> formatCode(Editor editor) {
        return formatCodeInternal(editor, null).map(Map.Entry::getValue).collect(Collectors.toList());
    }

    private static Stream<Map.Entry<String, String>> formatCodeInternal(Editor editor, Logger logger) {
        String configuredWorkers = System.getProperty("codegen.java.formatter.parallelism");
        if (configuredWorkers == null) {
            configuredWorkers = System.getenv("TYPESPEC_JAVA_FORMATTER_PARALLELISM");
        }
        int parallelism = resolveParallelism(editor.getContents().size(), Runtime.getRuntime().availableProcessors(),
            configuredWorkers);
        return formatCodeInternal(editor, logger, parallelism);
    }

    static int resolveParallelism(int fileCount, int availableProcessors, String configuredWorkers) {
        int workers = Math.max(1, fileCount / FILES_PER_FORMATTER_WORKER);
        if (configuredWorkers != null) {
            try {
                workers = Integer.parseInt(configuredWorkers);
            } catch (NumberFormatException exception) {
                throw new IllegalArgumentException(
                    "Formatter parallelism must be a positive integer: " + configuredWorkers, exception);
            }
            if (workers < 1) {
                throw new IllegalArgumentException(
                    "Formatter parallelism must be a positive integer: " + configuredWorkers);
            }
        }
        return Math.max(1,
            Math.min(Math.min(workers, MAX_FORMATTER_WORKERS), Math.min(fileCount, availableProcessors)));
    }

    static Stream<Map.Entry<String, String>> formatCodeInternal(Editor editor, Logger logger, int parallelism) {
        Map<String, String> eclipseSettings = loadEclipseSettings();
        DefaultImportOrderingStrategy orderingStrategy = new DefaultImportOrderingStrategy();
        orderingStrategy.setSortImportsAlphabetically(true);

        Map<String, String> files = new LinkedHashMap<>();
        Map<String, Exception> parseFailures = new HashMap<>();
        Set<String> moduleInfoFiles = new HashSet<>();
        for (Map.Entry<String, String> entry : editor.getContents().entrySet()) {
            try {
                CompilationUnit compilationUnit = editor.getCachedCompilationUnit(entry.getKey());
                String reordered = null;
                if (compilationUnit == null) {
                    reordered = reorderUntouchedImports(entry.getValue());
                    if (reordered == null) {
                        compilationUnit = editor.getCompilationUnit(entry.getKey());
                    }
                }
                if (entry.getKey().endsWith(IModule.MODULE_INFO_JAVA)
                    && (compilationUnit == null || compilationUnit.getModule().isPresent())) {
                    moduleInfoFiles.add(entry.getKey());
                }
                if (compilationUnit != null) {
                    reordered = reorderImports(entry.getValue(), compilationUnit,
                        editor.isCompilationUnitModified(entry.getKey()), orderingStrategy);
                }
                files.put(entry.getKey(), reordered);
            } catch (Exception exception) {
                files.put(entry.getKey(), entry.getValue());
                parseFailures.put(entry.getKey(), exception);
            } finally {
                editor.releaseCompilationUnit(entry.getKey());
            }
        }

        List<FormattingResult> results = formatFiles(new ArrayList<>(files.entrySet()), moduleInfoFiles, parseFailures,
            eclipseSettings, Math.max(1, Math.min(parallelism, MAX_FORMATTER_WORKERS)));
        StringBuilder errorCapture = new StringBuilder();
        for (FormattingResult result : results) {
            if (result.failure instanceof FormatterException) {
                String[] fileLines = result.content.split("\n");
                for (FormatterDiagnostic diagnostic : ((FormatterException) result.failure).diagnostics()) {
                    appendDiagnosticError(errorCapture, diagnostic, result.fileName, fileLines, logger);
                }
            }
        }
        if (errorCapture.length() > 0) {
            throw new IllegalStateException("Google Java Formatter encountered errors:\n" + errorCapture);
        }
        for (FormattingResult result : results) {
            if (result.failure != null) {
                String message = "Failed to format file: " + result.fileName + ". File content: \n" + result.content;
                if (logger != null) {
                    logger.error(message);
                }
                throw new RuntimeException(message, result.failure);
            }
        }
        return results.stream().map(result -> Map.entry(result.fileName, result.content));
    }

    private static List<FormattingResult> formatFiles(List<Map.Entry<String, String>> files,
        Set<String> moduleInfoFiles, Map<String, Exception> parseFailures, Map<String, String> eclipseSettings,
        int parallelism) {
        if (files.isEmpty()) {
            return List.of();
        }
        FormattingResult[] results = new FormattingResult[files.size()];
        AtomicInteger nextFile = new AtomicInteger();
        Callable<Void> worker = () -> {
            CodeFormatter formatter = ToolFactory.createCodeFormatter(new HashMap<>(eclipseSettings));
            int index;
            while ((index = nextFile.getAndIncrement()) < files.size()) {
                if (Thread.currentThread().isInterrupted()) {
                    throw new InterruptedException("Formatting was cancelled.");
                }
                Map.Entry<String, String> file = files.get(index);
                results[index] = formatFile(file, moduleInfoFiles.contains(file.getKey()),
                    parseFailures.get(file.getKey()), formatter);
            }
            return null;
        };
        ExecutorService executor = null;
        try {
            if (parallelism == 1) {
                worker.call();
            } else {
                AtomicInteger threadNumber = new AtomicInteger();
                executor = Executors.newFixedThreadPool(Math.min(parallelism, files.size()), task -> {
                    Thread thread = new Thread(task, "java-codegen-formatter-" + threadNumber.incrementAndGet());
                    thread.setDaemon(true);
                    return thread;
                });
                List<Callable<Void>> workers = new ArrayList<>();
                for (int workerIndex = 0; workerIndex < Math.min(parallelism, files.size()); workerIndex++) {
                    workers.add(worker);
                }
                for (Future<Void> future : executor.invokeAll(workers)) {
                    future.get();
                }
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while formatting Java files.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("Failed to format Java files.", exception.getCause());
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to format Java files.", exception);
        } finally {
            if (executor != null) {
                executor.shutdownNow();
            }
        }
        return Arrays.asList(results);
    }

    private static FormattingResult formatFile(Map.Entry<String, String> file, boolean moduleInfo,
        Exception parseFailure, CodeFormatter formatter) {
        String content = file.getValue();
        try {
            content = RemoveUnusedImports.removeUnusedImports(content);
            if (parseFailure != null) {
                return new FormattingResult(file.getKey(), content, parseFailure);
            }
            return new FormattingResult(file.getKey(), formatCode(content, moduleInfo, formatter), null);
        } catch (Exception exception) {
            return new FormattingResult(file.getKey(), content, exception);
        }
    }

    private static final class FormattingResult {
        private final String fileName;
        private final String content;
        private final Exception failure;

        private FormattingResult(String fileName, String content, Exception failure) {
            this.fileName = fileName;
            this.content = content;
            this.failure = failure;
        }
    }

    private static String reorderUntouchedImports(String file) throws InvalidInputException {
        IScanner scanner = ToolFactory.createScanner(true, false, false, "17");
        scanner.setSource(file.toCharArray());
        List<String> imports = new ArrayList<>();
        int importStart = -1;
        int importEnd = -1;
        int parentheses = 0;
        boolean commentAfterImport = false;
        int token;
        while ((token = scanner.getNextToken()) != ITerminalSymbols.TokenNameEOF) {
            if (isComment(token)) {
                if (importEnd >= 0) {
                    String gap = file.substring(importEnd, scanner.getCurrentTokenStartPosition());
                    if (gap.indexOf('\n') < 0 && gap.indexOf('\r') < 0) {
                        return null;
                    }
                    commentAfterImport = true;
                }
            } else if (token == ITerminalSymbols.TokenNameLPAREN) {
                parentheses++;
            } else if (token == ITerminalSymbols.TokenNameRPAREN) {
                parentheses--;
            } else if (parentheses == 0 && token == ITerminalSymbols.TokenNameimport) {
                int declarationStart = scanner.getCurrentTokenStartPosition();
                int lineStart
                    = Math.max(file.lastIndexOf('\n', declarationStart), file.lastIndexOf('\r', declarationStart)) + 1;
                if (commentAfterImport || !file.substring(lineStart, declarationStart).isBlank()) {
                    return null;
                }
                if (importStart < 0) {
                    importStart = declarationStart;
                }
                StringBuilder declaration = new StringBuilder();
                boolean expectName = true;
                boolean canBeStatic = true;
                boolean wildcard = false;
                while ((token = scanner.getNextToken()) != ITerminalSymbols.TokenNameSEMICOLON) {
                    if (token == ITerminalSymbols.TokenNameEOF
                        || isComment(token)
                        || !Arrays.equals(scanner.getRawTokenSource(), scanner.getCurrentTokenSource())) {
                        return null;
                    }
                    if (token == ITerminalSymbols.TokenNamestatic && canBeStatic) {
                        canBeStatic = false;
                        declaration.append("static ");
                        continue;
                    }
                    canBeStatic = false;
                    if (expectName && token == ITerminalSymbols.TokenNameIdentifier) {
                        expectName = false;
                    } else if (expectName
                        && token == ITerminalSymbols.TokenNameMULTIPLY
                        && declaration.length() > 0
                        && declaration.charAt(declaration.length() - 1) == '.') {
                        expectName = false;
                        wildcard = true;
                    } else if (!expectName && !wildcard && token == ITerminalSymbols.TokenNameDOT) {
                        expectName = true;
                    } else {
                        return null;
                    }
                    declaration.append(scanner.getCurrentTokenSource());
                }
                if (expectName) {
                    return null;
                }
                imports.add(declaration.toString());
                importEnd = scanner.getCurrentTokenEndPosition() + 1;
            } else if (parentheses == 0
                && (token == ITerminalSymbols.TokenNameclass
                    || token == ITerminalSymbols.TokenNameinterface
                    || token == ITerminalSymbols.TokenNameenum
                    || token == ITerminalSymbols.TokenNameLBRACE)) {
                break;
            }
        }
        if (imports.isEmpty()) {
            return file;
        }
        imports.sort(Comparator.comparing((String declaration) -> !declaration.startsWith("static "))
            .thenComparing(declaration -> declaration.endsWith(".*")
                ? declaration.substring(0, declaration.length() - 2)
                : declaration));
        String ordered = imports.stream()
            .distinct()
            .map(declaration -> "import " + declaration + ";")
            .collect(Collectors.joining("\n"));
        return (file.substring(0, importStart) + ordered + file.substring(importEnd)).replace("\r\n", "\n")
            .replace('\r', '\n');
    }

    private static boolean isComment(int token) {
        return token == ITerminalSymbols.TokenNameCOMMENT_LINE
            || token == ITerminalSymbols.TokenNameCOMMENT_BLOCK
            || token == ITerminalSymbols.TokenNameCOMMENT_JAVADOC;
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
            Map<String, String> formatterSettings = new LinkedHashMap<>();
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
     * @param compilationUnit The shared parsed file.
     * @param modified Whether AST edits have invalidated the original import positions.
     * @param orderingStrategy The import ordering strategy to use.
     * @return The Java file with reordered imports, or if the file has no imports the file as-is.
     */
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    private static String reorderImports(String file, CompilationUnit compilationUnit, boolean modified,
        ImportOrderingStrategy orderingStrategy) {
        com.github.javaparser.ast.NodeList<ImportDeclaration> imports = compilationUnit.getImports();
        if (imports.isEmpty()) {
            // File has no imports, nothing to reorder.
            return file;
        }

        if (modified) {
            compilationUnit.setImports(new com.github.javaparser.ast.NodeList<>(
                distinctImports(orderingStrategy.sortImports(imports).get(0))));
            return compilationUnit.toString();
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

    private static String formatCode(String file, boolean isModuleInfo, CodeFormatter codeFormatter) throws Exception {
        IDocument doc = new Document(file);

        int kind = isModuleInfo ? CodeFormatter.K_MODULE_INFO : CodeFormatter.K_COMPILATION_UNIT;
        kind |= CodeFormatter.F_INCLUDE_COMMENTS;
        TextEdit edit = codeFormatter.format(kind, file, 0, file.length(), 0, Constants.NEW_LINE);
        if (edit == null && isModuleInfo) {
            edit = codeFormatter.format(CodeFormatter.K_COMPILATION_UNIT | CodeFormatter.F_INCLUDE_COMMENTS, file, 0,
                file.length(), 0, Constants.NEW_LINE);
        }
        if (edit == null) {
            throw new IllegalStateException("Eclipse could not format the Java source.");
        }
        edit.apply(doc);

        return doc.get();
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
