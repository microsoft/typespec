// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.ToolFactory;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.ASTParser;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.CompilationUnitResolver;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.formatter.CodeFormatter;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import com.microsoft.typespec.http.client.generator.core.postprocessor.implementation.CodeFormatterUtil;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

public class VendoredGeneratorReachabilityTests {
    @Test
    public void disconnectedClassFileToolsAreNotShipped() {
        ClassLoader loader = CodeFormatterUtil.class.getClassLoader();
        String namespace = "com/microsoft/typespec/http/client/generator/core/implementation/";
        for (String name : List.of("org/eclipse/jdt/core/util/ClassFileBytesDisassembler",
            "org/eclipse/jdt/core/util/ClassFormatException", "org/eclipse/jdt/core/util/IClassFileReader")) {
            assertNull(loader.getResource(namespace + name + ".class"), name);
        }
    }

    @Test
    public void toolFactoryExposesOnlyTheGeneratorFormatterEntryPoint() {
        Set<String> methods = Arrays.stream(ToolFactory.class.getDeclaredMethods())
            .map(method -> method.getName())
            .collect(Collectors.toSet());
        assertEquals(Set.of("createCodeFormatter"), methods);
    }

    @Test
    public void formatterEntryPointDoesNotAcceptInvariantParameters() throws Exception {
        assertEquals(3,
            CodeFormatter.class.getDeclaredMethod("format", int.class, String.class, int.class).getParameterCount());
        assertThrows(NoSuchMethodException.class, () -> CodeFormatter.class.getDeclaredMethod("format", int.class,
            String.class, int.class, int.class, int.class, String.class));
    }

    @Test
    public void formatterParserDoesNotRetainWorkspaceState() {
        for (String field : List.of("project", "typeRoot", "workingCopyOwner", "unitResolver")) {
            assertThrows(NoSuchFieldException.class, () -> ASTParser.class.getDeclaredField(field), field);
        }
    }

    @Test
    public void parserDefaultsPreserveTheCompilerOverrides() {
        Map<String, String> options = CompilerOptions.getJavaCoreDefaultOptions();
        assertEquals("generate", options.get("org.eclipse.jdt.core.compiler.debug.localVariable"));
        assertEquals("preserve", options.get("org.eclipse.jdt.core.compiler.codegen.unusedLocal"));
        assertEquals("TODO,FIXME,XXX", options.get("org.eclipse.jdt.core.compiler.taskTags"));
        assertEquals("NORMAL,HIGH,NORMAL", options.get("org.eclipse.jdt.core.compiler.taskPriorities"));
        assertEquals("enabled", options.get("org.eclipse.jdt.core.compiler.taskCaseSensitive"));
        assertEquals("enabled", options.get("org.eclipse.jdt.core.compiler.doc.comment.support"));
        assertEquals("error", options.get("org.eclipse.jdt.core.compiler.problem.forbiddenReference"));
    }

    @Test
    public void formatterResolverDoesNotExtendTheUnusedCompilerImplementation() {
        assertEquals(Object.class, CompilationUnitResolver.class.getSuperclass());
    }
}
