// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
package com.microsoft.typespec.http.client.generator.core.postprocessor.implementation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.AccessSpecifier;
import com.github.javaparser.ast.body.BodyDeclaration;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.ConstructorDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.InitializerDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

public class JavaMemberSorterTests {
    @Test
    public void sortsMembersByKindScopeAndName() {
        String source = String.join("\n", "class Sample {", "    private class ZebraClass {}",
            "    public static void zebraStatic() {}", "    protected int zebraField;",
            "    public interface ZebraInterface {}", "    public int zebraFieldPublic;",
            "    private static int zebraStaticField;", "    protected Sample(int value) {}",
            "    private void zebraMethod() {}", "    static {}", "    public static int zebraStaticFieldPublic;",
            "    public void zebraMethodPublic() {}", "    Sample() {}",
            "    protected static void zebraStaticProtected() {}", "    interface PackageInterface {}",
            "    private int zebraFieldPrivate;", "    protected interface ProtectedInterface {}",
            "    public class ZebraClassPublic {}", "    private Sample(boolean value) {}",
            "    static int zebraStaticFieldPackage;", "    void zebraMethodPackage() {}",
            "    protected class ProtectedClass {}", "    protected static int zebraStaticFieldProtected;",
            "    private interface ZebraInterfacePrivate {}", "    public Sample(String value) {}",
            "    private static void zebraStaticPrivate() {}", "    class PackageClass {}",
            "    protected void zebraMethodProtected() {}", "    public static void alphaStatic() {}",
            "    public void alphaMethodPublic() {}", "    public interface AlphaInterface {}",
            "    public class AlphaClass {}", "    private static int alphaStaticField;",
            "    private int alphaFieldPrivate;", "    private void alphaMethod() {}", "}");

        ClassOrInterfaceDeclaration type = parseType(JavaMemberSorter.sortMembers(source));

        assertEquals(List.of("field:private:static:alphaStaticField", "field:private:static:zebraStaticField",
            "field:package-private:static:zebraStaticFieldPackage", "field:protected:static:zebraStaticFieldProtected",
            "field:public:static:zebraStaticFieldPublic", "field:private:instance:alphaFieldPrivate",
            "field:private:instance:zebraFieldPrivate", "field:protected:instance:zebraField",
            "field:public:instance:zebraFieldPublic", "initializer:static", "constructor:private:boolean",
            "constructor:package-private:none", "constructor:protected:int", "constructor:public:String",
            "method:public:instance:alphaMethodPublic", "method:public:instance:zebraMethodPublic",
            "method:protected:instance:zebraMethodProtected", "method:package-private:instance:zebraMethodPackage",
            "method:private:instance:alphaMethod", "method:private:instance:zebraMethod",
            "method:public:static:alphaStatic", "method:public:static:zebraStatic",
            "method:protected:static:zebraStaticProtected", "method:private:static:zebraStaticPrivate",
            "interface:public:AlphaInterface", "interface:public:ZebraInterface",
            "interface:protected:ProtectedInterface", "interface:package-private:PackageInterface",
            "interface:private:ZebraInterfacePrivate", "class:public:AlphaClass", "class:public:ZebraClassPublic",
            "class:protected:ProtectedClass", "class:package-private:PackageClass", "class:private:ZebraClass"),
            describeMembers(type));
    }

    @Test
    public void keepsRelatedMethodsTogether() {
        String source = String.join("\n", "class Sample {", "    private boolean retry;", "    private String name;",
            "    private boolean isEnabled;", "    public void setEnabled(boolean enabled) {}",
            "    public static Sample fromXml(Object reader) { return null; }", "    public void readWithResponse() {}",
            "    public void setName(String name) {}", "    @Override public String zebraOverride() { return null; }",
            "    public static Sample fromJson(Object reader) { return null; }", "    public void readAll() {}",
            "    public void setRetry(boolean retry) {}", "    public void toXml(Object writer) {}",
            "    public void readAsync() {}", "    public String getName() { return name; }",
            "    public void readWithResponseAsync() {}", "    public void middle() {}",
            "    @Override public int alphaOverride() { return 0; }", "    public void read() {}",
            "    @Override protected int middleOverride() { return 0; }", "    public void searchWithResponse() {}",
            "    public void searchAll() {}", "    public boolean isEnabled() { return isEnabled; }",
            "    public boolean isRetry() { return retry; }", "    public void toJson(Object writer) {}",
            "    public static void utility() {}", "}");

        ClassOrInterfaceDeclaration type = parseType(JavaMemberSorter.sortMembers(source));

        assertEquals(
            List.of("alphaOverride", "zebraOverride", "middleOverride", "getName", "setName", "isEnabled", "setEnabled",
                "isRetry", "setRetry", "middle", "read", "readWithResponse", "readAll", "readAsync",
                "readWithResponseAsync", "searchAll", "searchWithResponse", "toJson", "fromJson", "toXml", "fromXml",
                "utility"),
            type.getMethods().stream().map(MethodDeclaration::getNameAsString).collect(Collectors.toList()));
    }

