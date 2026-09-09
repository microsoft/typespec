// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.postprocessor.implementation;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.AccessSpecifier;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.BodyDeclaration;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.TypeDeclaration;
import com.github.javaparser.ast.comments.Comment;
import com.github.javaparser.ast.visitor.GenericVisitor;
import com.github.javaparser.ast.visitor.VoidVisitor;
import com.github.javaparser.printer.DefaultPrettyPrinterVisitor;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Sorts members in Java classes and interfaces.
 */
public final class JavaMemberSorter {
    private static final String WITH_RESPONSE = "WithResponse";

    private JavaMemberSorter() {
    }

    /**
     * Sorts members in all Java files in the given map.
     *
     * @param javaFiles Java file paths mapped to their contents.
     */
    public static void sortMembers(Map<String, String> javaFiles) {
        javaFiles.replaceAll(
            (fileName, fileContents) -> fileName.endsWith(".java") ? sortMembers(fileContents) : fileContents);
    }

    /**
     * Sorts members in all classes and interfaces in the given Java source.
     *
     * @param javaFile The Java source.
     * @return The Java source with sorted members.
     */
    public static String sortMembers(String javaFile) {
        CompilationUnit compilationUnit = StaticJavaParser.parse(javaFile);
        List<ClassOrInterfaceDeclaration> declarations = compilationUnit.findAll(ClassOrInterfaceDeclaration.class);
        if (declarations.isEmpty()) {
            return javaFile;
        }

        declarations.forEach(JavaMemberSorter::sortMembers);
        return compilationUnit.toString();
    }

    private static void sortMembers(ClassOrInterfaceDeclaration declaration) {
        MemberCommentAssociations commentAssociations = getMemberComments(declaration);
        declaration.getMembers().sort(new MemberComparator(declaration));
        if (!commentAssociations.trailing.isEmpty() && !declaration.getMembers().isEmpty()) {
            BodyDeclaration<?> lastMember = declaration.getMembers().get(declaration.getMembers().size() - 1);
            commentAssociations.members.computeIfAbsent(lastMember, ignored -> new MemberComments()).trailing
                .addAll(commentAssociations.trailing);
        }

        for (int i = 0; i < declaration.getMembers().size(); i++) {
            BodyDeclaration<?> member = declaration.getMembers().get(i);
            MemberComments comments = commentAssociations.members.get(member);
            if (comments != null) {
                declaration.getMembers().set(i, new CommentedBodyDeclaration<>(member, comments));
            }
        }
    }

    private static MemberCommentAssociations getMemberComments(ClassOrInterfaceDeclaration declaration) {
        // Orphan comments otherwise print using their stale source positions after members move.
        MemberCommentAssociations commentAssociations = new MemberCommentAssociations();
        List<BodyDeclaration<?>> members = declaration.getMembers();

        for (BodyDeclaration<?> member : members) {
            member.getComment().ifPresent(comment -> {
                if (member.getEnd().isPresent()
                    && comment.getBegin().isPresent()
                    && member.getEnd().get().line == comment.getBegin().get().line) {
                    commentAssociations.members.computeIfAbsent(member, ignored -> new MemberComments()).trailing
                        .add(comment);
                    member.removeComment();
                }
            });
        }

        for (Comment comment : new ArrayList<>(declaration.getOrphanComments())) {
            if (comment.getBegin().isEmpty() || comment.getEnd().isEmpty()) {
                continue;
            }

            BodyDeclaration<?> previousMember = null;
            BodyDeclaration<?> nextMember = null;
            for (BodyDeclaration<?> member : members) {
                if (member.getBegin().isEmpty() || member.getEnd().isEmpty()) {
                    continue;
                }
                if (member.getEnd().get().isBefore(comment.getBegin().get())) {
                    previousMember = member;
                } else if (member.getBegin().get().isAfter(comment.getEnd().get())) {
                    nextMember = member;
                    break;
                } else {
                    previousMember = null;
                    nextMember = null;
                    break;
                }
            }

            boolean trailsPreviousMember
                = previousMember != null && previousMember.getEnd().get().line == comment.getBegin().get().line;
            BodyDeclaration<?> associatedMember = trailsPreviousMember ? previousMember : nextMember;
            if (associatedMember == null && previousMember != null) {
                commentAssociations.trailing.add(comment);
                declaration.removeOrphanComment(comment);
                continue;
            }
            if (associatedMember == null) {
                continue;
            }

            MemberComments comments
                = commentAssociations.members.computeIfAbsent(associatedMember, ignored -> new MemberComments());
            if (trailsPreviousMember || nextMember == null) {
                comments.trailing.add(comment);
            } else {
                comments.leading.add(comment);
            }
            declaration.removeOrphanComment(comment);
        }

        return commentAssociations;
    }

