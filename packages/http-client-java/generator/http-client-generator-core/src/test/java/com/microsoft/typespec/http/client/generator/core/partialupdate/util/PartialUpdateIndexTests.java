// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.partialupdate.util;

import static com.github.javaparser.StaticJavaParser.parse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.modules.ModuleDeclaration;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

public class PartialUpdateIndexTests {
    @Test
    public void manualOverloadsDoNotRemoveReplacementsAndSuppressNewOverloads() {
        String generated = String.join("\n", "class Example {", "@Generated int field = 2;",
            "@Generated Example(String renamed) {}", "@Generated int changed(int renamed) { return 2; }",
            "@Generated int changed(String added) { return 3; }", "@Generated void added() {}", "}");
        String existing = String.join("\n", "class Example {", "int custom;", "@Generated int field = 1;",
            "int changed(boolean customized) { return 0; }", "@Generated Example(String oldName) {}",
            "@Generated int changed(int oldName) { return 1; }", "@Generated void removed() {}", "}");

        ClassOrInterfaceDeclaration merged = mergeClass(generated, existing);

        assertEquals(2, merged.getMethodsByName("changed").size());
        assertTrue(merged.getMethodsByName("changed").get(0).getParameter(0).getType().isPrimitiveType());
        assertEquals("renamed", merged.getMethodsByName("changed").get(1).getParameter(0).getNameAsString());
        assertTrue(merged.getMethodsByName("changed").get(1).getBody().orElseThrow().toString().contains("return 2;"));
        assertEquals("renamed", merged.getConstructors().get(0).getParameter(0).getNameAsString());
        assertEquals("2",
            merged.getFieldByName("field").orElseThrow().getVariable(0).getInitializer().orElseThrow().toString());
        assertTrue(merged.getMethodsByName("removed").isEmpty());
        assertEquals("custom", merged.getMember(0).asFieldDeclaration().getVariable(0).getNameAsString());
        assertEquals("added", merged.getMember(merged.getMembers().size() - 1).asMethodDeclaration().getNameAsString());
    }

    @Test
    public void memberKindsAndFirstFieldVariableKeepTheirExistingMatchingRules() {
        String generated = String.join("\n", "class Example {", "@Generated int first = 2, generated = 3;",
            "@Generated int Nested = 4;", "@Generated class Nested {}", "}");
        String existing
            = String.join("\n", "class Example {", "String first, custom;", "class Nested { int handwritten; }", "}");

        ClassOrInterfaceDeclaration merged = mergeClass(generated, existing);

        assertEquals(2, merged.getFields().size());
        assertTrue(merged.getFieldByName("custom").isPresent());
        assertFalse(merged.getFieldByName("generated").isPresent());
        assertTrue(merged.getFieldByName("Nested").isPresent());
        assertTrue(merged.getMembers()
            .stream()
            .filter(member -> member.isClassOrInterfaceDeclaration())
            .findFirst()
            .orElseThrow()
            .asClassOrInterfaceDeclaration()
            .getFieldByName("handwritten")
            .isPresent());
    }

    @Test
    public void largeMemberListsPreserveExistingOrderAndAppendNewMembers() {
        StringBuilder generated = new StringBuilder("class Example {\n");
        StringBuilder existing = new StringBuilder("class Example {\n");
        for (int i = 0; i < 500; i++) {
            generated.append("@Generated int value").append(i).append("() { return 2; }\n");
        }
        for (int i = 399; i >= 0; i--) {
            existing.append("@Generated int value").append(i).append("() { return 1; }\n");
        }
        ClassOrInterfaceDeclaration merged
            = mergeClass(generated.append('}').toString(), existing.append('}').toString());

        assertEquals(500, merged.getMethods().size());
        assertEquals("value399", merged.getMethods().get(0).getNameAsString());
        assertEquals("value0", merged.getMethods().get(399).getNameAsString());
        assertEquals("value400", merged.getMethods().get(400).getNameAsString());
        assertEquals("value499", merged.getMethods().get(499).getNameAsString());
        assertTrue(merged.getMethods()
            .stream()
            .allMatch(method -> method.getBody().orElseThrow().toString().contains("return 2;")));
    }

    @Test
    public void directiveTokensIgnoreWhitespaceButRetainModifiersCommentsAndExistingDuplicates() {
        String generated = "module example { requires java.logging; exports example.api; }";
        String existing
            = String.join("\n", "module example {", "requires   java.logging;", "requires transitive java.logging;",
                "exports example.api;", "exports example.extra;", "exports example.extra;", "uses example.Service;",
                "provides example.Service with example.Implementation;", "}");

        ModuleDeclaration merged
            = parse(PartialUpdateHandler.handlePartialUpdateForFile(generated, existing)).getModule().orElseThrow();
        List<String> directives
            = merged.getDirectives().stream().map(Object::toString).map(String::trim).collect(Collectors.toList());

        assertEquals(List.of("requires java.logging;", "requires transitive java.logging;", "exports example.api;",
            "exports example.extra;", "exports example.extra;", "uses example.Service;",
            "provides example.Service with example.Implementation;"), directives);
    }

    private static ClassOrInterfaceDeclaration mergeClass(String generated, String existing) {
        return parse(PartialUpdateHandler.handlePartialUpdateForFile(generated, existing)).getClassByName("Example")
            .orElseThrow();
    }
}
