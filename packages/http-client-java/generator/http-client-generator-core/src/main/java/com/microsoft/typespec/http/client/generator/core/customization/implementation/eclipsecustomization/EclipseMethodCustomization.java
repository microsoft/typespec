// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization.implementation.eclipsecustomization;

import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.customization.MethodCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.eclipse.lsp4j.FileChangeType;
import org.eclipse.lsp4j.FileEvent;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.Range;
import org.eclipse.lsp4j.SymbolInformation;
import org.eclipse.lsp4j.TextEdit;
import org.eclipse.lsp4j.WorkspaceEdit;

/**
 * The method level customization for an AutoRest generated method.
 */
public final class EclipseMethodCustomization extends EclipseCodeCustomization implements MethodCustomization {
    private final String packageName;
    private final String className;
    private final String methodName;
    private final String methodSignature;

    EclipseMethodCustomization(Editor editor, EclipseLanguageClient languageClient, String packageName,
        String className, String methodName, String methodSignature, SymbolInformation symbol) {
        super(editor, languageClient, symbol);
        this.packageName = packageName;
        this.className = className;
        this.methodName = methodName;
        this.methodSignature = methodSignature;
    }

    @Override
    public String getMethodName() {
        return methodName;
    }

    @Override
    public String getClassName() {
        return className;
    }

    @SuppressWarnings("deprecation")
    @Override
    public EclipseJavadocCustomization getJavadoc() {
        return new EclipseJavadocCustomization(editor, languageClient, fileUri, fileName,
            symbol.getLocation().getRange().getStart().getLine());
    }

    @SuppressWarnings("deprecation")
    @Override
    public EclipseMethodCustomization rename(String newName) {
        WorkspaceEdit edit = languageClient.renameSymbol(fileUri, symbol.getLocation().getRange().getStart(), newName);
        EclipseUtils.applyWorkspaceEdit(edit, editor, languageClient);

        return refreshCustomization(methodSignature.replace(methodName + "(", newName + "("));
    }

    @Override
    public EclipseMethodCustomization addAnnotation(String annotation) {
        return EclipseUtils.addAnnotation(annotation, this, () -> refreshCustomization(methodSignature));
    }

    @SuppressWarnings({ "OptionalGetWithoutIsPresent", "deprecation" })
    @Override
    public EclipseMethodCustomization removeAnnotation(String annotation) {
        return EclipseUtils.removeAnnotation(this,
            compilationUnit -> compilationUnit.getClassByName(className)
                .get()
                .getMethodsByName(methodName)
                .stream()
                .filter(method -> EclipseUtils.declarationContainsSymbol(method.getRange().get(),
                    symbol.getLocation().getRange()))
                .findFirst()
                .get()
                .getAnnotationByName(Utils.cleanAnnotationName(annotation)),
            () -> refreshCustomization(methodSignature));
    }

    @Override
    public EclipseMethodCustomization setModifier(int modifiers) {
        EclipseUtils.replaceModifier(symbol, editor, languageClient, "(?:.+ )?(\\w+ )" + methodName + "\\(",
            "$1" + methodName + "(", Modifier.methodModifiers(), modifiers);

        return refreshCustomization(methodSignature);
    }

    @Override
    public EclipseMethodCustomization replaceParameters(String newParameters) {
        return replaceParameters(newParameters, null);
    }

    @Override
    public EclipseMethodCustomization replaceParameters(String newParameters, List<String> importsToAdd) {
        String newSignature = methodName + "(" + newParameters + ")";

        EclipseClassCustomization classCustomization
            = new EclipsePackageCustomization(editor, languageClient, packageName).getClass(className);

        EclipseClassCustomization updatedClassCustomization
            = EclipseUtils.addImports(importsToAdd, classCustomization, classCustomization::refreshSymbol);

        return EclipseUtils.replaceParameters(newParameters, updatedClassCustomization.getMethod(methodSignature),
            () -> updatedClassCustomization.getMethod(newSignature));
    }

    @Override
    public EclipseMethodCustomization replaceBody(String newBody) {
        return replaceBody(newBody, null);
    }

    @Override
    public EclipseMethodCustomization replaceBody(String newBody, List<String> importsToAdd) {
        EclipseClassCustomization classCustomization
            = new EclipsePackageCustomization(editor, languageClient, packageName).getClass(className);

        EclipseClassCustomization updatedClassCustomization
            = EclipseUtils.addImports(importsToAdd, classCustomization, classCustomization::refreshSymbol);

        return EclipseUtils.replaceBody(newBody, updatedClassCustomization.getMethod(methodSignature),
            () -> updatedClassCustomization.getMethod(methodSignature));
    }

