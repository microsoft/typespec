// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2016 IBM Corporation and others.
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
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 415397 - [1.8][compiler] Type Annotations on wildcard type argument dropped
 *        Stephan Herrmann - Contribution for
 *							Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *							Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *							Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *							Bug 440462 - [null][compiler]NPE in EJC for erroneous null annotations
 *							Bug 441693 - [1.8][null] Bogus warning for type argument annotated with @NonNull
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

/**
 * Node to represent Wildcard
 */
public class Wildcard extends SingleTypeReference {

    public TypeReference bound;
    public int kind;

    public Wildcard(int kind) {
        super(WILDCARD_NAME, 0);
        this.kind = kind;
    }

    @Override
    public char[][] getTypeName() {
        switch (this.kind) {
            case 0:
                return new char[][] { WILDCARD_NAME };

            case 1:
                return new char[][] {
                    CharOperation.concat(WILDCARD_NAME, WILDCARD_EXTENDS,
                        CharOperation.concatWith(this.bound.getTypeName(), '.')) };

            default: // SUPER
                return new char[][] {
                    CharOperation.concat(WILDCARD_NAME, WILDCARD_SUPER,
                        CharOperation.concatWith(this.bound.getTypeName(), '.')) };
        }
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        if (this.annotations != null && this.annotations[0] != null) {
            printAnnotations(this.annotations[0], output);
            output.append(' ');
        }
        switch (this.kind) {
            case 0:
                output.append(WILDCARD_NAME);
                break;

            case 1:
                output.append(WILDCARD_NAME).append(WILDCARD_EXTENDS);
                this.bound.printExpression(0, output);
                break;

            default: // SUPER
                output.append(WILDCARD_NAME).append(WILDCARD_SUPER);
                this.bound.printExpression(0, output);
                break;
        }
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        if (visitor.visit(this)) {
            if (this.annotations != null) {
                Annotation[] typeAnnotations = this.annotations[0];
                for (int i = 0, length = typeAnnotations == null ? 0 : typeAnnotations.length; i < length; i++) {
                    typeAnnotations[i].traverse(visitor, scope);
                }
            }
            if (this.bound != null) {
                this.bound.traverse(visitor, scope);
            }
        }

    }

    @Override
    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.annotations != null) {
                Annotation[] typeAnnotations = this.annotations[0];
                for (int i = 0, length = typeAnnotations == null ? 0 : typeAnnotations.length; i < length; i++) {
                    typeAnnotations[i].traverse(visitor);
                }
            }
            if (this.bound != null) {
                this.bound.traverse(visitor);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
