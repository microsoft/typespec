// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2020 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class RecordComponent extends AbstractVariableDeclaration {

    public RecordComponent(char[] name, int sourceStart, int sourceEnd) {
        this.name = name;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
        this.declarationEnd = sourceEnd;
    }

    public RecordComponent(char[] name, long posNom, TypeReference tr, int modifiers) {
        this(name, (int) (posNom >>> 32), (int) posNom);
        this.declarationSourceEnd = (int) posNom;
        this.modifiers = modifiers;
        this.type = tr;
        if (tr != null) {
            this.bits |= (tr.bits & 1048576);
        }
    }

    /**
     */
    @Override
    public int getKind() {
        return 7;
    }

    public boolean isVarArgs() {
        return this.type != null && (this.type.bits & 16384) != 0;
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
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.annotations != null) {
                int annotationsLength = this.annotations.length;
                for (int i = 0; i < annotationsLength; i++)
                    this.annotations[i].traverse(visitor, scope);
            }
            this.type.traverse(visitor, scope);
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
