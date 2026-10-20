// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.FieldAccessExpr;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.MethodReferenceExpr;
import com.github.javaparser.ast.expr.NameExpr;
import com.github.javaparser.ast.expr.SimpleName;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Emits referenced static utility methods and their transitive method/field dependencies. */
public final class OptionalUtilityTemplate implements IJavaTemplate<Set<String>, JavaFile> {
    private final String resourceName;
    private final String className;

    public OptionalUtilityTemplate(String resourceName, String className) {
        this.resourceName = resourceName;
        this.className = className;
    }

    public Set<String> getRequiredMembers(List<JavaFile> files) {
        Set<String> required = new LinkedHashSet<>();
        ClassOrInterfaceDeclaration catalog = loadResource().getClassByName(className)
            .orElseThrow(() -> new IllegalStateException("Utility class not found: " + className));
        Set<String> available
            = catalog.getMethods().stream().map(MethodDeclaration::getNameAsString).collect(Collectors.toSet());
        catalog.getFields()
            .forEach(field -> field.getVariables().forEach(variable -> available.add(variable.getNameAsString())));
        for (JavaFile file : files) {
            String source = file.getContents().toString();
            if (!source.contains(className)) {
                continue;
            }
            CompilationUnit unit = StaticJavaParser.parse(source);
            Set<String> staticImports = new LinkedHashSet<>();
            boolean[] wildcard = { false };
            unit.getImports().stream().filter(ImportDeclaration::isStatic).forEach(declaration -> {
                String name = declaration.getNameAsString();
                if (declaration.isAsterisk() && isUtility(name)) {
                    wildcard[0] = true;
                } else if (declaration.getName()
                    .getQualifier()
                    .map(Object::toString)
                    .filter(this::isUtility)
                    .isPresent()) {
                    staticImports.add(declaration.getName().getIdentifier());
                }
            });
            unit.findAll(MethodCallExpr.class)
                .stream()
                .filter(call -> call.getScope().isPresent()
                    ? isUtility(call.getScope().get().toString())
                    : (wildcard[0] && available.contains(call.getNameAsString()))
                        || staticImports.contains(call.getNameAsString()))
                .forEach(call -> required.add(call.getNameAsString()));
            unit.findAll(MethodReferenceExpr.class)
                .stream()
                .filter(reference -> isUtility(reference.getScope().toString()))
                .forEach(reference -> required.add(reference.getIdentifier()));
            unit.findAll(FieldAccessExpr.class)
                .stream()
                .filter(access -> isUtility(access.getScope().toString()))
                .forEach(access -> required.add(access.getNameAsString()));
            unit.findAll(NameExpr.class)
                .stream()
                .filter(name -> (wildcard[0] && available.contains(name.getNameAsString()))
                    || staticImports.contains(name.getNameAsString()))
                .forEach(name -> required.add(name.getNameAsString()));
        }
        return required;
    }

    @Override
    public void write(Set<String> required, JavaFile file) {
        if (required.isEmpty()) {
            return;
        }
        CompilationUnit unit = loadResource();
        ClassOrInterfaceDeclaration utility = unit.getClassByName(className)
            .orElseThrow(() -> new IllegalStateException("Utility class not found: " + className));
        if (utility.getMethods().stream().anyMatch(method -> !method.isStatic())) {
            throw new IllegalArgumentException("Optional utility methods must be static: " + className);
        }
        Map<String, List<Node>> members = new LinkedHashMap<>();
        utility.getMethods()
            .forEach(
                method -> members.computeIfAbsent(method.getNameAsString(), ignored -> new ArrayList<>()).add(method));
        utility.getFields()
            .forEach(field -> field.getVariables()
                .forEach(variable -> members.computeIfAbsent(variable.getNameAsString(), ignored -> new ArrayList<>())
                    .add(field)));
        if (!members.keySet().containsAll(required)) {
            Set<String> missing = new LinkedHashSet<>(required);
            missing.removeAll(members.keySet());
            throw new IllegalArgumentException("Unknown " + className + " utility members: " + missing);
        }
        Set<String> retained = new LinkedHashSet<>(required);
        ArrayDeque<String> pending = new ArrayDeque<>(required);
        while (!pending.isEmpty()) {
            for (Node member : members.get(pending.removeFirst())) {
                Set<String> dependencies = new LinkedHashSet<>();
                member.findAll(MethodCallExpr.class)
                    .stream()
                    .filter(call -> call.getScope().isEmpty()
                        || call.getScope().map(Object::toString).filter(this::isUtility).isPresent())
                    .forEach(call -> dependencies.add(call.getNameAsString()));
                member.findAll(MethodReferenceExpr.class)
                    .stream()
                    .filter(reference -> isUtility(reference.getScope().toString()))
                    .forEach(reference -> dependencies.add(reference.getIdentifier()));
                member.findAll(FieldAccessExpr.class)
                    .stream()
                    .filter(access -> isUtility(access.getScope().toString()))
                    .forEach(access -> dependencies.add(access.getNameAsString()));
                member.findAll(NameExpr.class).forEach(name -> dependencies.add(name.getNameAsString()));
                if (member instanceof FieldDeclaration) {
                    ((FieldDeclaration) member).getVariables()
                        .forEach(variable -> dependencies.add(variable.getNameAsString()));
                }
                dependencies.stream().filter(members::containsKey).filter(retained::add).forEach(pending::addLast);
            }
        }
        new ArrayList<>(utility.getMethods()).stream()
            .filter(method -> !retained.contains(method.getNameAsString()))
            .forEach(MethodDeclaration::remove);
        new ArrayList<>(utility.getFields()).stream()
            .filter(field -> field.getVariables()
                .stream()
                .noneMatch(variable -> retained.contains(variable.getNameAsString())))
            .forEach(FieldDeclaration::remove);
        Set<String> names
            = unit.findAll(SimpleName.class).stream().map(SimpleName::asString).collect(Collectors.toSet());
        unit.findAll(AnnotationExpr.class).forEach(annotation -> names.add(annotation.getName().getIdentifier()));
        unit.getImports()
            .removeIf(
                declaration -> !declaration.isAsterisk() && !names.contains(declaration.getName().getIdentifier()));
        file.line(unit.toString());
    }

    private CompilationUnit loadResource() {
        try (InputStream resource = getClass().getClassLoader().getResourceAsStream(resourceName + ".java")) {
            if (resource == null) {
                throw new IllegalArgumentException("Utility resource not found: " + resourceName);
            }
            return StaticJavaParser.parse(resource);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load " + resourceName, exception);
        }
    }

    private boolean isUtility(String scope) {
        return scope.equals(className) || scope.endsWith("." + className);
    }
}
