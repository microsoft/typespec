// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2013 IBM Corporation and others.
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
 * Number literal nodes.
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class NumberLiteral extends Expression {

    /**
     * Creates a new unparented number literal node owned by the given AST. By default, the number literal is the token
     * "<code>0</code>". <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    NumberLiteral(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 34;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);

    }

    /*
     * (omit javadoc for this method) This method is a copy of setToken(String) that doesn't do any validation.
     */
    void internalSetToken() {
        preValueChange();
    }
}
