// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor.implementation;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.Position;
import com.github.javaparser.Problem;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.TokenRange;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.PackageDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.comments.Comment;
import com.github.javaparser.ast.comments.JavadocComment;
import com.github.javaparser.ast.expr.MarkerAnnotationExpr;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.Name;
import com.github.javaparser.ast.expr.NameExpr;
import com.github.javaparser.ast.expr.NormalAnnotationExpr;
import com.github.javaparser.ast.expr.SingleMemberAnnotationExpr;
import com.github.javaparser.ast.expr.SuperExpr;
import com.github.javaparser.ast.expr.ThisExpr;
import com.github.javaparser.ast.modules.ModuleDeclaration;
import com.github.javaparser.ast.modules.ModuleProvidesDirective;
import com.github.javaparser.ast.modules.ModuleUsesDirective;
import com.github.javaparser.ast.nodeTypes.NodeWithJavadoc;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import com.github.javaparser.ast.type.Type;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import com.github.javaparser.javadoc.Javadoc;
import com.github.javaparser.javadoc.JavadocBlockTag;
import com.github.javaparser.javadoc.description.JavadocDescription;
import com.github.javaparser.printer.configuration.ImportOrderingStrategy;
import com.github.javaparser.printer.configuration.imports.DefaultImportOrderingStrategy;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.util.Constants;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.eclipse.jdt.core.ToolFactory;
import org.eclipse.jdt.core.formatter.CodeFormatter;
import org.eclipse.jface.text.Document;
import org.eclipse.jface.text.IDocument;
import org.eclipse.text.edits.TextEdit;
import org.slf4j.Logger;

/**
 * Utility class that handles code formatting.
 */
public final class CodeFormatterUtil {
    private static final ImportUsageVisitor IMPORT_USAGE_VISITOR = new ImportUsageVisitor();

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
        if (files.isEmpty()) {
            return Stream.empty();
        }

        // Reuse the stateful parser and formatter only within this sequential batch, never across concurrent
        // calls or parallel stream elements. Each call owns these instances and uses the caller's parser settings.
        CodeFormatter codeFormatter = ToolFactory.createCodeFormatter(loadEclipseSettings());
        // Keep token/range storage and comment handling: import reordering relies on source positions, so disabling
        // tokens to reduce parser allocations would change behavior even though we do not print the AST.
        JavaParser javaParser = new JavaParser(StaticJavaParser.getParserConfiguration());
        DefaultImportOrderingStrategy orderingStrategy = new DefaultImportOrderingStrategy();
        orderingStrategy.setSortImportsAlphabetically(true);

