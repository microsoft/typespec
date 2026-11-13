// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.AST;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.TypeDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.EmptyStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.MethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.SingleNameReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.ClassScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Parser;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

public class VendoredUnusedCodeTests {
    @Test
    public void redundantVisitorAndParserHooksAreRemoved() {
        assertThrows(NoSuchMethodException.class,
            () -> ASTVisitor.class.getDeclaredMethod("endVisit", EmptyStatement.class, BlockScope.class));
        assertThrows(NoSuchMethodException.class, () -> Parser.class.getDeclaredMethod("consumeCompilationUnit"));
        assertThrows(NoSuchMethodException.class, () -> Parser.class.getDeclaredMethod("consumeArrayCreationHeader"));
        assertThrows(NoSuchMethodException.class,
            () -> Parser.class.getDeclaredMethod("actFromTokenOrSynthetic", int.class));
    }

    @Test
    public void inlinedEmptyVisitorHooksStillRejectNullReceivers() {
        EmptyStatement statement = new EmptyStatement(0, 0);
        assertThrows(NullPointerException.class, () -> statement.traverse(null, null));
        statement.traverse(new TestVisitor(), null);
    }

    @Test
    public void retainedVisitorOverridesAreInvoked() {
        List<String> events = new ArrayList<>();
        ASTVisitor visitor = new TestVisitor() {
            @Override
            public boolean visit(SingleNameReference reference) {
                events.add("visit");
                return true;
            }
        };
        new SingleNameReference("value".toCharArray(), 0L).traverse(visitor, (BlockScope) null);
        assertEquals(List.of("visit"), events);
    }

    @Test
    public void astEventAndModificationBookkeepingIsNotStoredOrShipped() {
        for (String field : List.of("eventHandler", "disableEvents", "modificationCount", "internalASTLock")) {
            assertThrows(NoSuchFieldException.class, () -> AST.class.getDeclaredField(field), field);
        }
        assertNull(AST.class.getClassLoader()
            .getResource(
                "com/microsoft/typespec/http/client/generator/core/implementation/org/eclipse/jdt/core/dom/NodeEventHandler.class"));
    }

    @Test
    public void lazyAstInitializationReusesTheMutableName() {
        AST ast = AST.newAST(false);
        TypeDeclaration declaration = ast.newTypeDeclaration();
        var name = declaration.getName();
        assertSame(name, declaration.getName());
        name.setIdentifier("Example");
        assertEquals("Example", declaration.getName().getIdentifier());
    }

    /** The production visitors implement the declaration callbacks; tests only need the default traversal. */
    private static class TestVisitor extends ASTVisitor {
        @Override
        public boolean visit(MethodDeclaration methodDeclaration) {
            return true;
        }

        @Override
        public boolean visit(
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeDeclaration memberTypeDeclaration,
            ClassScope scope) {
            return true;
        }
    }
}
