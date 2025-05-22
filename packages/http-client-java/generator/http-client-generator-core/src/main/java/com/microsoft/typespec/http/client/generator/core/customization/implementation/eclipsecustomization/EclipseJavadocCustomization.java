// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization.implementation.eclipsecustomization;

import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.customization.JavadocCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.Range;

/**
 * The Javadoc customization for an AutoRest generated classes and methods.
 */
public final class EclipseJavadocCustomization implements JavadocCustomization<EclipseJavadocCustomization> {
    /*
     * This pattern attempts to cleanse a line of a Javadoc.
     *
     * The scenarios handled by this pattern are the following:
     *
     * 1. A single line Javadoc
     * 2. An indented single line Javadoc
     * 3. A part of a Javadoc
     * 4. An indented part of a Javadoc
     * 5. A Javadoc where the closing line contains text
     * 6. An indented Javadoc where the closing line contains text
     */
    private static final Pattern JAVADOC_LINE_CLEANER = Pattern.compile("^\\s*/?\\*{1,2}\\s?(.*?)(?:\\s*\\*/)?$");

    private static final Pattern EMPTY_JAVADOC_LINE_PATTERN = Pattern.compile("\\s*\\*/?\\s*");

    private static final Pattern THROWS_TAG = Pattern.compile(".*@throws ");
    private static final Pattern PARAM_TAG = Pattern.compile(".*@param ");
    private static final Pattern SPACE_THEN_ANYTHING = Pattern.compile(" .*");
    private static final Pattern JAVADOC_LINE_WITH_CONTENT = Pattern.compile("\\* .*$");
    private static final Pattern END_JAVADOC_LINE = Pattern.compile(" \\*/$");
    private static final Pattern JAVADOC_CONTENT = Pattern.compile(" +\\* ");

    private final EclipseLanguageClient languageClient;
    private final Editor editor;
    private final String fileUri;
    private final String fileName;
    private final String indent;

    private String descriptionDocs;
    private final Map<String, String> paramDocs;
    private String returnDoc;
    private final Map<String, String> throwsDocs;
    private final List<String> seeDocs;
    private String sinceDoc;
    private String deprecatedDoc;
    private Range javadocRange;

    EclipseJavadocCustomization(Editor editor, EclipseLanguageClient languageClient, String fileUri, String fileName,
        int symbolLine) {
        this.editor = editor;
        this.languageClient = languageClient;

        this.paramDocs = new LinkedHashMap<>();
        this.throwsDocs = new LinkedHashMap<>();
        this.seeDocs = new ArrayList<>();

        this.fileUri = fileUri;
        this.fileName = fileName;

        this.indent = Utils.getIndent(editor.getFileLine(fileName, symbolLine));
        parseJavadoc(symbolLine);
    }

    @Override
    public Range getJavadocRange() {
        return javadocRange;
    }

    @Override
    public EclipseJavadocCustomization replace(EclipseJavadocCustomization other) {
        this.descriptionDocs = other.descriptionDocs;

        this.paramDocs.clear();
        if (other.paramDocs != null) {
            this.paramDocs.putAll(other.paramDocs);
        }

        this.returnDoc = other.returnDoc;

        this.throwsDocs.clear();
        if (other.throwsDocs != null) {
            this.throwsDocs.putAll(other.throwsDocs);
        }

        this.seeDocs.clear();
        if (other.seeDocs != null) {
            this.seeDocs.addAll(other.seeDocs);
        }

        this.sinceDoc = other.sinceDoc;
        this.deprecatedDoc = other.deprecatedDoc;
        commit();
        return this;
    }

    @Override
    public String getDescription() {
        return descriptionDocs;
    }

    @Override
    public EclipseJavadocCustomization setDescription(String description) {
        return performChange(this.descriptionDocs, description, () -> this.descriptionDocs = description);
    }

    @Override
    public Map<String, String> getParams() {
        return Collections.unmodifiableMap(paramDocs);
    }

    @Override
    public EclipseJavadocCustomization setParam(String parameterName, String description) {
        return performChange(paramDocs.get(parameterName), description,
            () -> paramDocs.put(parameterName, description));
    }

    @Override
    public EclipseJavadocCustomization removeParam(String parameterName) {
        paramDocs.remove(parameterName);
        commit();
        return this;
    }

    @Override
    public String getReturn() {
        return returnDoc;
    }

    @Override
    public EclipseJavadocCustomization setReturn(String description) {
        return performChange(returnDoc, description, () -> this.returnDoc = description);
    }

    @Override
    public EclipseJavadocCustomization removeReturn() {
        return performChange(returnDoc, null, () -> this.returnDoc = null);
    }

    @Override
    public Map<String, String> getThrows() {
        return Collections.unmodifiableMap(throwsDocs);
    }