        // Prepare the whole batch before writing files, without retaining every compilation unit in memory.
        return prepareFiles(files, javaParser, orderingStrategy, logger).stream().map(file -> {
            try {
                return Map.entry(file.name, formatCode(file.content, file.moduleInfo, codeFormatter));
            } catch (Exception e) {
                throw formattingFailure(file.name, file.content, e, logger);
            }
        });
    }

    private static List<PreparedJavaFile> prepareFiles(Map<String, String> files, JavaParser parser,
        ImportOrderingStrategy orderingStrategy, Logger logger) {
        List<PreparedJavaFile> prepared = new ArrayList<>(files.size());
        StringBuilder errors = new StringBuilder();
        for (Map.Entry<String, String> file : files.entrySet()) {
            ParseResult<CompilationUnit> parsed = parser.parse(file.getValue());
            if (!parsed.isSuccessful()) {
                for (Problem problem : parsed.getProblems()) {
                    appendDiagnosticError(errors, problem, file.getKey(), file.getValue(), logger);
                }
                if (parsed.getProblems().isEmpty()) {
                    throw new IllegalStateException("JavaParser produced no compilation unit for " + file.getKey());
                }
                continue;
            }

            try {
                CompilationUnit compilationUnit = parsed.getResult().orElseThrow();
                Set<String> usedNames = new HashSet<>();
                compilationUnit.accept(IMPORT_USAGE_VISITOR, usedNames);
                parsed.getCommentsCollection().ifPresent(comments -> {
                    for (Comment comment : comments.getComments()) {
                        // Without attribution information, retain Javadoc-only imports conservatively.
                        if (comment instanceof JavadocComment
                            && (comment.getCommentedNode().isPresent()
                                || !parser.getParserConfiguration().isAttributeComments()
                                || precedesDocumentedDeclaration(comment, compilationUnit, file.getValue(),
                                    parser.getParserConfiguration().getTabSize()))) {
                            collectJavadocReferences(((JavadocComment) comment).parse(), parser, usedNames);
                        }
                    }
                });
                String content = reorderImports(file.getValue(), compilationUnit, usedNames, orderingStrategy,
                    parser.getParserConfiguration().getTabSize());
                boolean moduleInfo
                    = file.getKey().endsWith("module-info.java") && compilationUnit.getModule().isPresent();
                prepared.add(new PreparedJavaFile(file.getKey(), content, moduleInfo));
            } catch (Exception e) {
                throw formattingFailure(file.getKey(), file.getValue(), e, logger);
            }
        }

        if (errors.length() > 0) {
            throw new IllegalStateException("JavaParser encountered errors:\n" + errors);
        }
        return prepared;
    }

    private static boolean precedesDocumentedDeclaration(Comment comment, CompilationUnit compilationUnit,
        String source, int tabSize) {
        List<Integer> starts = lineStarts(source);
        int commentEnd = sourceOffset(source, starts, comment.getEnd().orElseThrow(), tabSize) + 1;
        int next = commentEnd;
        while (next < source.length() && Character.isWhitespace(source.charAt(next))) {
            next++;
        }
        for (Node node : compilationUnit.findAll(Node.class,
            candidate -> candidate instanceof NodeWithJavadoc
                || candidate instanceof PackageDeclaration
                || candidate instanceof ModuleDeclaration)) {
            if (node.getBegin().isPresent()) {
                int begin = sourceOffset(source, starts, node.getBegin().get(), tabSize);
                if (begin == next) {
                    return true;
                }
            }
        }
        return false;
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

            org.w3c.dom.NodeList formatterSettingXml = document.getElementsByTagName("setting");
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
     * Removes unused imports and reorders the remaining imports.
     * <p>
     * This helper method performs many tasks manually to maintain the original formatting of the file as much as
     * possible. Using {@link CompilationUnit} to manipulate the imports and then printing the entire file back
     * results in newline removal and trailing space removal which is just noise for us.
     *
     * @param file The Java file to reorder imports for.
     * @param compilationUnit The parsed Java file.
     * @param usedNames The unqualified names referenced by code or Javadoc.
     * @param orderingStrategy The import ordering strategy to use.
     * @param tabSize The parser's tab width used by source positions.
     * @return The Java file with unused imports removed and the remaining imports reordered.
     */
    private static String reorderImports(String file, CompilationUnit compilationUnit, Set<String> usedNames,
        ImportOrderingStrategy orderingStrategy, int tabSize) {
        NodeList<ImportDeclaration> imports = compilationUnit.getImports();
        if (imports.isEmpty()) {
            return file;
        }

        String packageName = compilationUnit.getPackageDeclaration().map(p -> p.getNameAsString()).orElse("");
        boolean[] retained = new boolean[imports.size()];
        Set<String> distinct = new HashSet<>();
        NodeList<ImportDeclaration> sorted = new NodeList<>();
        for (int i = 0; i < imports.size(); i++) {
            ImportDeclaration declaration = imports.get(i);
            String name = declaration.getNameAsString();
            int separator = name.lastIndexOf('.');
            String qualifier = declaration.isAsterisk() ? name : name.substring(0, Math.max(0, separator));
            String simpleName = name.substring(separator + 1);
            boolean implicit = qualifier.equals("java.lang") || qualifier.equals(packageName);
            if (!implicit
                && (declaration.isAsterisk() || usedNames.contains(simpleName))
                && distinct.add(importToString(declaration))) {
                retained[i] = true;
                sorted.add(declaration);
            }
        }

        if (!sorted.isEmpty()) {
            sorted = orderingStrategy.sortImports(sorted).get(0);
        }
        List<Integer> lineStarts = lineStarts(file);
        StringBuilder updated = new StringBuilder(file);
        int nextImport = sorted.size() - 1;
        // Edit individual import ranges backwards so comments and declarations sharing a line remain intact.
        for (int i = imports.size() - 1; i >= 0; i--) {
            ImportDeclaration declaration = imports.get(i);
            int start = sourceOffset(file, lineStarts, declaration.getBegin().orElseThrow(), tabSize);
            int end = sourceOffset(file, lineStarts, declaration.getEnd().orElseThrow(), tabSize) + 1;
            if (i + 1 < imports.size()) {
                int nextStart = sourceOffset(file, lineStarts, imports.get(i + 1).getBegin().orElseThrow(), tabSize);
                String gap = file.substring(end, nextStart);
                if (gap.trim().isEmpty()) {
                    int newline = 0;
                    while (newline < gap.length() && gap.charAt(newline) != '\r' && gap.charAt(newline) != '\n') {
                        newline++;
                    }
                    if (newline < gap.length()) {
                        int afterNewline = end + newline + 1;
                        if (gap.charAt(newline) == '\r'
                            && newline + 1 < gap.length()
                            && gap.charAt(newline + 1) == '\n') {
                            afterNewline++;
                        }
                        updated.delete(afterNewline, nextStart);
                    }
                }
            }
            if (retained[i]) {
                updated.replace(start, end, importToString(sorted.get(nextImport--)));
            } else {
                updated.delete(start, unusedImportEnd(file, end));
            }
        }
        return updated.toString();
    }

    private static List<Integer> lineStarts(String source) {
        List<Integer> starts = new ArrayList<>();
        starts.add(0);
        for (int i = 0; i < source.length(); i++) {
            char character = source.charAt(i);
            if (character == '\r' || character == '\n') {
                if (character == '\r' && i + 1 < source.length() && source.charAt(i + 1) == '\n') {
                    i++;
                }
                starts.add(i + 1);
            }
        }
        return starts;
    }

    private static int sourceOffset(String source, List<Integer> lineStarts, Position position, int tabSize) {
        int offset = lineStarts.get(position.line - 1);
        int column = 1;
        while (column < position.column) {
            char character = source.charAt(offset++);
            column += character == '\t' ? tabSize - (column - 1) % tabSize : 1;
        }
        if (column != position.column) {
            throw new IllegalStateException("Source position does not identify a character: " + position);
        }
        return offset;
    }

    private static int unusedImportEnd(String source, int end) {
        int next = end;
        while (next < source.length() && (source.charAt(next) == ' ' || source.charAt(next) == '\t')) {
            next++;
        }
        if (next == source.length()) {
            return end;
        }
        int separator = source.charAt(next) == '\n' ? 1 : source.charAt(next) == '\r' ? 1 : 0;
        if (source.charAt(next) == '\r' && next + 1 < source.length() && source.charAt(next + 1) == '\n') {
            separator = 2;
        }
        return separator > 0 && next + separator < source.length() ? next + separator : next;
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
        edit.apply(doc);

        return doc.get();
    }

    private static void collectJavadocReferences(Javadoc javadoc, JavaParser parser, Set<String> usedNames) {
        collectInlineReferences(javadoc.getDescription(), parser, usedNames);
        for (JavadocBlockTag tag : javadoc.getBlockTags()) {
            if (tag.getType() == JavadocBlockTag.Type.THROWS || tag.getType() == JavadocBlockTag.Type.EXCEPTION) {
                tag.getName().ifPresent(name -> collectReference(name, parser, usedNames));
            } else if (tag.getType() == JavadocBlockTag.Type.SEE
                || tag.getTagName().equals("uses")
                || tag.getTagName().equals("provides")) {
                collectReference(tag.getContent().toText(), parser, usedNames);
            } else if (tag.getType() == JavadocBlockTag.Type.SERIAL_FIELD) {
                String content = tag.getContent().toText().trim();
                int nameEnd = 0;
                while (nameEnd < content.length() && !Character.isWhitespace(content.charAt(nameEnd))) {
                    nameEnd++;
                }
                collectReference(content.substring(nameEnd), parser, usedNames);
            }
            collectInlineReferences(tag.getContent(), parser, usedNames);
        }
    }

    private static void collectInlineReferences(JavadocDescription description, JavaParser parser,
        Set<String> usedNames) {
        // JavaParser splits nested inline tags at the first closing brace.
        collectInlineReferences(description.toText(), parser, usedNames);
    }

    private static void collectInlineReferences(String text, JavaParser parser, Set<String> usedNames) {
        int start = 0;
        while ((start = text.indexOf("{@", start)) >= 0) {
            int depth = 1;
            int end = start + 2;
            while (end < text.length() && depth > 0) {
                char character = text.charAt(end++);
                if (character == '{') {
                    depth++;
                } else if (character == '}') {
                    depth--;
                }
            }
            if (depth != 0) {
                return;
            }
            int nameEnd = start + 2;
            while (nameEnd < end - 1 && !Character.isWhitespace(text.charAt(nameEnd))) {
                nameEnd++;
            }
            String name = text.substring(start + 2, nameEnd);
            String content = text.substring(nameEnd, end - 1);
            if (name.equals("link") || name.equals("linkplain") || name.equals("value")) {
                collectReference(content, parser, usedNames);
            }
            if (!name.equals("code") && !name.equals("literal") && !name.equals("snippet")) {
                collectInlineReferences(content, parser, usedNames);
            }
            start = end;
        }
    }

    private static void collectReference(String content, JavaParser parser, Set<String> usedNames) {
        String text = content.trim();
        if (text.isEmpty() || text.startsWith("\"") || text.startsWith("<")) {
            return;
        }
        int parentheses = 0;
        int generics = 0;
        int end = 0;
        for (; end < text.length(); end++) {
            char character = text.charAt(end);
            if (Character.isWhitespace(character) && parentheses == 0 && generics == 0) {
                break;
            }
            if (character == '(') {
                parentheses++;
            } else if (character == ')') {
                parentheses--;
            } else if (character == '<') {
                generics++;
            } else if (character == '>') {
                generics--;
            }
        }
        String reference = text.substring(0, end);
        int member = reference.indexOf('#');
        int parameters = reference.indexOf('(');
        String qualifier = member >= 0
            ? reference.substring(0, member)
            : parameters >= 0 ? reference.substring(0, parameters) : reference;
        int module = qualifier.indexOf('/');
        if (module >= 0) {
            qualifier = qualifier.substring(module + 1);
        }
        Set<String> referencedNames = new HashSet<>();
        if (!qualifier.isEmpty()) {
            ParseResult<Type> type = parser.parseType(qualifier);
            // Javadoc can contain non-Java references; these are comments, not source syntax errors.
            if (!type.isSuccessful()) {
                return;
            }
            type.getResult().orElseThrow().accept(IMPORT_USAGE_VISITOR, referencedNames);
        }
        if (parameters >= 0) {
            if (!reference.endsWith(")")) {
                return;
            }
            String arguments = reference.substring(parameters + 1, reference.length() - 1);
            for (String argument : referenceParameters(arguments)) {
                ParseResult<Parameter> parameter = parser.parseParameter(argument);
                if (!parameter.isSuccessful() || parameter.getResult().orElseThrow().getType().isUnknownType()) {
                    parameter = parser.parseParameter(argument + " __javadocParameter");
                }
                if (!parameter.isSuccessful()) {
                    return;
                }
                parameter.getResult().orElseThrow().accept(IMPORT_USAGE_VISITOR, referencedNames);
            }
        }
        usedNames.addAll(referencedNames);
    }

    private static List<String> referenceParameters(String parameters) {
        List<String> result = new ArrayList<>();
        if (parameters.trim().isEmpty()) {
            return result;
        }
        int nesting = 0;
        int start = 0;
        for (int i = 0; i < parameters.length(); i++) {
            char character = parameters.charAt(i);
            if (character == '<' || character == '(') {
                nesting++;
            } else if (character == '>' || character == ')') {
                nesting--;
            } else if (character == ',' && nesting == 0) {
                result.add(parameters.substring(start, i).trim());
                start = i + 1;
            }
        }
        result.add(parameters.substring(start).trim());
        return result;
    }

    private static void appendDiagnosticError(StringBuilder errorCapture, Problem diagnostic, String fileName,
        String content, Logger logger) {
        StringBuilder diagnosticMessageBuilder = new StringBuilder();
        diagnosticMessageBuilder.append("Error in file '")
            .append(fileName)
            .append("', ")
            .append(diagnostic.getVerboseMessage())
            .append(":\n");
        diagnostic.getLocation().flatMap(TokenRange::toRange).ifPresent(range -> {
            String[] lines = content.split("\r\n|\r|\n", -1);
            int start = Math.max(0, range.begin.line - 3);
            int end = Math.min(lines.length - 1, range.begin.line + 2);
            for (int i = start; i <= end; i++) {
                String prefix = (i + 1) + ": ";
                diagnosticMessageBuilder.append(prefix).append(lines[i]).append("\n");
                if (i == range.begin.line - 1) {
                    diagnosticMessageBuilder.append(" ".repeat(range.begin.column + prefix.length() - 1)).append("^\n");
                }
            }
        });

        String diagnosticMessage = diagnosticMessageBuilder.toString();
        if (logger != null) {
            logger.error(diagnosticMessage);
        }
        errorCapture.append(diagnosticMessage);
    }

    private static RuntimeException formattingFailure(String name, String content, Exception cause, Logger logger) {
        String message = "Failed to format file: " + name + ". File content: \n" + content;
        if (logger != null) {
            logger.error(message);
        }
        return new RuntimeException(message, cause);
    }

    private static final class PreparedJavaFile {
        private final String name;
        private final String content;
        private final boolean moduleInfo;

        private PreparedJavaFile(String name, String content, boolean moduleInfo) {
            this.name = name;
            this.content = content;
            this.moduleInfo = moduleInfo;
        }
    }

    private static final class ImportUsageVisitor extends VoidVisitorAdapter<Set<String>> {
        @Override
        public void visit(ImportDeclaration declaration, Set<String> usedNames) {
            // Imports themselves do not establish usage.
        }

        @Override
        public void visit(NameExpr expression, Set<String> usedNames) {
            usedNames.add(expression.getNameAsString());
            super.visit(expression, usedNames);
        }

        @Override
        public void visit(ClassOrInterfaceType type, Set<String> usedNames) {
            if (type.getScope().isEmpty()) {
                usedNames.add(type.getNameAsString());
            }
            super.visit(type, usedNames);
        }

        @Override
        public void visit(MethodCallExpr expression, Set<String> usedNames) {
            if (expression.getScope().isEmpty()) {
                usedNames.add(expression.getNameAsString());
            }
            super.visit(expression, usedNames);
        }

        @Override
        public void visit(MarkerAnnotationExpr annotation, Set<String> usedNames) {
            addName(annotation.getName(), usedNames);
            super.visit(annotation, usedNames);
        }

        @Override
        public void visit(NormalAnnotationExpr annotation, Set<String> usedNames) {
            addName(annotation.getName(), usedNames);
            super.visit(annotation, usedNames);
        }

        @Override
        public void visit(SingleMemberAnnotationExpr annotation, Set<String> usedNames) {
            addName(annotation.getName(), usedNames);
            super.visit(annotation, usedNames);
        }

        @Override
        public void visit(ThisExpr expression, Set<String> usedNames) {
            expression.getTypeName().ifPresent(name -> addName(name, usedNames));
            super.visit(expression, usedNames);
        }

        @Override
        public void visit(SuperExpr expression, Set<String> usedNames) {
            expression.getTypeName().ifPresent(name -> addName(name, usedNames));
            super.visit(expression, usedNames);
        }

        @Override
        public void visit(ModuleUsesDirective directive, Set<String> usedNames) {
            addName(directive.getName(), usedNames);
            super.visit(directive, usedNames);
        }

        @Override
        public void visit(ModuleProvidesDirective directive, Set<String> usedNames) {
            addName(directive.getName(), usedNames);
            directive.getWith().forEach(name -> addName(name, usedNames));
            super.visit(directive, usedNames);
        }

        private static void addName(Name name, Set<String> usedNames) {
            while (name.getQualifier().isPresent()) {
                name = name.getQualifier().get();
            }
            usedNames.add(name.getIdentifier());
        }
    }
}