    private static final class MemberComparator implements Comparator<BodyDeclaration<?>> {
        private final ClassOrInterfaceDeclaration declaringType;
        private final Map<MethodDeclaration, MethodSortKey> methodSortKeys = new IdentityHashMap<>();
        private final Set<String> overrideMethodFamilies = new HashSet<>();

        private MemberComparator(ClassOrInterfaceDeclaration declaringType) {
            this.declaringType = declaringType;
            createMethodSortKeys();
        }

        @Override
        public int compare(BodyDeclaration<?> left, BodyDeclaration<?> right) {
            MemberGroup leftGroup = getMemberGroup(left);
            MemberGroup rightGroup = getMemberGroup(right);

            int comparison = Integer.compare(leftGroup.ordinal(), rightGroup.ordinal());
            if (comparison != 0) {
                return comparison;
            }

            comparison = Integer.compare(getOverrideRank(left), getOverrideRank(right));
            if (comparison != 0) {
                return comparison;
            }

            comparison = Integer.compare(getScopeRank(left, leftGroup), getScopeRank(right, rightGroup));
            if (comparison != 0) {
                return comparison;
            }

            MethodSortKey leftMethodKey = getMethodSortKey(left);
            MethodSortKey rightMethodKey = getMethodSortKey(right);
            String leftName = leftMethodKey == null ? getName(left) : leftMethodKey.sortName;
            String rightName = rightMethodKey == null ? getName(right) : rightMethodKey.sortName;
            comparison = compareNames(leftName, rightName);
            if (comparison != 0) {
                return comparison;
            }

            if (leftMethodKey != null && rightMethodKey != null) {
                comparison = Integer.compare(leftMethodKey.familyRank, rightMethodKey.familyRank);
                if (comparison != 0) {
                    return comparison;
                }

                comparison = Integer.compare(leftMethodKey.methodRank, rightMethodKey.methodRank);
                if (comparison != 0) {
                    return comparison;
                }
            }

            comparison = compareNames(getName(left), getName(right));
            return comparison != 0 ? comparison : compareNames(getSignature(left), getSignature(right));
        }

