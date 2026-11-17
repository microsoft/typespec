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

import java.util.List;

/**
 * Block statement AST node type.
 *
 * <pre>
 * Block:
 *    <b>{</b> { Statement } <b>}</b>
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class Block extends Statement {

    /**
     * The "statements" structural property of this node type (element type: {@link Statement}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor STATEMENTS_PROPERTY
        = new ChildListPropertyDescriptor(Statement.class, true);

    /**
     * The list of statements (element type: {@link Statement}). Defaults to an empty list.
     */
    private final ASTNode.NodeList statements = new ASTNode.NodeList(STATEMENTS_PROPERTY);

    /**
     * Creates a new unparented block node owned by the given AST. By default, the block is empty. <p> N.B. This
     * constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    Block(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 8;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChildren(visitor, this.statements);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the live list of statements in this block. Adding and removing nodes from this list affects this node
     * dynamically. All nodes in this list must be <code>Statement</code>s; attempts to add any other type of node will
     * trigger an exception.
     *
     * @return the live list of statements in this block (element type: {@link Statement})
     */
    public List statements() {
        return this.statements;
    }
}
