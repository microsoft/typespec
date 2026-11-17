// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2019, 2021 IBM Corporation and others.
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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * TextBlock AST node type.
 *
 * These are block of String literal nodes.
 *
 * @since 3.22
 */
@SuppressWarnings("rawtypes")
public class TextBlock extends Expression {

    /**
     * Creates a new unparented TextBlock node owned by the given AST. By default, the TextBlock denotes the empty
     * string. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    TextBlock(AST ast) {
        super(ast);

    }

    @Override
    final int getNodeType0() {
        return 102;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);

    }

    /*
     * (omit javadoc for this method) This method is does what setEscapedValue(String) does but without any validation.
     * In addition, it also sets the literalValue property.
     */
    void internalSetEscapedValue(String token, String literal) {
        preValueChange();

    }
}
