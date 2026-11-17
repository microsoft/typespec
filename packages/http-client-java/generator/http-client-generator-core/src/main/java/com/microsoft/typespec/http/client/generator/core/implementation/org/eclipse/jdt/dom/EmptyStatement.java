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
 * Null statement AST node type.
 *
 * <pre>
 * EmptyStatement:
 *    <b>;</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class EmptyStatement extends Statement {

    /**
     * Creates a new unparented null statement node owned by the given AST. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    EmptyStatement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 20;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit(this);

    }
}