    @Override
    public EclipseMethodCustomization setReturnType(String newReturnType, String returnValueFormatter) {
        return setReturnType(newReturnType, returnValueFormatter, false);
    }

    @SuppressWarnings("deprecation")
    @Override
    public EclipseMethodCustomization setReturnType(String newReturnType, String returnValueFormatter,
        boolean replaceReturnStatement) {
        List<TextEdit> edits = new ArrayList<>();

        int line = symbol.getLocation().getRange().getStart().getLine();
        Position start = new Position(line, 0);
        String oldLineContent = editor.getFileLine(fileName, line);
        Position end = new Position(line, oldLineContent.length());
        String newLineContent = oldLineContent.replaceFirst("(\\w.* )?(\\w+) " + methodName + "\\(",
            "$1" + newReturnType + " " + methodName + "(");
        TextEdit signatureEdit = new TextEdit();
        signatureEdit.setNewText(newLineContent);
        signatureEdit.setRange(new Range(start, end));
        edits.add(signatureEdit);

        String methodIndent = Utils.getIndent(editor.getFileLine(fileName, line));
        String methodContentIndent = Utils.getIndent(editor.getFileLine(fileName, line + 1));
        String oldReturnType = oldLineContent.replaceAll(" " + methodName + "\\(.*", "")
            .replaceFirst(methodIndent + "(\\w.* )?", "")
            .trim();
        int returnLine = -1;
        while (!oldLineContent.startsWith(methodIndent + "}")) {
            if (oldLineContent.contains("return ")) {
                returnLine = line;
            }
            oldLineContent = editor.getFileLine(fileName, ++line);
        }
        if (returnLine == -1) {
            // no return statement, originally void return type
            editor.insertBlankLine(fileName, line, false);
            FileEvent blankLineEvent = new FileEvent();
            blankLineEvent.setUri(fileUri);
            blankLineEvent.setType(FileChangeType.Changed);
            languageClient.notifyWatchedFilesChanged(Collections.singletonList(blankLineEvent));

            TextEdit returnEdit = new TextEdit();
            returnEdit.setRange(new Range(new Position(line, 0), new Position(line, 0)));
            returnEdit.setNewText(methodContentIndent + "return " + returnValueFormatter + ";");
            edits.add(returnEdit);
        } else if (newReturnType.equals("void")) {
            // remove return statement
            TextEdit returnEdit = new TextEdit();
            returnEdit.setNewText("");
            returnEdit.setRange(new Range(new Position(returnLine, 0), new Position(line, 0)));
            edits.add(returnEdit);
        } else {
            // replace return statement
            TextEdit returnValueEdit = new TextEdit();
            String returnLineText = editor.getFileLine(fileName, returnLine);
            returnValueEdit
                .setRange(new Range(new Position(returnLine, 0), new Position(returnLine, returnLineText.length())));
            returnValueEdit.setNewText(returnLineText.replace("return ", oldReturnType + " returnValue = "));
            edits.add(returnValueEdit);

            editor.insertBlankLine(fileName, line, false);
            FileEvent blankLineEvent = new FileEvent();
            blankLineEvent.setUri(fileUri);
            blankLineEvent.setType(FileChangeType.Changed);
            languageClient.notifyWatchedFilesChanged(Collections.singletonList(blankLineEvent));

            TextEdit returnEdit = new TextEdit();
            returnEdit.setRange(new Range(new Position(line, 0), new Position(line, 0)));

            if (replaceReturnStatement) {
                returnEdit.setNewText(String.format(returnValueFormatter, "returnValue"));
            } else {
                returnEdit.setNewText(
                    methodContentIndent + "return " + String.format(returnValueFormatter, "returnValue") + ";");
            }

            edits.add(returnEdit);
        }

        WorkspaceEdit workspaceEdit = new WorkspaceEdit();
        workspaceEdit.setChanges(Collections.singletonMap(fileUri, edits));
        EclipseUtils.applyWorkspaceEdit(workspaceEdit, editor, languageClient);

        EclipseUtils.organizeImportsOnRange(languageClient, editor, fileUri, new Range(start, end));

        String newMethodSignature
            = methodSignature.replace(oldReturnType + " " + methodName, newReturnType + " " + methodName);

        return refreshCustomization(newMethodSignature);
    }

    private EclipseMethodCustomization refreshCustomization(String methodSignature) {
        return new EclipsePackageCustomization(editor, languageClient, packageName).getClass(className)
            .getMethod(methodSignature);
    }
}
