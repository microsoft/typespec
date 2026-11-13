// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2023 IBM Corporation and others.
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
 *     Stephan Herrmann - Contribution for
 *								Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *								Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

public abstract class AbstractVariableDeclaration extends Statement {
    public int declarationEnd;
    /**
     * For local declarations (outside of for statement initialization) and field declarations, the declarationSourceEnd
     * covers multiple locals if any. For local declarations inside for statement initialization, this is not the case.
     */
    public int declarationSourceEnd;
    public int declarationSourceStart;
    public Expression initialization;
    public int modifiers;
    public int modifiersSourceStart;
    public Annotation[] annotations;

    public char[] name;

    public TypeReference type;

    /**
     * Returns the constant kind of this variable declaration
     */
    public abstract int getKind();

    public boolean isArgument() {
        return false;
    }

    @Override
    public StringBuilder printStatement(int indent, StringBuilder output) {
        printAsExpression(indent, output);
        switch (getKind()) {
            case 3:
                return output.append(',');

            default:
                return output.append(';');
        }
    }

    public StringBuilder printAsExpression(int indent, StringBuilder output) {
        printIndent(indent, output);
        printModifiers(this.modifiers, output);
        if (this.annotations != null) {
            printAnnotations(this.annotations, output);
            output.append(' ');
        }

        if (this.type != null) {
            this.type.print(0, output).append(' ');
        }
        output.append(this.name);
        switch (getKind()) {
            case 3:
                if (this.initialization != null) {
                    this.initialization.printExpression(indent, output);
                }
                break;

            default:
                if (this.initialization != null) {
                    output.append(" = "); //$NON-NLS-1$
                    this.initialization.printExpression(indent, output);
                }
        }
        return output;
    }

}
