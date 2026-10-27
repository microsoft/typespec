// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.partialupdate.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.github.javaparser.Range;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.comments.BlockComment;
import com.github.javaparser.ast.comments.LineComment;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public class PartialUpdatePrinterTests {
    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void matchesDefaultPrinterIncludingCommentsAndLineEndings(boolean crlf) {
        String source = String.join("\n", "// Header", "package example;", "class Example {", "// Before first", "",
            "int first;", "/* Between */", "", "/** Method documentation */", "void method() {", "// In body", "",
            "int local = 1;", "// End of body", "}", "class Nested {", "// Nested orphan", "", "int nested;",
            "// Nested end", "}", "// End of class", "}", "// End of file", "");
        if (crlf) {
            source = source.replace("\n", "\r\n");
        }
        CompilationUnit unit = StaticJavaParser.parse(source);
        String expected = unit.toString();

        assertEquals(expected, PartialUpdatePrinter.print(unit));
        assertEquals(expected, PartialUpdatePrinter.print(unit));
    }

    @Test
    public void matchesDefaultPrinterWithEqualAndMissingRangesAndDuplicateMembers() {
        CompilationUnit unit = StaticJavaParser.parse("class Example { int value; }");
        ClassOrInterfaceDeclaration type = unit.getClassByName("Example").orElseThrow();
        type.addMember(type.getMember(0).clone());
        LineComment equalRange = new LineComment(" equal range");
        equalRange.setRange(Range.range(1, 1, 1, 1));
        type.addOrphanComment(equalRange);
        type.addOrphanComment(new BlockComment(" missing range "));
        type.addField("int", "added");
        String expected = unit.toString();

        assertEquals(expected, PartialUpdatePrinter.print(unit));
    }

    @Test
    public void matchesDefaultPrinterForModulesAndPackageDocumentation() {
        for (String source : new String[] {
            "// Header\nmodule example {\n// Before\n\nrequires java.logging;\n// End\n}\n",
            "/** Package documentation. */\npackage example;\n// End\n" }) {
            CompilationUnit unit = StaticJavaParser.parse(source);
            String expected = unit.toString();
            assertEquals(expected, PartialUpdatePrinter.print(unit));
        }
    }

    @Test
    public void signatureCachingPreservesErasureVarargsAndTypeAnnotations() {
        String generated = "class Example { @Generated Example(String... renamed) {} "
            + "@Generated void update(java.util.List<String> renamed, @Marker String[] ids) {} }";
        String existing = "class Example { @Generated Example(String[] old) {} "
            + "@Generated void update(java.util.List<Integer> old, String... ids) {} }";

        ClassOrInterfaceDeclaration merged
            = StaticJavaParser.parse(PartialUpdateHandler.handlePartialUpdateForFile(generated, existing))
                .getClassByName("Example")
                .orElseThrow();

        assertEquals(1, merged.getConstructors().size());
        assertTrue(merged.getConstructors().get(0).getParameter(0).isVarArgs());
        assertEquals(1, merged.getMethodsByName("update").size());
        assertEquals("renamed", merged.getMethodsByName("update").get(0).getParameter(0).getNameAsString());
        assertTrue(merged.getMethodsByName("update").get(0).getParameter(1).isAnnotationPresent("Marker"));
    }

    @Test
    public void concurrentPrintsDoNotShareCommentIndexes() {
        String source = "class Example {\n// Orphan\n\nint field;\n// End\n}\n";
        String expected = StaticJavaParser.parse(source).toString();
        java.util.stream.IntStream.range(0, 8)
            .parallel()
            .forEach(ignored -> assertEquals(expected, PartialUpdatePrinter.print(StaticJavaParser.parse(source))));
    }
}