    @Test
    public void keepsCommentsWithMembers() {
        String source
            = String.join("\n", "class Sample {", "    // Zebra customization.", "", "    /** Zebra field. */",
                "    private int zebra;", "    /** Alpha field. */", "    private int alpha;", "}");

        String sortedSource = JavaMemberSorter.sortMembers(source);
        ClassOrInterfaceDeclaration type = parseType(sortedSource);

        assertEquals("alpha", type.getFields().get(0).getVariable(0).getNameAsString());
        assertEquals("Alpha field.",
            type.getFields().get(0).getJavadocComment().orElseThrow().parse().getDescription().toText());
        assertEquals("zebra", type.getFields().get(1).getVariable(0).getNameAsString());
        assertEquals("Zebra field.",
            type.getFields().get(1).getJavadocComment().orElseThrow().parse().getDescription().toText());
        assertTrue(sortedSource.indexOf("private int alpha") < sortedSource.indexOf("// Zebra customization."));
        assertTrue(sortedSource.indexOf("// Zebra customization.") < sortedSource.indexOf("private int zebra"));
    }

    @Test
    public void preservesTrailingComments() {
        String source = String.join("\n", "class Sample {", "    private int zebra; // Zebra trailing comment.",
            "    private int alpha;", "    // End comment.", "}");

        String sortedSource = JavaMemberSorter.sortMembers(source);

        assertTrue(sortedSource.indexOf("private int alpha") < sortedSource.indexOf("private int zebra"));
        assertTrue(sortedSource.indexOf("private int zebra") < sortedSource.indexOf("// Zebra trailing comment."));
        assertTrue(sortedSource.indexOf("// Zebra trailing comment.") < sortedSource.indexOf("// End comment."));
    }

    @Test
    public void sortsJavaFilesAndLeavesOtherFilesUntouched() {
        Map<String, String> files = new HashMap<>();
        files.put("Sample.java", "class Sample { private int zebra; private int alpha; }");
        files.put("notes.txt", "unchanged");

        JavaMemberSorter.sortMembers(files);

        assertEquals(List.of("alpha", "zebra"),
            parseType(files.get("Sample.java")).getFields()
                .stream()
                .map(field -> field.getVariable(0).getNameAsString())
                .collect(Collectors.toList()));
        assertEquals("unchanged", files.get("notes.txt"));
    }

    @Test
    public void sortsMembersInWrappedTypes() {
        String source = String.join("\n", "class Outer {", "    class Inner {", "        private int zebra;",
            "        private int alpha;", "        private void zebra() {}", "        private void alpha() {}", "    }",
            "    interface Service {", "        void zebra();", "        void alpha();", "    }", "}");

        ClassOrInterfaceDeclaration outer = parseType(JavaMemberSorter.sortMembers(source));
        ClassOrInterfaceDeclaration inner = outer.getMembers().get(1).asClassOrInterfaceDeclaration();
        ClassOrInterfaceDeclaration service = outer.getMembers().get(0).asClassOrInterfaceDeclaration();

        assertEquals(List.of("alpha", "zebra"),
            inner.getFields()
                .stream()
                .map(field -> field.getVariable(0).getNameAsString())
                .collect(Collectors.toList()));
        assertEquals(List.of("alpha", "zebra"),
            inner.getMethods().stream().map(MethodDeclaration::getNameAsString).collect(Collectors.toList()));
        assertEquals(List.of("alpha", "zebra"),
            service.getMethods().stream().map(MethodDeclaration::getNameAsString).collect(Collectors.toList()));
    }

    private static ClassOrInterfaceDeclaration parseType(String source) {
        return StaticJavaParser.parse(source).getType(0).asClassOrInterfaceDeclaration();
    }

    private static List<String> describeMembers(ClassOrInterfaceDeclaration type) {
        return type.getMembers().stream().map(JavaMemberSorterTests::describeMember).collect(Collectors.toList());
    }

    private static String describeMember(BodyDeclaration<?> member) {
        if (member.isFieldDeclaration()) {
            FieldDeclaration field = member.asFieldDeclaration();
            return "field:" + access(field.getAccessSpecifier()) + ":" + (field.isStatic() ? "static" : "instance")
                + ":" + field.getVariable(0).getNameAsString();
        }
        if (member.isInitializerDeclaration()) {
            InitializerDeclaration initializer = member.asInitializerDeclaration();
            return "initializer:" + (initializer.isStatic() ? "static" : "instance");
        }
        if (member.isConstructorDeclaration()) {
            ConstructorDeclaration constructor = member.asConstructorDeclaration();
            String parameterType
                = constructor.getParameters().isEmpty() ? "none" : constructor.getParameter(0).getTypeAsString();
            return "constructor:" + access(constructor.getAccessSpecifier()) + ":" + parameterType;
        }
        if (member.isMethodDeclaration()) {
            MethodDeclaration method = member.asMethodDeclaration();
            return "method:" + access(method.getAccessSpecifier()) + ":" + (method.isStatic() ? "static" : "instance")
                + ":" + method.getNameAsString();
        }
        if (member.isClassOrInterfaceDeclaration()) {
            ClassOrInterfaceDeclaration type = member.asClassOrInterfaceDeclaration();
            return (type.isInterface() ? "interface:" : "class:") + access(type.getAccessSpecifier()) + ":"
                + type.getNameAsString();
        }
        throw new IllegalArgumentException("Unexpected member: " + member);
    }

    private static String access(AccessSpecifier accessSpecifier) {
        return accessSpecifier == AccessSpecifier.NONE ? "package-private" : accessSpecifier.asString();
    }
}
