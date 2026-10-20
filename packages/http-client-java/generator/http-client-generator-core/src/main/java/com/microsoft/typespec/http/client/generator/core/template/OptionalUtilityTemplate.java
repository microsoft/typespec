// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.CallableDeclaration;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.InitializerDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.FieldAccessExpr;
import com.github.javaparser.ast.expr.LambdaExpr;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.MethodReferenceExpr;
import com.github.javaparser.ast.expr.NameExpr;
import com.github.javaparser.ast.expr.ObjectCreationExpr;
import com.github.javaparser.ast.expr.SimpleName;
import com.github.javaparser.ast.stmt.BlockStmt;
import com.github.javaparser.ast.stmt.CatchClause;
import com.github.javaparser.ast.stmt.ForEachStmt;
import com.github.javaparser.ast.stmt.ForStmt;
import com.github.javaparser.ast.stmt.Statement;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import com.github.javaparser.ast.type.Type;
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

/** Emits referenced utility methods and their transitive method/field dependencies. */
public final class OptionalUtilityTemplate implements IJavaTemplate<Set<String>, JavaFile> {
    private final String resourceName;
    private final String className;

    public OptionalUtilityTemplate(String resourceName, String className) {
        this.resourceName = resourceName;
        this.className = className;
    }

    public Set<String> getRequiredMembers(List<JavaFile> files) {
        Set<String> required = new LinkedHashSet<>();
        boolean referencedType = false;
        ClassOrInterfaceDeclaration catalog = loadResource().getClassByName(className)
            .orElseThrow(() -> new IllegalStateException("Utility class not found: " + className));
        Set<String> available
            = catalog.getMethods().stream().map(MethodDeclaration::getNameAsString).collect(Collectors.toSet());
        available.add(className);
        catalog.getFields()
            .forEach(field -> field.getVariables().forEach(variable -> available.add(variable.getNameAsString())));
        for (JavaFile file : files) {
            String source = file.getContents().toString();
            if (!source.contains(className)) {
                continue;
            }
            CompilationUnit unit = StaticJavaParser.parse(source);
            referencedType |= unit.findAll(ClassOrInterfaceType.class).stream().anyMatch(this::isUtilityType);
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
                .filter(call -> available.contains(call.getNameAsString()))
                .filter(call -> call.getScope().isPresent()
                    ? isUtility(call.getScope().get().toString()) || isUtilityInstance(call.getScope().get(), catalog)
                    : (wildcard[0] && available.contains(call.getNameAsString()))
                        || staticImports.contains(call.getNameAsString()))
                .forEach(call -> required.add(call.getNameAsString()));
            unit.findAll(MethodReferenceExpr.class)
                .stream()
                .filter(reference -> isUtility(reference.getScope().toString())
                    || isUtilityInstance(reference.getScope(), catalog))
                .map(reference -> reference.getIdentifier().equals("new") ? className : reference.getIdentifier())
                .filter(available::contains)
                .forEach(required::add);
            unit.findAll(ObjectCreationExpr.class)
                .stream()
                .filter(creation -> isUtilityType(creation.getType()))
                .forEach(creation -> required.add(className));
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
        if (required.isEmpty() && referencedType) {
            required.add(className);
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
        if (utility.getMethods().stream().anyMatch(method -> !method.isStatic())
            && (!utility.isFinal()
                || !utility.getExtendedTypes().isEmpty()
                || !utility.getImplementedTypes().isEmpty())) {
            throw new IllegalArgumentException(
                "Optional instance utilities must be final and have no inheritance contracts: " + className);
        }
        Map<String, List<Node>> members = new LinkedHashMap<>();
        members.put(className, new ArrayList<>(utility.getConstructors()));
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
        ArrayDeque<Node> pending = new ArrayDeque<>(utility.getConstructors());
        utility.getMembers().stream().filter(InitializerDeclaration.class::isInstance).forEach(pending::addLast);
        required.forEach(name -> pending.addAll(members.get(name)));
        while (!pending.isEmpty()) {
            Node member = pending.removeFirst();
            Set<String> dependencies = new LinkedHashSet<>();
            member.findAll(MethodCallExpr.class)
                .stream()
                .filter(call -> call.getScope().isEmpty()
                    || call.getScope()
                        .filter(scope -> scope.isThisExpr()
                            || isUtility(scope.toString())
                            || isUtilityInstance(scope, utility))
                        .isPresent())
                .forEach(call -> dependencies.add(call.getNameAsString()));
            member.findAll(MethodReferenceExpr.class)
                .stream()
                .filter(reference -> reference.getScope().isThisExpr()
                    || isUtility(reference.getScope().toString())
                    || isUtilityInstance(reference.getScope(), utility))
                .forEach(reference -> dependencies.add(reference.getIdentifier()));
            member.findAll(FieldAccessExpr.class)
                .stream()
                .filter(access -> access.getScope().isThisExpr() || isUtility(access.getScope().toString()))
                .forEach(access -> dependencies.add(access.getNameAsString()));
            member.findAll(NameExpr.class).forEach(name -> dependencies.add(name.getNameAsString()));
            if (member instanceof FieldDeclaration) {
                ((FieldDeclaration) member).getVariables()
                    .forEach(variable -> dependencies.add(variable.getNameAsString()));
            }
            dependencies.stream()
                .filter(members::containsKey)
                .filter(retained::add)
                .forEach(name -> pending.addAll(members.get(name)));
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

    private boolean isUtilityInstance(Expression expression, ClassOrInterfaceDeclaration catalog) {
        if (expression.isThisExpr()) {
            return expression.findAncestor(ClassOrInterfaceDeclaration.class)
                .filter(owner -> owner.getNameAsString().equals(className))
                .isPresent();
        } else if (expression.isObjectCreationExpr()) {
            return isUtilityType(expression.asObjectCreationExpr().getType());
        } else if (expression.isEnclosedExpr()) {
            return isUtilityInstance(expression.asEnclosedExpr().getInner(), catalog);
        } else if (expression.isCastExpr()) {
            return isUtilityType(expression.asCastExpr().getType());
        } else if (expression.isNameExpr()) {
            return isUtilityVariable(expression.asNameExpr().getNameAsString(), expression, catalog);
        } else if (expression.isTypeExpr() && expression.asTypeExpr().getType().isClassOrInterfaceType()) {
            // JavaParser also represents ambiguous bound references such as helper::end as a type expression.
            ClassOrInterfaceType type = expression.asTypeExpr().getType().asClassOrInterfaceType();
            return type.getScope().isEmpty() && isUtilityVariable(type.getNameAsString(), expression, catalog);
        } else if (expression.isFieldAccessExpr() && expression.asFieldAccessExpr().getScope().isThisExpr()) {
            return expression.findAncestor(ClassOrInterfaceDeclaration.class)
                .flatMap(owner -> owner.getFieldByName(expression.asFieldAccessExpr().getNameAsString()))
                .stream()
                .flatMap(field -> field.getVariables().stream())
                .anyMatch(
                    variable -> variable.getNameAsString().equals(expression.asFieldAccessExpr().getNameAsString())
                        && isUtilityType(variable.getType()));
        } else if (expression.isMethodCallExpr()) {
            MethodCallExpr call = expression.asMethodCallExpr();
            return catalog.getMethodsByName(call.getNameAsString())
                .stream()
                .anyMatch(method -> isUtilityType(method.getType()))
                && call.getScope()
                    .filter(scope -> isUtility(scope.toString()) || isUtilityInstance(scope, catalog))
                    .isPresent();
        }
        return false;
    }

    // Resolve the receiver forms emitted by templates without requiring a symbol solver or a runtime classpath.
    private boolean isUtilityVariable(String name, Node reference, ClassOrInterfaceDeclaration catalog) {
        Node child = reference;
        for (Node scope = reference; scope != null; child = scope, scope = scope.getParentNode().orElse(null)) {
            List<VariableDeclarator> variables = new ArrayList<>();
            List<Parameter> parameters = new ArrayList<>();
            if (scope instanceof BlockStmt) {
                for (Statement statement : ((BlockStmt) scope).getStatements()) {
                    if (statement.isExpressionStmt()
                        && statement.asExpressionStmt().getExpression().isVariableDeclarationExpr()) {
                        variables.addAll(
                            statement.asExpressionStmt().getExpression().asVariableDeclarationExpr().getVariables());
                    }
                    if (statement == child) {
                        break;
                    }
                }
            } else if (scope instanceof CallableDeclaration) {
                parameters.addAll(((CallableDeclaration<?>) scope).getParameters());
            } else if (scope instanceof LambdaExpr) {
                parameters.addAll(((LambdaExpr) scope).getParameters());
            } else if (scope instanceof CatchClause) {
                parameters.add(((CatchClause) scope).getParameter());
            } else if (scope instanceof ForEachStmt) {
                variables.addAll(((ForEachStmt) scope).getVariable().getVariables());
            } else if (scope instanceof ForStmt) {
                ((ForStmt) scope).getInitialization()
                    .stream()
                    .filter(Expression::isVariableDeclarationExpr)
                    .forEach(
                        initialization -> variables.addAll(initialization.asVariableDeclarationExpr().getVariables()));
            } else if (scope instanceof ClassOrInterfaceDeclaration) {
                ((ClassOrInterfaceDeclaration) scope).getFields()
                    .forEach(field -> variables.addAll(field.getVariables()));
            }
            for (VariableDeclarator variable : variables) {
                if (variable.getNameAsString().equals(name)) {
                    return isUtilityType(variable.getType())
                        || (variable.getType().isVarType()
                            && variable.getInitializer()
                                .filter(initializer -> isUtilityInstance(initializer, catalog))
                                .isPresent());
                }
            }
            for (Parameter parameter : parameters) {
                if (parameter.getNameAsString().equals(name)) {
                    return isUtilityType(parameter.getType());
                }
            }
        }
        return false;
    }

    private boolean isUtilityType(Type type) {
        return type.isClassOrInterfaceType() && isUtility(type.asClassOrInterfaceType().getNameWithScope());
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
