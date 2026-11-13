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
 *     Stephan Herrmann - Contributions for
 *								bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 365519 - editorial cleanup after bug 186342 and bug 365387
 *								bug 368546 - [compiler][resource] Avoid remaining false positives found when compiling the Eclipse SDK
 *								bug 382353 - [1.8][compiler] Implementation property modifiers should be accepted on default methods.
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 416176 - [1.8][compiler][null] null type annotations cause grief on type variables
 *								Bug 438012 - [1.8][null] Bogus Warning: The nullness annotation is redundant with a default that applies to this location
 *								Bug 435805 - [1.8][compiler][null] Java 8 compiler does not recognize declaration style null annotations
 *								Bug 466713 - Null Annotations: NullPointerException using <int @Nullable []> as Type Param
 *     Jesper S Moller <jesper@selskabet.org> - Contributions for
 *								bug 378674 - "The method can be declared as static" is wrong
 *                              bug 413873 - Warning "Method can be static" on method referencing a non-static inner class
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Parser;

public class MethodDeclaration extends AbstractMethodDeclaration {

    public TypeReference returnType;
    public TypeParameter[] typeParameters;

    /**
     * MethodDeclaration constructor comment.
     */
    public MethodDeclaration(CompilationResult compilationResult) {
        super(compilationResult);
        this.bits |= 256; // Start with this assumption, will course correct during resolve.
    }

    @Override
    public void parseStatements(Parser parser, CompilationUnitDeclaration unit) {
        // fill up the method body with statement
        parser.parse(this, unit);
    }

    @Override
    public StringBuilder printReturnType(StringBuilder output) {
        if (this.returnType == null)
            return output;
        return this.returnType.printExpression(0, output).append(' ');
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        if (visitor.visit(this)) {
            if (this.javadoc != null) {
                this.javadoc.traverse(visitor,
                    ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
            if (this.annotations != null) {
                int annotationsLength = this.annotations.length;
                for (int i = 0; i < annotationsLength; i++)
                    this.annotations[i].traverse(visitor,
                        ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
            if (this.typeParameters != null) {
                int typeParametersLength = this.typeParameters.length;
                for (int i = 0; i < typeParametersLength; i++) {
                    this.typeParameters[i].traverse(visitor,
                        ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
                }
            }
            if (this.returnType != null)
                this.returnType.traverse(visitor,
                    ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            if (this.arguments != null) {
                int argumentLength = this.arguments.length;
                for (int i = 0; i < argumentLength; i++)
                    this.arguments[i].traverse(visitor,
                        ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
            if (this.thrownExceptions != null) {
                int thrownExceptionsLength = this.thrownExceptions.length;
                for (int i = 0; i < thrownExceptionsLength; i++)
                    this.thrownExceptions[i].traverse(visitor,
                        ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
            if (this.statements != null) {
                int statementsLength = this.statements.length;
                for (int i = 0; i < statementsLength; i++)
                    this.statements[i].traverse(visitor,
                        ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
        }
        visitor.endVisit(this);
    }

    @Override
    public TypeParameter[] typeParameters() {
        return this.typeParameters;
    }
}
