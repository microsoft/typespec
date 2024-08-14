// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.xmlmodel;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public class XmlFileContents {
    private String singleIndent = "    ";

    private final StringBuilder contents;
    private final StringBuilder linePrefix;

    private CurrentLineType currentLineType = CurrentLineType.values()[0];

    public XmlFileContents() {
        this(null);
    }

    public XmlFileContents(String fileContents) {
        this(fileContents, null);
    }

    public XmlFileContents(String fileContents, XmlFile.Options options) {
        if (options != null) {
            if (options.getIndent() > 0) {
                char[] chars = new char[options.getIndent()];
                Arrays.fill(chars, ' ');
                singleIndent = String.valueOf(chars);
            }
        }

        contents = new StringBuilder();
        linePrefix = new StringBuilder();

        if (fileContents != null && !fileContents.isEmpty()) {
            contents.append(fileContents);
        }
    }

    @Override
    public String toString() {
        return contents.toString();
    }

    public final String[] getLines() {
        return toString().split("\n", -1);
    }

    public final void addToPrefix(String toAdd) {
        linePrefix.append(toAdd);
    }

    private void removeFromPrefix(String toRemove) {
        int toRemoveLength = toRemove.length();
        if (linePrefix.length() <= toRemoveLength) {
            linePrefix.setLength(0);
        } else {
            linePrefix.delete(linePrefix.length() - toRemoveLength, linePrefix.length() - toRemoveLength + toRemoveLength);
        }
    }

    public final void indent(Runnable action) {
        increaseIndent();
        action.run();
        decreaseIndent();
    }

    public final void increaseIndent() {
        addToPrefix(singleIndent);
    }

    public final void decreaseIndent() {
        removeFromPrefix(singleIndent);
    }

    private void text(String text, boolean addPrefix) {
        ArrayList<String> lines = new ArrayList<>();

        if (text == null || text.isEmpty()) {
            lines.add("");
        } else {
            int lineStartIndex = 0;
            int textLength = text.length();
            while (lineStartIndex < textLength) {
                int newLineCharacterIndex = text.indexOf('\n', lineStartIndex);
                if (newLineCharacterIndex == -1) {
                    String line = text.substring(lineStartIndex);
                    lines.add(line);
                    lineStartIndex = textLength;
                } else {
                    int nextLineStartIndex = newLineCharacterIndex + 1;
                    String line = text.substring(lineStartIndex, nextLineStartIndex);
                    lines.add(line);
                    lineStartIndex = nextLineStartIndex;
                }
            }
        }

        String prefix = addPrefix ? linePrefix.toString() : null;
        for (String line : lines) {
            if (addPrefix && prefix != null && !prefix.trim().isEmpty() || (prefix != null && !prefix.isEmpty() && line != null && !line.trim().isEmpty())) {
                contents.append(prefix);
            }

            contents.append(line);
        }
    }

    public final void text(String text) {
        if (currentLineType == CurrentLineType.Empty) {
            text(text, true);
        } else if (currentLineType == CurrentLineType.Text) {
            text(text, false);
        } else if (currentLineType == CurrentLineType.AfterIf) {
            line("", false);
            text(text, true);
        }
        currentLineType = CurrentLineType.Text;
    }

    private void line(String text, boolean addPrefix) {
        text(text + "\n", addPrefix);
        currentLineType = CurrentLineType.Empty;
    }

    public void line(String text) {
        if (currentLineType == CurrentLineType.Empty) {
            line(text, true);
        } else if (currentLineType == CurrentLineType.Text) {
            line(text, false);
        } else if (currentLineType == CurrentLineType.AfterIf) {
            line("", false);
            line(text, true);
        }
        currentLineType = CurrentLineType.Empty;
    }

    public void line(String text, Object... formattedArguments) {
        if (formattedArguments != null && formattedArguments.length > 0) {
            text = String.format(text, formattedArguments);
        }

        line(text);
    }

    public void line() {
        line("");
    }

    public void tag(String tag, String value) {
        line("<" + tag + ">" + value + "</" + tag + ">");
    }

    public void block(String text, Consumer<XmlBlock> bodyAction) {
        line("<" + text + ">");
        indent(() ->
                bodyAction.accept(new XmlBlock(this)));
        line("</" + text + ">");
    }

    public void block(String text, Map<String, String> annotations, Consumer<XmlBlock> bodyAction) {
        if (annotations != null && !annotations.isEmpty()) {
            String append = annotations.entrySet().stream()
                .map(entry -> entry.getKey() + "=\"" + entry.getValue() + "\"")
                .collect(Collectors.joining(" "));
            line("<" + text + " " + append + ">");
        } else {
            line("<" + text + ">");
        }
        indent(() ->
                bodyAction.accept(new XmlBlock(this)));
        line("</" + text + ">");
    }

    public void blockComment(String text) {
        blockComment(comment -> comment.line(text));
    }

    public void blockComment(Consumer<XmlLineComment> commentAction) {
        line("<!--");
        commentAction.accept(new XmlLineComment(this));
        line(" -->");
    }

    private enum CurrentLineType {
        Empty,
        AfterIf,
        Text
    }
}