        private void createMethodSortKeys() {
            List<MethodDeclaration> methods = declaringType.getMethods();
            Map<String, String> fieldNames = getFieldNames();
            Map<MethodDeclaration, Accessor> accessors = new IdentityHashMap<>();
            Map<String, String> getterNames = new HashMap<>();
            Map<String, String> serviceMethodNames = new HashMap<>();
            Set<String> methodNames = methods.stream()
                .map(MethodDeclaration::getNameAsString)
                .map(JavaMemberSorter::normalizeName)
                .collect(Collectors.toSet());

            for (MethodDeclaration method : methods) {
                Accessor accessor = getAccessor(method, fieldNames);
                if (accessor != null) {
                    accessors.put(method, accessor);
                    if (accessor.getter) {
                        getterNames.merge(accessor.fieldName, method.getNameAsString(),
                            JavaMemberSorter::alphabeticallyFirst);
                    }
                }

                String serviceMethodName = getServiceMethodName(method.getNameAsString());
                if (serviceMethodName != null && methodNames.contains(normalizeName(serviceMethodName))) {
                    serviceMethodNames.put(normalizeName(serviceMethodName), serviceMethodName);
                }
            }

            for (MethodDeclaration method : methods) {
                String methodName = method.getNameAsString();
                int serializationRank = getSerializationRank(methodName);
                MethodSortKey sortKey;
                if (serializationRank >= 0) {
                    sortKey = new MethodSortKey("", null, 0, serializationRank);
                } else {
                    Accessor accessor = accessors.get(method);
                    if (accessor != null && getterNames.containsKey(accessor.fieldName)) {
                        String family = "accessor:" + accessor.fieldName;
                        sortKey = new MethodSortKey(getterNames.get(accessor.fieldName), family, 0,
                            accessor.getter ? 0 : 1);
                    } else {
                        String serviceMethodName = getServiceMethodName(methodName);
                        boolean withResponse = serviceMethodName != null
                            && serviceMethodNames.containsKey(normalizeName(serviceMethodName));
                        if (!withResponse) {
                            serviceMethodName = null;
                        }
                        if (!withResponse && serviceMethodNames.containsKey(normalizeName(methodName))) {
                            serviceMethodName = serviceMethodNames.get(normalizeName(methodName));
                        }

                        if (serviceMethodName != null) {
                            String family = "service:" + normalizeName(serviceMethodName);
                            sortKey = new MethodSortKey(serviceMethodName, family, 0, withResponse ? 1 : 0);
                        } else {
                            sortKey = new MethodSortKey(methodName, null, 1, 0);
                        }
                    }
                }

                methodSortKeys.put(method, sortKey);
                if (hasOverrideAnnotation(method) && sortKey.family != null) {
                    overrideMethodFamilies.add(sortKey.family);
                }
            }
        }

        private Map<String, String> getFieldNames() {
            Map<String, String> fieldNames = new HashMap<>();
            declaringType.getFields()
                .stream()
                .flatMap(field -> field.getVariables().stream())
                .map(variable -> variable.getNameAsString())
                .forEach(fieldName -> fieldNames.put(normalizeName(fieldName), fieldName));
            return fieldNames;
        }

        private MemberGroup getMemberGroup(BodyDeclaration<?> member) {
            if (member.isFieldDeclaration()) {
                return isStatic(member.asFieldDeclaration()) ? MemberGroup.STATIC_FIELD : MemberGroup.INSTANCE_FIELD;
            }
            if (member.isInitializerDeclaration()) {
                return member.asInitializerDeclaration().isStatic()
                    ? MemberGroup.STATIC_INITIALIZER
                    : MemberGroup.CONSTRUCTOR;
            }
            if (member.isConstructorDeclaration()) {
                return MemberGroup.CONSTRUCTOR;
            }
            if (member.isMethodDeclaration()) {
                MethodDeclaration method = member.asMethodDeclaration();
                if (getSerializationRank(method.getNameAsString()) >= 0) {
                    return MemberGroup.SERIALIZATION_METHOD;
                }
                return method.isStatic() ? MemberGroup.STATIC_METHOD : MemberGroup.INSTANCE_METHOD;
            }
            if (member.isClassOrInterfaceDeclaration() && member.asClassOrInterfaceDeclaration().isInterface()) {
                return MemberGroup.INTERFACE;
            }
            if (member instanceof TypeDeclaration<?>) {
                return MemberGroup.CLASS;
            }
            return MemberGroup.OTHER;
        }

        private boolean isStatic(FieldDeclaration field) {
            return field.isStatic() || declaringType.isInterface();
        }

