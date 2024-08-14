// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import org.eclipse.lsp4j.SymbolInformation;
import org.eclipse.lsp4j.SymbolKind;
import org.eclipse.lsp4j.WorkspaceEdit;

import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Customization for an AutoRest generated constant property.
 * <p>
 * For instance property customizations use {@link PropertyCustomization}.
 */
public final class ConstantCustomization extends CodeCustomization {
    private static final Pattern METHOD_PARAMS_CAPTURE = Pattern.compile("\\(.*\\)");

    private final String packageName;
    private final String className;
    private final String constantName;

    ConstantCustomization(Editor editor, EclipseLanguageClient languageClient, String packageName, String className,
                          SymbolInformation symbol, String constantName) {
        super(editor, languageClient, symbol);

        this.packageName = packageName;
        this.className = className;
        this.constantName = constantName;
    }

    /**
     * Gets the name of the class that contains this constant.
     *
     * @return The name of the class that contains this constant.
     */
    public String getClassName() {
        return className;
    }

    /**
     * Gets the name of this constant.
     *
     * @return The name of this constant.
     */
    public String getConstantName() {
        return constantName;
    }

    /**
     * Gets the Javadoc customization for this constant.
     *
     * @return The Javadoc customization.
     */
    public JavadocCustomization getJavadoc() {
        return new JavadocCustomization(editor, languageClient, fileUri, fileName,
            symbol.getLocation().getRange().getStart().getLine());
    }

    /**
     * Replace the modifier for this constant.
     * <p>
     * For compound modifiers such as {@code public abstract} use bitwise OR ({@code |}) of multiple Modifiers, {@code
     * Modifier.PUBLIC | Modifier.ABSTRACT}.
     * <p>
     * This operation doesn't allow for the constant to lose constant status, so
     * {@code Modifier.STATIC | Modifier.FINAL} will be added to the passed {@code modifiers}.
     * <p>
     * Pass {@code 0} for {@code modifiers} to indicate that the constant has no modifiers.
     *
     * @param modifiers The {@link Modifier Modifiers} for the constant.
     * @return The updated ConstantCustomization object.
     * @throws IllegalArgumentException If the {@code modifier} is less than to {@code 0} or any {@link Modifier}
     * included in the bitwise OR isn't a valid constant {@link Modifier}.
     */
    public ConstantCustomization setModifier(int modifiers) {
        Utils.replaceModifier(symbol, editor, languageClient, "(?:.+ )?(\\w+ )" + constantName + "\\(",
            "$1" + constantName + "(", Modifier.fieldModifiers(), Modifier.STATIC | Modifier.FINAL | modifiers);

        return refreshCustomization(constantName);
    }

    /**
     * Renames the constant.
     * <p>
     * This operation doesn't allow for the constant to lose naming conventions of capitalized and underscore delimited
     * words, so the {@code newName} will be capitalized.
     * <p>
     * This is a refactor operation, all references of the constant will be renamed and the getter method(s) for this
     * property will be renamed accordingly as well.
     *
     * @param newName The new name for the constant.
     * @return A new instance of {@link ConstantCustomization} for chaining.
     * @throws NullPointerException If {@code newName} is null.
     */
    public ConstantCustomization rename(String newName) {
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
                String methodName = si.getName().replace(currentCamelName, newCamelName)
                    .replace(constantName, newName);
                methodName = METHOD_PARAMS_CAPTURE.matcher(methodName).replaceFirst("");
                edits.add(languageClient.renameSymbol(fileUri, si.getLocation().getRange().getStart(), methodName));
            }
        }

        Utils.applyWorkspaceEdits(edits, editor, languageClient);
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

    /**
     * Add an annotation to a property in the class.
     *
     * @param annotation the annotation to add. The leading @ can be omitted.
     * @return A new instance of {@link ConstantCustomization} for chaining.
     */
    public ConstantCustomization addAnnotation(String annotation) {
        return Utils.addAnnotation(annotation, this, () -> refreshCustomization(constantName));
    }

    /**
     * Remove an annotation from the constant.
     *
     * @param annotation the annotation to remove from the constant. The leading @ can be omitted.
     * @return A new instance of {@link ConstantCustomization} for chaining.
     */
    public ConstantCustomization removeAnnotation(String annotation) {
        return Utils.removeAnnotation(this, compilationUnit -> compilationUnit.getClassByName(className).get()
            .getFieldByName(constantName).get()
            .getAnnotationByName(Utils.cleanAnnotationName(annotation)), () -> refreshCustomization(constantName));
    }

    private ConstantCustomization refreshCustomization(String constantName) {
        return new PackageCustomization(editor, languageClient, packageName)
            .getClass(className)
            .getConstant(constantName);
    }
}
