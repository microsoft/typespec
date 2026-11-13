// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
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
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 365519 - editorial cleanup after bug 186342 and bug 365387
 *								Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 435570 - [1.8][null] @NonNullByDefault illegally tries to affect "throws E"
 *								Bug 438012 - [1.8][null] Bogus Warning: The nullness annotation is redundant with a default that applies to this location
 *								Bug 466713 - Null Annotations: NullPointerException using <int @Nullable []> as Type Param
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 409246 - [1.8][compiler] Type annotations on catch parameters not handled properly
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;

public class Argument extends LocalDeclaration {

    public Argument(char[] name, long posNom, TypeReference tr, int modifiers) {
        super(name, (int) (posNom >>> 32), (int) posNom);
        this.declarationSourceEnd = (int) posNom;
        this.modifiers = modifiers;
        this.type = tr;
        if (tr != null) {
            this.bits |= (tr.bits & 1048576);
        }
        this.bits |= (1073741824 | 4);
    }

    public Argument(char[] name, long posNom) {
        super(name, (int) (posNom >>> 32), (int) posNom);

        this.declarationSourceEnd = (int) posNom;
        this.modifiers = 0;
        this.type = null;
        {
        }
        this.bits |= (1073741824 | 4 | 2);
    }

    @Override
    public boolean isRecoveredFromLoneIdentifier() {
        return false;
    }

    /**
     */
    @Override
    public int getKind() {
        return (this.bits & 4) != 0 ? 5 : 4;
    }

    @Override
    public boolean isArgument() {
        return true;
    }

    public boolean isVarArgs() {
        return this.type != null && (this.type.bits & 16384) != 0;
    }

    public boolean hasElidedType() {
        return (this.bits & 2) != 0;
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        printIndent(indent, output);
        printModifiers(this.modifiers, output);
        if (this.annotations != null) {
            printAnnotations(this.annotations, output);
            output.append(' ');
        }

        if (this.type == null) {
            output.append("<no type> "); //$NON-NLS-1$
        } else {
            this.type.print(0, output).append(' ');
        }
        return output.append(this.name);
    }

    @Override
    public StringBuilder printStatement(int indent, StringBuilder output) {
        return print(indent, output).append(';');
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        if (visitor.visit(this)) {
            if (this.annotations != null) {
                int annotationsLength = this.annotations.length;
                for (int i = 0; i < annotationsLength; i++)
                    this.annotations[i].traverse(visitor, scope);
            }
            if (this.type != null)
                this.type.traverse(visitor, scope);
        }
        java.util.Objects.requireNonNull(visitor);
    }

    public void traverse(ASTVisitor visitor) {
        if (visitor.visit(this,
            ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.ClassScope) null))) {
            if (this.annotations != null) {
                int annotationsLength = this.annotations.length;
                for (int i = 0; i < annotationsLength; i++)
                    this.annotations[i].traverse(visitor);
            }
            if (this.type != null)
                this.type.traverse(visitor);
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