    @Override
    public EclipseJavadocCustomization addThrows(String exceptionType, String description) {
        return performChange(throwsDocs.get(exceptionType), description,
            () -> throwsDocs.put(exceptionType, description));
    }

    @Override
    public EclipseJavadocCustomization removeThrows(String exceptionType) {
        throwsDocs.remove(exceptionType);
        commit();
        return this;
    }

    @Override
    public List<String> getSees() {
        return Collections.unmodifiableList(seeDocs);
    }

    @Override
    public EclipseJavadocCustomization addSee(String seeDoc) {
        seeDocs.add(seeDoc);
        commit();
        return this;
    }

    @Override
    public String getSince() {
        return sinceDoc;
    }

    @Override
    public EclipseJavadocCustomization setSince(String sinceDoc) {
        return performChange(this.sinceDoc, sinceDoc, () -> this.sinceDoc = sinceDoc);
    }

    @Override
    public EclipseJavadocCustomization removeSince() {
        return performChange(this.sinceDoc, null, () -> this.sinceDoc = null);
    }

    @Override
    public String getDeprecated() {
        return deprecatedDoc;
    }

    @Override
    public EclipseJavadocCustomization setDeprecated(String deprecatedDoc) {
        return performChange(this.deprecatedDoc, deprecatedDoc, () -> this.deprecatedDoc = deprecatedDoc);
    }

    @Override
    public EclipseJavadocCustomization removeDeprecated() {
        return performChange(this.deprecatedDoc, null, () -> this.deprecatedDoc = null);
    }

    private void initialize(int symbolLine) {
        editor.insertBlankLine(fileName, symbolLine++, false);
        editor.replace(fileName, new Position(symbolLine, 0), new Position(symbolLine, 0), indent);
        Position javadocCursor = new Position(symbolLine, indent.length());
        javadocRange = new Range(javadocCursor, javadocCursor);
        ++symbolLine;
        EclipseUtils.sendFilesChangeNotification(languageClient, fileUri);
    }

    private void parseJavadoc(int symbolLine) {
        String lineContent = editor.getFileLine(fileName, --symbolLine);
        while (lineContent.startsWith(indent + "@")) {
            lineContent = editor.getFileLine(fileName, --symbolLine);
        }
        if (lineContent.endsWith("*/")) {
            Position javadocEnd = new Position(symbolLine, lineContent.length());
            int currentDocEndLine = symbolLine;
            while (!lineContent.contains("/*")) {
                if (lineContent.contains("@throws")) {
                    String type = THROWS_TAG.matcher(lineContent).replaceFirst("");
                    type = SPACE_THEN_ANYTHING.matcher(type).replaceFirst("");
                    Position docStart = new Position(symbolLine, lineContent.indexOf("@throws") + 8);
                    Position docEnd
                        = new Position(currentDocEndLine, editor.getFileLine(fileName, currentDocEndLine).length());
                    throwsDocs.put(type, readJavadocTextRange(editor, fileName, docStart, docEnd));
                    currentDocEndLine = symbolLine - 1;
                } else if (lineContent.contains("@return")) {
                    Position docStart = new Position(symbolLine, lineContent.indexOf("@return") + 8);
                    Position docEnd
                        = new Position(currentDocEndLine, editor.getFileLine(fileName, currentDocEndLine).length());
                    returnDoc = readJavadocTextRange(editor, fileName, docStart, docEnd);
                    currentDocEndLine = symbolLine - 1;
                } else if (lineContent.contains("@since")) {
                    Position docStart = new Position(symbolLine, lineContent.indexOf("@since") + 7);
                    Position docEnd
                        = new Position(currentDocEndLine, editor.getFileLine(fileName, currentDocEndLine).length());
                    sinceDoc = readJavadocTextRange(editor, fileName, docStart, docEnd);
                    currentDocEndLine = symbolLine - 1;
                } else if (lineContent.contains("@see")) {
                    Position docStart = new Position(symbolLine, lineContent.indexOf("@see") + 5);
                    Position docEnd
                        = new Position(currentDocEndLine, editor.getFileLine(fileName, currentDocEndLine).length());
                    seeDocs.add(readJavadocTextRange(editor, fileName, docStart, docEnd));
                    currentDocEndLine = symbolLine - 1;
                } else if (lineContent.contains("@deprecated")) {
                    Position docStart = new Position(symbolLine, lineContent.indexOf("@deprecated") + 5);
                    Position docEnd
                        = new Position(currentDocEndLine, editor.getFileLine(fileName, currentDocEndLine).length());
                    deprecatedDoc = readJavadocTextRange(editor, fileName, docStart, docEnd);
                    currentDocEndLine = symbolLine - 1;
                } else if (lineContent.contains("@param")) {
                    String name = PARAM_TAG.matcher(lineContent).replaceFirst("");
                    name = SPACE_THEN_ANYTHING.matcher(name).replaceFirst("");
                    Position docStart = new Position(symbolLine, lineContent.indexOf("@param") + 8 + name.length());
                    Position docEnd
                        = new Position(currentDocEndLine, editor.getFileLine(fileName, currentDocEndLine).length());
                    paramDocs.put(name, readJavadocTextRange(editor, fileName, docStart, docEnd));
                    currentDocEndLine = symbolLine - 1;
                } else if (EMPTY_JAVADOC_LINE_PATTERN.matcher(lineContent).matches()) {
                    // empty line
                    currentDocEndLine--;
                }
                lineContent = editor.getFileLine(fileName, --symbolLine);
            }
            Position javadocStart = new Position(symbolLine, indent.length());
            javadocRange = new Range(javadocStart, javadocEnd);
            if (lineContent.endsWith("/*") || lineContent.endsWith("/**")) {
                symbolLine++;
            }
            Position descriptionStart = new Position(symbolLine,
                JAVADOC_LINE_WITH_CONTENT.matcher(editor.getFileLine(fileName, symbolLine)).replaceFirst("").length()
                    + 2);
            String descriptionEndLineContent = editor.getFileLine(fileName, currentDocEndLine);
            while (descriptionEndLineContent.trim().endsWith("*")) {
                descriptionEndLineContent = editor.getFileLine(fileName, --currentDocEndLine);
            }
            Position descriptionEnd = new Position(currentDocEndLine,
                END_JAVADOC_LINE.matcher(descriptionEndLineContent).replaceFirst("").length());
            this.descriptionDocs = JAVADOC_CONTENT
                .matcher(editor.getTextInRange(fileName, new Range(descriptionStart, descriptionEnd), " "))
                .replaceAll(" ")
                .trim();
        } else {
            initialize(symbolLine);
        }
    }

