// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.CallableDeclaration;
import com.github.javaparser.ast.body.EnumConstantDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.body.TypeDeclaration;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.ClassExpr;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.NameExpr;
import com.github.javaparser.ast.expr.SimpleName;
import com.github.javaparser.ast.expr.StringLiteralExpr;
import com.github.javaparser.ast.type.ArrayType;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import com.github.javaparser.ast.type.Type;
import com.github.javaparser.ast.type.TypeParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.util.ModelTemplateHeaderHelper;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import java.util.ArrayList;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Collects library-wide, statically known header names and parameterized types. */
public final class ClientCoreConstantsTemplate {
    private static final String CORE_UTILS = "io.clientcore.core.utils.CoreUtils";
    private static final String HEADER_NAME = "io.clientcore.core.http.models.HttpHeaderName";
    private static final Set<String> JAVA_LANG = Set.of("Object", "String", "Void", "Boolean", "Byte", "Short",
        "Integer", "Long", "Float", "Double", "Character", "Number", "CharSequence", "Class", "Throwable", "Exception");
    private final String packageName;
    private final String className;
    private final Map<String, String> headers = new LinkedHashMap<>();
    private final Map<String, Expression> types = new LinkedHashMap<>();
    private final Map<String, String> typeNames = new LinkedHashMap<>();
    private final Map<String, Boolean> declaredTypes = new LinkedHashMap<>();
    private final Map<CompilationUnit, Boolean> collisions = new IdentityHashMap<>();
    private final Map<CompilationUnit, String> headerOwners = new IdentityHashMap<>();

    public ClientCoreConstantsTemplate(String packageName, String rootPackage) {
        this.packageName = packageName;
        StringBuilder prefix = new StringBuilder();
        for (String segment : rootPackage.split("\\.")) {
            if (!segment.isEmpty()) {
                prefix.append(CodeNamer.toPascalCase(CodeNamer.removeInvalidCharacters(segment)));
            }
        }
        if (prefix.length() == 0) {
            prefix.append("Client");
        } else if (!Character.isJavaIdentifierStart(prefix.codePointAt(0))) {
            prefix.insert(0, "Package");
        }
        this.className = prefix + "Constants";
    }

    public String getClassName() {
        return className;
    }

    public boolean write(List<JavaFile> files, JavaFile constants) {
        Map<JavaFile, CompilationUnit> units = new LinkedHashMap<>();
        for (JavaFile file : files) {
            if (!file.getFilePath().endsWith(".java") || file.getFilePath().endsWith("module-info.java")) {
                continue;
            }
            String source = file.getContents().toString();
            CompilationUnit unit = StaticJavaParser.parse(source);
            collisions.put(unit,
                unit.findAll(SimpleName.class)
                    .stream()
                    .anyMatch(identifier -> identifier.asString().equals(className)));
            units.put(file, unit);
            unit.findAll(TypeDeclaration.class)
                .forEach(
                    declaration -> declaredTypes.put(qualifiedName(declaration, unit), accessible(declaration, unit)));
        }
        for (Map.Entry<JavaFile, CompilationUnit> entry : units.entrySet()) {
            CompilationUnit unit = entry.getValue();
            boolean changed = false;
            for (MethodCallExpr call : new ArrayList<>(unit.findAll(MethodCallExpr.class))) {
                if (call.getParentNode().isEmpty()) {
                    continue;
                }
                Expression replacement = null;
                if (isFactory(call, unit, HEADER_NAME, "fromString")
                    && call.getArguments().size() == 1
                    && call.getArgument(0).isStringLiteralExpr()) {
                    String value = call.getArgument(0).asStringLiteralExpr().asString();
                    String known = ModelTemplateHeaderHelper.getKnownClientCoreHttpHeaderNameConstant(value);
                    replacement = known == null
                        ? reference(unit, headers.computeIfAbsent(value, ignored -> headerField(value)))
                        : headerReference(unit, known);
                } else if (isFactory(call, unit, CORE_UTILS, "createParameterizedType")) {
                    Expression canonical = canonicalType(call, unit);
                    if (canonical != null) {
                        replacement = reference(unit, registerType(canonical));
                    }
                }
                if (replacement != null) {
                    call.replace(replacement);
                    changed = true;
                }
            }
            if (changed) {
                JavaFile rewritten = new JavaFile(entry.getKey().getFilePath());
                rewritten.line(unit.toString());
                files.set(files.indexOf(entry.getKey()), rewritten);
            }
        }
        if (headers.isEmpty() && types.isEmpty()) {
            return false;
        }
        if (!headers.isEmpty()) {
            constants.declareImport(HEADER_NAME);
        }
        if (!types.isEmpty()) {
            constants.declareImport(CORE_UTILS, "java.lang.reflect.ParameterizedType");
        }
        shortenTypeNames(constants);
        constants.publicFinalClass(className, block -> {
            headers.forEach((value, name) -> block.publicStaticFinalVariable("HttpHeaderName " + name
                + " = HttpHeaderName.fromString(" + new StringLiteralExpr().setString(value) + ")"));
            types.forEach((key, value) -> block
                .publicStaticFinalVariable("ParameterizedType " + typeNames.get(key) + " = " + value));
            block.privateConstructor(className + "()", ignored -> {
            });
        });
        return true;
    }