        private int getScopeRank(BodyDeclaration<?> member, MemberGroup memberGroup) {
            AccessSpecifier accessSpecifier = getAccessSpecifier(member);
            if (memberGroup == MemberGroup.STATIC_FIELD
                || memberGroup == MemberGroup.INSTANCE_FIELD
                || memberGroup == MemberGroup.STATIC_INITIALIZER
                || memberGroup == MemberGroup.CONSTRUCTOR) {
                switch (accessSpecifier) {
                    case PRIVATE:
                        return 0;

                    case NONE:
                        return 1;

                    case PROTECTED:
                        return 2;

                    case PUBLIC:
                    default:
                        return 3;
                }
            }

            switch (accessSpecifier) {
                case PUBLIC:
                    return 0;

                case PROTECTED:
                    return 1;

                case NONE:
                    return 2;

                case PRIVATE:
                default:
                    return 3;
            }
        }

        private AccessSpecifier getAccessSpecifier(BodyDeclaration<?> member) {
            AccessSpecifier accessSpecifier;
            if (member.isFieldDeclaration()) {
                accessSpecifier = member.asFieldDeclaration().getAccessSpecifier();
            } else if (member.isConstructorDeclaration()) {
                accessSpecifier = member.asConstructorDeclaration().getAccessSpecifier();
            } else if (member.isMethodDeclaration()) {
                accessSpecifier = member.asMethodDeclaration().getAccessSpecifier();
            } else if (member instanceof TypeDeclaration<?>) {
                accessSpecifier = ((TypeDeclaration<?>) member).getAccessSpecifier();
            } else {
                accessSpecifier = AccessSpecifier.NONE;
            }

            if (accessSpecifier == AccessSpecifier.NONE
                && declaringType.isInterface()
                && (member.isFieldDeclaration()
                    || member.isMethodDeclaration()
                    || member instanceof TypeDeclaration<?>)) {
                return AccessSpecifier.PUBLIC;
            }
            return accessSpecifier;
        }

        private int getOverrideRank(BodyDeclaration<?> member) {
            if (!member.isMethodDeclaration()) {
                return 0;
            }

            MethodDeclaration method = member.asMethodDeclaration();
            MethodSortKey sortKey = methodSortKeys.get(method);
            if (sortKey == null || getSerializationRank(method.getNameAsString()) >= 0) {
                return 0;
            }

            return hasOverrideAnnotation(method)
                || (sortKey.family != null && overrideMethodFamilies.contains(sortKey.family)) ? 0 : 1;
        }

        private MethodSortKey getMethodSortKey(BodyDeclaration<?> member) {
            return member.isMethodDeclaration() ? methodSortKeys.get(member.asMethodDeclaration()) : null;
        }
    }

    private static Accessor getAccessor(MethodDeclaration method, Map<String, String> fieldNames) {
        String methodName = method.getNameAsString();
        boolean getter = method.getParameters().isEmpty()
            && ((methodName.startsWith("get") && methodName.length() > 3)
                || (methodName.startsWith("is") && methodName.length() > 2));
        boolean setter = method.getParameters().size() == 1 && methodName.startsWith("set") && methodName.length() > 3;
        if (!getter && !setter) {
            return null;
        }

        int prefixLength = setter || methodName.startsWith("get") ? 3 : 2;
        String accessorSuffix = methodName.substring(prefixLength);
        String fieldName = fieldNames.get(normalizeName(accessorSuffix));
        if (fieldName == null && (setter || methodName.startsWith("is"))) {
            fieldName = fieldNames.get(normalizeName("is" + accessorSuffix));
        }
        return fieldName == null ? null : new Accessor(normalizeName(fieldName), getter);
    }

    private static String getServiceMethodName(String methodName) {
        int withResponseIndex = methodName.lastIndexOf(WITH_RESPONSE);
        if (withResponseIndex <= 0) {
            return null;
        }

        String suffix = methodName.substring(withResponseIndex + WITH_RESPONSE.length());
        if (!suffix.isEmpty() && !"Async".equals(suffix) && !"Sync".equals(suffix)) {
            return null;
        }

        return methodName.substring(0, withResponseIndex) + suffix;
    }