    private static String readJavadocTextRange(Editor editor, String fileName, Position docStart, Position docEnd) {
        return editor.getTextInRange(fileName, new Range(docStart, docEnd), " ", line -> {
            Matcher lineCleaningMatch = JAVADOC_LINE_CLEANER.matcher(line);
            return (lineCleaningMatch.find()) ? lineCleaningMatch.group(1) : line;
        }).trim();
    }

    private void commit() {
        // Given this method is self-contained use StringBuilder as it doesn't have synchronization.
        // Additional start with a sizeable 4kb buffer to reduce chances of resizing while keeping it small.
        StringBuilder stringBuilder = new StringBuilder(4096);

        Utils.writeLine(stringBuilder, "/**");
        if (descriptionDocs != null) {
            Utils.writeLine(stringBuilder.append(indent).append(" * "), descriptionDocs);
        }

        if (!paramDocs.isEmpty() || !throwsDocs.isEmpty() || returnDoc != null || deprecatedDoc != null) {
            Utils.writeLine(stringBuilder.append(indent), " * ");

            for (Map.Entry<String, String> paramDoc : paramDocs.entrySet()) {
                Utils.writeLine(stringBuilder.append(indent).append(" * @param ").append(paramDoc.getKey()).append(" "),
                    paramDoc.getValue());
            }

            if (returnDoc != null) {
                Utils.writeLine(stringBuilder.append(indent).append(" * @return "), returnDoc);
            }

            for (Map.Entry<String, String> throwsDoc : throwsDocs.entrySet()) {
                Utils.writeLine(
                    stringBuilder.append(indent).append(" * @throws ").append(throwsDoc.getKey()).append(" "),
                    throwsDoc.getValue());
            }

            for (String seeDoc : seeDocs) {
                Utils.writeLine(stringBuilder.append(indent).append(" * @see "), seeDoc);
            }

            if (sinceDoc != null) {
                Utils.writeLine(stringBuilder.append(indent).append(" * @since "), sinceDoc);
            }

            if (deprecatedDoc != null) {
                Utils.writeLine(stringBuilder.append(indent).append(" * @deprecated "), deprecatedDoc);
            }

        }

        stringBuilder.append(indent).append(" */");

        editor.replace(fileName, javadocRange.getStart(), javadocRange.getEnd(), stringBuilder.toString());
        EclipseUtils.sendFilesChangeNotification(languageClient, fileUri);

        int javadocStartLine = javadocRange.getStart().getLine();
        String lineContent = editor.getFileLine(fileName, javadocStartLine);
        while (!lineContent.endsWith("*/")) {
            lineContent = editor.getFileLine(fileName, ++javadocStartLine);
        }
        parseJavadoc(javadocStartLine + 1);
    }

    private EclipseJavadocCustomization performChange(String oldValue, String newValue, Runnable changePerformer) {
        if (!Objects.equals(oldValue, newValue)) {
            changePerformer.run();
            commit();
        }

        return this;
    }
}
