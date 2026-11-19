// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
 * Character literal nodes.
 *
 * @since 2.0
 */
public class CharacterLiteral extends Expression {

    /**
     * Creates a new unparented character literal node owned by the given AST. By default, the character literal denotes
     * an unspecified character. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    CharacterLiteral(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 13;
    }

    @Override
    void accept0(ASTVisitor visitor) {
    }
}
