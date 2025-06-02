// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization.implementation.eclipsecustomization;

import com.microsoft.typespec.http.client.generator.core.customization.ConstantCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.customization.PropertyCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;
import org.eclipse.lsp4j.SymbolInformation;
import org.eclipse.lsp4j.SymbolKind;
import org.eclipse.lsp4j.WorkspaceEdit;

/**
 * Customization for an AutoRest generated constant property.
 * <p>
 * For instance property customizations use {@link PropertyCustomization}.
 */
public final class EclipseConstantCustomization extends EclipseCodeCustomization implements ConstantCustomization {
    private static final Pattern METHOD_PARAMS_CAPTURE = Pattern.compile("\\(.*\\)");

    private final String packageName;
    private final String className;
    private final String constantName;

    EclipseConstantCustomization(Editor editor, EclipseLanguageClient languageClient, String packageName,
        String className, SymbolInformation symbol, String constantName) {
        super(editor, languageClient, symbol);

        this.packageName = packageName;
        this.className = className;
        this.constantName = constantName;
    }

    @Override
    public String getClassName() {
        return className;
    }

    @Override
    public String getConstantName() {
        return constantName;
    }

    @SuppressWarnings("deprecation")
    @Override
    public EclipseJavadocCustomization getJavadoc() {
        return new EclipseJavadocCustomization(editor, languageClient, fileUri, fileName,
            symbol.getLocation().getRange().getStart().getLine());
    }

    @Override
    public EclipseConstantCustomization setModifier(int modifiers) {
        EclipseUtils.replaceModifier(symbol, editor, languageClient, "(?:.+ )?(\\w+ )" + constantName + "\\(",
            "$1" + constantName + "(", Modifier.fieldModifiers(), Modifier.STATIC | Modifier.FINAL | modifiers);

        return refreshCustomization(constantName);
    }

    @SuppressWarnings("deprecation")
    @Override
    public EclipseConstantCustomization rename(String newName) {
        Objects.requireNonNull(newName, "'newName' cannot be null.");

        String lowercaseConstantName = constantName.toLowerCase();
        String currentCamelName = constantToMethodName(constantName);
        String lowercaseCurrentCamelName = currentCamelName.toLowerCase();
        String newCamelName = constantToMethodName(newName);

        List<WorkspaceEdit> edits = new ArrayList<>();
        for (SymbolInformation si : languageClient.listDocumentSymbols(fileUri)) {
            String symbolName = si.getName().toLowerCase();
            if (!symbolName.contains(lowercaseConstantName) && !symbolName.contains(lowercaseCurrentCamelName)) {
                continue;
            }

            if (si.getKind() == SymbolKind.Constant) {
                edits.add(languageClient.renameSymbol(fileUri, si.getLocation().getRange().getStart(), newName));
            } else if (si.getKind() == SymbolKind.Method) {
                String methodName = si.getName().replace(currentCamelName, newCamelName).replace(constantName, newName);
                methodName = METHOD_PARAMS_CAPTURE.matcher(methodName).replaceFirst("");
                edits.add(languageClient.renameSymbol(fileUri, si.getLocation().getRange().getStart(), methodName));
            }
        }

        EclipseUtils.applyWorkspaceEdits(edits, editor, languageClient);
        return refreshCustomization(newName);
    }

    private static String constantToMethodName(String constantName) {
        // Constants will be in the form A_WORD_SPLIT_BY_UNDERSCORE_AND_CAPITALIZED, which, if used as-is won't follow
        // getter, or method, naming conventions of getAWordInCamelCase.
        //
        // Split the constant name on '_' and lower case all characters after the first.
        StringBuilder camelBuilder = new StringBuilder(constantName.length());

        for (String word : constantName.split("_")) {
            if (word.isEmpty()) {
                continue;
            }

            camelBuilder.append(word.charAt(0));
            if (word.length() > 1) {
                camelBuilder.append(word.substring(1).toLowerCase());
            }
        }

        return camelBuilder.toString();
    }

    @Override
    public EclipseConstantCustomization addAnnotation(String annotation) {
        return EclipseUtils.addAnnotation(annotation, this, () -> refreshCustomization(constantName));
    }

    @SuppressWarnings("OptionalGetWithoutIsPresent")
    @Override
    public EclipseConstantCustomization removeAnnotation(String annotation) {
        return EclipseUtils.removeAnnotation(this,
            compilationUnit -> compilationUnit.getClassByName(className)
                .get()
                .getFieldByName(constantName)
                .get()
                .getAnnotationByName(Utils.cleanAnnotationName(annotation)),
            () -> refreshCustomization(constantName));
    }

    private EclipseConstantCustomization refreshCustomization(String constantName) {
        return new EclipsePackageCustomization(editor, languageClient, packageName).getClass(className)
            .getConstant(constantName);
    }
}