    private static int getSerializationRank(String methodName) {
        switch (methodName) {
            case "toJson":
                return 0;

            case "fromJson":
                return 1;

            case "toXml":
                return 2;

            case "fromXml":
                return 3;

            default:
                return -1;
        }
    }

    private static boolean hasOverrideAnnotation(MethodDeclaration method) {
        return method.getAnnotations()
            .stream()
            .anyMatch(annotation -> annotation.getNameAsString().equals("Override")
                || annotation.getNameAsString().endsWith(".Override"));
    }

    private static String getName(BodyDeclaration<?> member) {
        if (member.isFieldDeclaration()) {
            return member.asFieldDeclaration()
                .getVariables()
                .stream()
                .map(variable -> variable.getNameAsString())
                .collect(Collectors.joining(","));
        }
        if (member.isConstructorDeclaration()) {
            return member.asConstructorDeclaration().getNameAsString();
        }
        if (member.isMethodDeclaration()) {
            return member.asMethodDeclaration().getNameAsString();
        }
        if (member instanceof TypeDeclaration<?>) {
            return ((TypeDeclaration<?>) member).getNameAsString();
        }
        return "";
    }

    private static String getSignature(BodyDeclaration<?> member) {
        return member.isCallableDeclaration() ? member.asCallableDeclaration().getSignature().toString() : "";
    }

    private static int compareNames(String left, String right) {
        int comparison = String.CASE_INSENSITIVE_ORDER.compare(left, right);
        return comparison != 0 ? comparison : left.compareTo(right);
    }

    private static String alphabeticallyFirst(String left, String right) {
        return compareNames(left, right) <= 0 ? left : right;
    }

    private static String normalizeName(String name) {
        return name.toLowerCase(Locale.ROOT);
    }

    private enum MemberGroup {
        STATIC_FIELD,
        INSTANCE_FIELD,
        STATIC_INITIALIZER,
        CONSTRUCTOR,
        INSTANCE_METHOD,
        SERIALIZATION_METHOD,
        STATIC_METHOD,
        INTERFACE,
        CLASS,
        OTHER
    }

    private static final class Accessor {
        private final String fieldName;
        private final boolean getter;

        private Accessor(String fieldName, boolean getter) {
            this.fieldName = fieldName;
            this.getter = getter;
        }
    }

    private static final class MethodSortKey {
        private final String sortName;
        private final String family;
        private final int familyRank;
        private final int methodRank;

        private MethodSortKey(String sortName, String family, int familyRank, int methodRank) {
            this.sortName = sortName;
            this.family = family;
            this.familyRank = familyRank;
            this.methodRank = methodRank;
        }
    }

    private static final class MemberComments {
        private final List<Comment> leading = new ArrayList<>();
        private final List<Comment> trailing = new ArrayList<>();
    }

    private static final class MemberCommentAssociations {
        private final Map<BodyDeclaration<?>, MemberComments> members = new IdentityHashMap<>();
        private final List<Comment> trailing = new ArrayList<>();
    }

    private static final class CommentedBodyDeclaration<T extends BodyDeclaration<?>> extends BodyDeclaration<T> {
        private final BodyDeclaration<?> wrapped;
        private final MemberComments comments;

        private CommentedBodyDeclaration(BodyDeclaration<?> wrapped, MemberComments comments) {
            this.wrapped = wrapped;
            this.comments = comments;
        }

        @Override
        public <R, A> R accept(GenericVisitor<R, A> visitor, A arg) {
            return wrapped.accept(visitor, arg);
        }

        @Override
        public <A> void accept(VoidVisitor<A> visitor, A arg) {
            if (visitor instanceof DefaultPrettyPrinterVisitor) {
                comments.leading.forEach(comment -> comment.accept(visitor, arg));
                wrapped.accept(visitor, arg);
                comments.trailing.forEach(comment -> comment.accept(visitor, arg));
            } else {
                wrapped.accept(visitor, arg);
            }
        }
    }
}