    private void shortenTypeNames(JavaFile file) {
        Map<String, Set<String>> names = new LinkedHashMap<>();
        List<ClassOrInterfaceType> references = new ArrayList<>();
        types.values().forEach(expression -> expression.findAll(ClassExpr.class).forEach(literal -> {
            Type type = literal.getType();
            while (type.isArrayType()) {
                type = type.asArrayType().getComponentType();
            }
            if (type.isClassOrInterfaceType()) {
                ClassOrInterfaceType reference = type.asClassOrInterfaceType();
                references.add(reference);
                names.computeIfAbsent(reference.getNameAsString(), ignored -> new LinkedHashSet<>())
                    .add(reference.getNameWithScope());
            }
        }));
        Set<String> reserved = Set.of("CoreUtils", "HttpHeaderName", "ParameterizedType", className);
        Set<String> imports = new LinkedHashSet<>();
        for (ClassOrInterfaceType reference : references) {
            String name = reference.getNameAsString();
            if (!reserved.contains(name) && names.get(name).size() == 1) {
                String qualified = reference.getNameWithScope();
                if (!qualified.startsWith("java.lang.")) {
                    imports.add(qualified);
                }
                reference.replace(new ClassOrInterfaceType(null, name));
            }
        }
        file.declareImport(imports);
    }

