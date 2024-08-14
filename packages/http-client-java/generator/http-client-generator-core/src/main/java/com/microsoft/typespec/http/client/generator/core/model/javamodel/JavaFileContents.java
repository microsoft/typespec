// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public class JavaFileContents {
    private static final String SINGLE_INDENT = "    ";

    private final List<String> contents;

    private String currentLine;
    private String linePrefix;

    private CurrentLineType currentLineType = CurrentLineType.Empty;

    public JavaFileContents() {
        this.currentLine = "";
        this.linePrefix = "";
        this.contents = new ArrayList<>();
    }

    private static String toString(List<JavaModifier> modifiers) {
        return modifiers == null ? "" : modifiers.stream().map(JavaModifier::toString).collect(Collectors.joining(" "));
    }

    @Override
    public String toString() {
        return String.join("\n", contents) + currentLine;
    }

    public boolean contains(String str) {
        return contents.stream().anyMatch(line -> line.contains(str));
    }

    public final void addToPrefix(String toAdd) {
        linePrefix += toAdd;
    }

    private void removeFromPrefix(String toRemove) {
        int toRemoveLength = toRemove.length();
        if (linePrefix.length() <= toRemoveLength) {
            linePrefix = "";
        } else {
            linePrefix = linePrefix.substring(0, linePrefix.length() - toRemoveLength);
        }
    }

    public final void indent(Runnable action) {
        increaseIndent();
        action.run();
        decreaseIndent();
    }

    public final void increaseIndent() {
        addToPrefix(SINGLE_INDENT);
    }

    public final void decreaseIndent() {
        removeFromPrefix(SINGLE_INDENT);
    }

    private void text(String text, boolean addPrefix, boolean completeLastLine) {
        String prefix = addPrefix ? linePrefix : null;

        if (text == null || text.isEmpty()) {
            handleLine("", prefix, true, completeLastLine);
        } else {
            int lineStartIndex = 0;
            int textLength = text.length();
            while (lineStartIndex < textLength) {
                int newLineCharacterIndex = text.indexOf('\n', lineStartIndex);
                if (newLineCharacterIndex == -1) {
                    handleLine(text.substring(lineStartIndex), prefix, true, completeLastLine);
                    break;
                } else {
                    handleLine(text.substring(lineStartIndex, newLineCharacterIndex), prefix, false, completeLastLine);
                    lineStartIndex = newLineCharacterIndex + 1;
                }
            }
        }
    }

    private void handleLine(String line, String prefix, boolean lastLine, boolean completeLastLine) {
        if (prefix != null
            && (!prefix.trim().isEmpty() || (!prefix.isEmpty() && line != null && !line.trim().isEmpty()))) {
            currentLine += prefix;
        }

        currentLine += line;
        if (!lastLine || completeLastLine) {
            contents.add(currentLine);
            currentLine = "";
        }
    }

    public final void text(String text) {
        if (currentLineType == CurrentLineType.Empty) {
            text(text, true, false);
        } else if (currentLineType == CurrentLineType.Text) {
            text(text, false, false);
        } else if (currentLineType == CurrentLineType.AfterIf) {
            line("", false);
            text(text, true, false);
        }
        currentLineType = CurrentLineType.Text;
    }

    private void line(String text, boolean addPrefix) {
        text(text, addPrefix, true);
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

    public void declarePackage(String pkg) {
        line("package " + pkg + ";");
    }

    public void block(String text, Consumer<JavaBlock> bodyAction) {
        line(text + " {");
        indent(() -> bodyAction.accept(new JavaBlock(this)));
        line("}");
    }

    public void declareImport(String... imports) {
        declareImport(Arrays.asList(imports));
    }

    public void declareImport(List<String> imports) {
        if (imports != null && !imports.isEmpty()) {
            Set<String> importSet = new TreeSet<>(new JavaImportComparer());
            importSet.addAll(imports);
            for (String toImport : importSet) {
                if (toImport != null && !toImport.isEmpty()) {
                    line("import " + toImport + ";");
                }
            }
            line();
        }
    }

    public void lineComment(String text) {
        lineComment(comment -> comment.line(text));
    }

    public void lineComment(Consumer<JavaLineComment> commentAction) {
        addToPrefix("// ");
        commentAction.accept(new JavaLineComment(this));
        removeFromPrefix("// ");
    }

    public void blockComment(String text) {
        blockComment(comment -> comment.line(text));
    }

    public void blockComment(Consumer<JavaLineComment> commentAction) {
        line("/*");
        addToPrefix(" * ");
        commentAction.accept(new JavaLineComment(this));
        removeFromPrefix(" * ");
        line(" */");
    }

    public void javadocComment(String text) {
        javadocComment(comment -> comment.description(text));
    }

    public void javadocComment(Consumer<JavaJavadocComment> commentAction) {
        line("/**");
        addToPrefix(" * ");
        commentAction.accept(new JavaJavadocComment(this));
        removeFromPrefix(" * ");
        line(" */");
    }

    public void methodReturn(String text) {
        line("return " + text + ";");
    }

    public void returnAnonymousClass(String anonymousClassDeclaration, Consumer<JavaClass> anonymousClassBlock) {
        line("return " + anonymousClassDeclaration + " {");
        indent(() -> {
            JavaClass javaClass = new JavaClass(this);
            anonymousClassBlock.accept(javaClass);
        });
        line("};");
    }

    public void anonymousClass(String anonymousClassDeclaration, String instanceName, Consumer<JavaClass> anonymousClassBlock) {
        line(anonymousClassDeclaration + " " + instanceName + " = new " + anonymousClassDeclaration + "() {");
        indent(() -> {
            JavaClass javaClass = new JavaClass(this);
            anonymousClassBlock.accept(javaClass);
        });
        line("};");
    }

    public void annotation(String... annotations) {
        annotation(Arrays.asList(annotations));
    }

    public void annotation(List<String> annotations) {
        if (annotations != null && !annotations.isEmpty()) {
            for (String annotation : annotations) {
                if (annotation != null && !annotation.isEmpty()) {
                    line("@" + annotation);
                }
            }
        }
    }

    public void classBlock(JavaVisibility visibility, List<JavaModifier> modifiers, String classDeclaration,
        Consumer<JavaClass> classAction) {
        String text = CoreUtils.isNullOrEmpty(modifiers)
            ? visibility + " class " + classDeclaration
            : visibility + " " + toString(modifiers) + " class " + classDeclaration;
        block(text, blockAction -> {
            if (classAction != null) {
                JavaClass javaClass = new JavaClass(this);
                classAction.accept(javaClass);
            }
        });
    }

    public void method(JavaVisibility visibility, List<JavaModifier> modifiers, String methodSignature,
        Consumer<JavaBlock> method) {
        String text = CoreUtils.isNullOrEmpty(modifiers)
            ? visibility + " " + methodSignature
            : visibility + " " + toString(modifiers) + " " + methodSignature;

        block(text, method);
    }

    public void constructor(JavaVisibility visibility, String constructorSignature, Consumer<JavaBlock> constructor) {
        block(visibility + " " + constructorSignature, constructor);
    }

    public void enumBlock(JavaVisibility visibility, String enumName, Consumer<JavaEnum> enumAction) {
        block(visibility + " enum " + enumName, block -> {
            if (enumAction != null) {
                JavaEnum javaEnum = new JavaEnum(this);
                enumAction.accept(javaEnum);
                javaEnum.addExpectedNewLineAfterLastValue();
            }
        });
    }

    public void interfaceBlock(JavaVisibility visibility, String interfaceSignature, Consumer<JavaInterface> interfaceAction) {
        line(visibility + " interface " + interfaceSignature + " {");
        indent(() -> interfaceAction.accept(new JavaInterface(this)));
        line("}");
    }

    public void ifBlock(String condition, Consumer<JavaBlock> ifAction) {
        line("if (" + condition + ") {");
        indent(() -> ifAction.accept(new JavaBlock(this)));
        text("}");
        currentLineType = CurrentLineType.AfterIf;
    }

    public void elseIfBlock(String condition, Consumer<JavaBlock> ifAction) {
        line(" else if (" + condition + ") {", false);
        indent(() -> ifAction.accept(new JavaBlock(this)));
        text("}");
        currentLineType = CurrentLineType.AfterIf;
    }

    public void elseBlock(Consumer<JavaBlock> elseAction) {
        line(" else {", false);
        indent(() -> elseAction.accept(new JavaBlock(this)));
        line("}");
    }

    public void tryBlock(Consumer<JavaBlock> tryAction) {
        line("try {");
        indent(() -> tryAction.accept(new JavaBlock(this)));
        text("}");
        currentLineType = CurrentLineType.AfterIf;
    }

    public void tryBlock(String resource, Consumer<JavaBlock> tryAction) {
        line("try (" + resource + ") {");
        indent(() -> tryAction.accept(new JavaBlock(this)));
        text("}");
        currentLineType = CurrentLineType.AfterIf;
    }

    public void catchBlock(String exception, Consumer<JavaBlock> catchAction) {
        line(" catch (" + exception + ") {", false);
        indent(() -> catchAction.accept(new JavaBlock(this)));
        line("}");
        currentLineType = CurrentLineType.AfterIf;
    }

    public void finallyBlock(Consumer<JavaBlock> finallyAction) {
        line(" finally {", false);
        indent(() -> finallyAction.accept(new JavaBlock(this)));
        line("}");
    }

    public void lambda(String parameterType, String parameterName, Consumer<JavaLambda> body) {
        text("(" + parameterType + " " + parameterName + ") -> ");
        try (JavaLambda lambda = new JavaLambda(this)) {
            body.accept(lambda);
        }
    }

    public void lambda(String parameterType, String parameterName, String returnExpression) {
        lambda(parameterType, parameterName, lambda -> lambda.lambdaReturn(returnExpression));
    }

    private enum CurrentLineType {
        Empty,
        AfterIf,
        Text
    }
}
