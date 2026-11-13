// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2024 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.ClassScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.CompilationUnitScope;

/**
 * A visitor for iterating through the parse tree.
 */
public abstract class ASTVisitor {

    public void endVisit(ConstructorDeclaration constructorDeclaration) {
        // do nothing by default
    }

    public void endVisit(Initializer initializer) {
        // do nothing by default
    }

    public void endVisit(MethodDeclaration methodDeclaration) {
        // do nothing by default
    }

    public void endVisit() {
        // do nothing by default
    }

    public void endVisit(TypeDeclaration memberTypeDeclaration, ClassScope scope) {
        // do nothing by default
    }

    public boolean visit() {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(TypePattern anyPattern) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(Argument argument) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(Argument argument, ClassScope scope) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(ArrayAllocationExpression arrayAllocationExpression) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(ArrayQualifiedTypeReference arrayQualifiedTypeReference) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(ArrayTypeReference arrayTypeReference) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(Block block) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(BreakStatement breakStatement) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(ConstructorDeclaration constructorDeclaration) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(ContinueStatement continueStatement) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(DoStatement doStatement) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(FieldDeclaration fieldDeclaration) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(ForeachStatement forStatement) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(ForStatement forStatement) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(Initializer initializer) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(LocalDeclaration localDeclaration) {
        return true; // do nothing by default, keep traversing
    }

    /**
     * @since 3.1
     */
    public boolean visit(MarkerAnnotation annotation) {
        return true;
    }

    public boolean visit(MessageSend messageSend) {
        return true; // do nothing by default, keep traversing
    }

    public abstract boolean visit(MethodDeclaration methodDeclaration);

    /**
     * @since 3.1
     */
    public boolean visit(NormalAnnotation annotation) {
        return true;
    }

    public boolean visit(ParameterizedQualifiedTypeReference parameterizedQualifiedTypeReference) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(ParameterizedSingleTypeReference parameterizedSingleTypeReference) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(QualifiedNameReference qualifiedNameReference) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(QualifiedTypeReference qualifiedTypeReference) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(ReturnStatement returnStatement) {
        return true; // do nothing by default, keep traversing
    }

    /**
     * @since 3.1
     */
    public boolean visit(SingleMemberAnnotation annotation) {
        return true;
    }

    public boolean visit(SingleNameReference singleNameReference) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(SingleTypeReference singleTypeReference) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(SwitchStatement switchStatement) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(TypeDeclaration localTypeDeclaration, BlockScope scope) {
        return true; // do nothing by default, keep traversing
    }

    public abstract boolean visit(TypeDeclaration memberTypeDeclaration, ClassScope scope);

    public boolean visit(TypeDeclaration typeDeclaration, CompilationUnitScope scope) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(TypeParameter typeParameter) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(YieldStatement yieldStatement) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(WhileStatement whileStatement) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(Wildcard wildcard) {
        return true; // do nothing by default, keep traversing
    }

    public boolean visit(LambdaExpression lambdaExpression) {
        return true; // do nothing by default, keep traversing
    }
}