    private String headerField(String value) {
        String preferred = "HEADER_" + value.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "_");
        String name = preferred;
        int index = 1;
        while (headers.containsValue(name)) {
            name = preferred + "_" + index++;
        }
        return name;
    }

    private String registerType(Expression canonical) {
        String key = canonical.toString();
        if (typeNames.containsKey(key)) {
            return typeNames.get(key);
        }
        MethodCallExpr initializer = canonical.asMethodCallExpr().clone();
        for (int i = 0; i < initializer.getArguments().size(); i++) {
            Expression argument = initializer.getArgument(i);
            if (argument.isMethodCallExpr()) {
                initializer.setArgument(i, new NameExpr(registerType(argument)));
            }
        }
        initializer.setScope(new NameExpr("CoreUtils"));
        String preferred = typeDescription(canonical) + "_TYPE";
        String name = preferred;
        int index = 1;
        while (typeNames.containsValue(name)) {
            name = preferred + "_" + index++;
        }
        typeNames.put(key, name);
        types.put(key, initializer);
        return name;
    }

    private static String typeDescription(Expression expression) {
        if (expression.isClassExpr()) {
            return typeDescription(expression.asClassExpr().getType());
        }
        MethodCallExpr parameterized = expression.asMethodCallExpr();
        StringBuilder name = new StringBuilder(typeDescription(parameterized.getArgument(0)));
        for (int i = 1; i < parameterized.getArguments().size(); i++) {
            name.append(i == 1 ? "_OF_" : "_AND_").append(typeDescription(parameterized.getArgument(i)));
        }
        return name.toString();
    }

    private static String typeDescription(Type type) {
        if (type.isArrayType()) {
            return typeDescription(type.asArrayType().getComponentType()) + "_ARRAY";
        }
        String name = type.isClassOrInterfaceType() ? type.asClassOrInterfaceType().getNameAsString() : type.asString();
        return name.replaceAll("([A-Z]+)([A-Z][a-z])", "$1_$2")
            .replaceAll("([a-z0-9])([A-Z])", "$1_$2")
            .replaceAll("[^A-Za-z0-9_]", "_")
            .toUpperCase(Locale.ROOT);
    }

    private Expression canonicalType(MethodCallExpr call, CompilationUnit unit) {
        if (!isFactory(call, unit, CORE_UTILS, "createParameterizedType") || call.getArguments().isEmpty()) {
            return null;
        }
        MethodCallExpr result = new MethodCallExpr(new NameExpr("CoreUtils"), "createParameterizedType");
        for (Expression argument : call.getArguments()) {
            if (argument.isClassExpr()) {
                Type resolved = resolveType(argument.asClassExpr().getType(), unit);
                if (resolved == null) {
                    return null;
                }
                result.addArgument(new ClassExpr(resolved));
            } else if (argument.isMethodCallExpr()) {
                Expression nested = canonicalType(argument.asMethodCallExpr(), unit);
                if (nested == null) {
                    return null;
                }
                result.addArgument(nested);
            } else {
                return null;
            }
        }
        return result;
    }

    private Type resolveType(Type type, CompilationUnit unit) {
        if (type.isPrimitiveType() || type.isVoidType()) {
            return type.clone();
        }
        if (type.isArrayType()) {
            Type component = resolveType(type.asArrayType().getComponentType(), unit);
            return component == null ? null : new ArrayType(component);
        }
        if (!type.isClassOrInterfaceType()) {
            return null;
        }
        String name = type.asClassOrInterfaceType().getNameWithScope();
        String first = name.split("\\.")[0];
        for (TypeDeclaration<?> declaration : unit.findAll(TypeDeclaration.class)) {
            if (declaration.getNameAsString().equals(first)) {
                if (!accessible(declaration, unit)) {
                    return null;
                }
                return resolvedType(qualifiedName(declaration, unit) + name.substring(first.length()));
            }
        }
        for (var declaration : unit.getImports()) {
            if (!declaration.isStatic()
                && !declaration.isAsterisk()
                && declaration.getName().getIdentifier().equals(first)) {
                return resolvedType(declaration.getNameAsString() + name.substring(first.length()));
            }
        }
        String ownPackage = unit.getPackageDeclaration().map(declaration -> declaration.getNameAsString()).orElse("");
        String localName = ownPackage.isEmpty() ? name : ownPackage + "." + name;
        if (declaredTypes.containsKey(localName)) {
            return resolvedType(localName);
        }
        if (JAVA_LANG.contains(first)) {
            return resolvedType("java.lang." + name);
        }
        return name.contains(".") && Character.isLowerCase(first.charAt(0)) ? resolvedType(name) : null;
    }

    private ClassOrInterfaceType resolvedType(String name) {
        return Boolean.FALSE.equals(declaredTypes.get(name)) ? null : StaticJavaParser.parseClassOrInterfaceType(name);
    }

    private boolean isFactory(MethodCallExpr call, CompilationUnit unit, String owner, String method) {
        if (!call.getNameAsString().equals(method)) {
            return false;
        }
        if (call.getScope().isPresent()) {
            String scope = call.getScope().get().toString();
            if (scope.equals(owner)) {
                return true;
            }
            String simple = owner.substring(owner.lastIndexOf('.') + 1);
            return scope.equals(simple)
                && unit.getImports()
                    .stream()
                    .anyMatch(declaration -> !declaration.isStatic() && declaration.getNameAsString().equals(owner));
        }
        return unit.getImports()
            .stream()
            .anyMatch(declaration -> declaration.isStatic()
                && declaration.getNameAsString().equals(declaration.isAsterisk() ? owner : owner + "." + method));
    }

    private Expression headerReference(CompilationUnit unit, String name) {
        return StaticJavaParser.parseExpression(headerOwners.computeIfAbsent(unit, this::headerOwner) + "." + name);
    }

    private String headerOwner(CompilationUnit unit) {
        String simpleName = "HttpHeaderName";
        String ownPackage = unit.getPackageDeclaration().map(value -> value.getNameAsString()).orElse("");
        boolean collision = declaredTypes.containsKey(ownPackage + "." + simpleName)
            || unit.findAll(VariableDeclarator.class)
                .stream()
                .anyMatch(value -> value.getNameAsString().equals(simpleName))
            || unit.findAll(Parameter.class).stream().anyMatch(value -> value.getNameAsString().equals(simpleName))
            || unit.findAll(TypeDeclaration.class)
                .stream()
                .anyMatch(value -> value.getNameAsString().equals(simpleName))
            || unit.findAll(TypeParameter.class).stream().anyMatch(value -> value.getNameAsString().equals(simpleName))
            || unit.findAll(EnumConstantDeclaration.class)
                .stream()
                .anyMatch(value -> value.getNameAsString().equals(simpleName))
            || unit.getImports()
                .stream()
                .anyMatch(value -> value.getName().getIdentifier().equals(simpleName)
                    && !value.getNameAsString().equals(HEADER_NAME));
        if (!collision) {
            unit.addImport(HEADER_NAME);
        }
        return collision ? HEADER_NAME : simpleName;
    }

    private Expression reference(CompilationUnit unit, String name) {
        String owner = packageName + "." + className;
        boolean collision = collisions.get(unit);
        if (!collision) {
            unit.addImport(owner);
            owner = className;
        }
        return StaticJavaParser.parseExpression(owner + "." + name);
    }

    private boolean accessible(TypeDeclaration<?> declaration, CompilationUnit unit) {
        if (declaration.findAncestor(CallableDeclaration.class).isPresent() || declaration.isPrivate()) {
            return false;
        }
        Node node = declaration;
        while (node instanceof TypeDeclaration) {
            if (!((TypeDeclaration<?>) node).isPublic()
                && !unit.getPackageDeclaration()
                    .map(value -> value.getNameAsString().equals(packageName))
                    .orElse(false)) {
                return false;
            }
            node = node.getParentNode().orElse(null);
        }
        return true;
    }

    private static String qualifiedName(TypeDeclaration<?> declaration, CompilationUnit unit) {
        String name = declaration.getNameAsString();
        Node parent = declaration.getParentNode().orElse(null);
        while (parent instanceof TypeDeclaration) {
            name = ((TypeDeclaration<?>) parent).getNameAsString() + "." + name;
            parent = parent.getParentNode().orElse(null);
        }
        return unit.getPackageDeclaration().map(value -> value.getNameAsString() + ".").orElse("") + name;
    }
}
