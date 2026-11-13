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
 *     							bug 319201 - [null] no warning when unboxing SingleNameReference causes NPE
 *     							bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 368546 - [compiler][resource] Avoid remaining false positives found when compiling the Eclipse SDK
 *								bug 370639 - [compiler][resource] restore the default for resource leak warnings
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 388996 - [compiler][resource] Incorrect 'potential resource leak'
 *								bug 395977 - [compiler][resource] Resource leak warning behavior possibly incorrect for anonymous inner class
 *								bug 403147 - [compiler][null] FUP of bug 400761: consolidate interaction between unboxing, NPE, and deferred checking
 *								Bug 415850 - [1.8] Ensure RunJDTCoreTests can cope with null annotations enabled
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *								Bug 416267 - NPE in QualifiedAllocationExpression.resolveType
 *								Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *								Bug 424415 - [1.8][compiler] Eventual resolution of ReferenceExpression is not seen to be happening.
 *								Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *     Jesper S Moller <jesper@selskabet.org> - Contributions for
 *								bug 378674 - "The method can be declared as static" is wrong
 *     Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *                          Bug 409245 - [1.8][compiler] Type annotations dropped when call is routed through a synthetic bridge method
 *     Till Brychcy - Contributions for
 *     							bug 413460 - NonNullByDefault is not inherited to Constructors when accessed via Class File
 ******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

/**
 * Variation on allocation, where can optionally be specified any of: - leading enclosing instance - trailing anonymous
 * type - generic type arguments for generic constructor invocation
 */
public class QualifiedAllocationExpression extends AllocationExpression {

    // qualification may be on both side
    public Expression enclosingInstance;
    public TypeDeclaration anonymousType;

    public QualifiedAllocationExpression() {
        // for subtypes
    }

    public QualifiedAllocationExpression(TypeDeclaration anonymousType) {
        this.anonymousType = anonymousType;
        anonymousType.allocation = this;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        if (this.enclosingInstance != null)
            this.enclosingInstance.printExpression(0, output).append('.');
        super.printExpression(0, output);
        if (this.anonymousType != null) {
            this.anonymousType.print(indent, output);
        }
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.enclosingInstance != null)
                this.enclosingInstance.traverse(visitor, scope);
            if (this.typeArguments != null) {
                for (TypeReference typeArgument : this.typeArguments) {
                    typeArgument.traverse(visitor, scope);
                }
            }
            if (this.type != null) // case of enum constant
                this.type.traverse(visitor, scope);
            if (this.arguments != null) {
                int argumentsLength = this.arguments.length;
                for (int i = 0; i < argumentsLength; i++)
                    this.arguments[i].traverse(visitor, scope);
            }
            if (this.anonymousType != null)
                this.anonymousType.traverse(visitor, scope);
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
