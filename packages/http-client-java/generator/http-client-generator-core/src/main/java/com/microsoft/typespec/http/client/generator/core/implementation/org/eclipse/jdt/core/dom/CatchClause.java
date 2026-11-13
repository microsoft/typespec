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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
import java.util.List;

/**
 * Catch clause AST node type.
 *
 * <pre>
 * CatchClause:
 *    <b>catch</b> <b>(</b> FormalParameter <b>)</b> Block
 * </pre>
 *
 * <p>The FormalParameter is represented by a {@link SingleVariableDeclaration}.</p>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class CatchClause extends ASTNode {

    /**
     * The "exception" structural property of this node type (child type: {@link SingleVariableDeclaration}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor EXCEPTION_PROPERTY
        = new ChildPropertyDescriptor(CatchClause.class, "exception", SingleVariableDeclaration.class, true); //$NON-NLS-1$

    /**
     * The "body" structural property of this node type (child type: {@link Block}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor BODY_PROPERTY
        = new ChildPropertyDescriptor(CatchClause.class, "body", Block.class, true); //$NON-NLS-1$

    static {
        List properyList = new ArrayList(3);
        createPropertyList(CatchClause.class, properyList);
        addProperty(EXCEPTION_PROPERTY, properyList);
        addProperty(BODY_PROPERTY, properyList);
        reapPropertyList(properyList);
    }

    /**
     * The body; lazily initialized; defaults to an empty block.
     */
    private volatile Block body;

    /**
     * The exception variable declaration; lazily initialized; defaults to a unspecified, but legal, variable
     * declaration.
     */
    private volatile SingleVariableDeclaration exceptionDecl;

    /**
     * Creates a new AST node for a catch clause owned by the given AST. By default, the catch clause declares an
     * unspecified, but legal, exception declaration and has an empty block. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    CatchClause(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 12;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getException());
            acceptChild(visitor, getBody());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the exception variable declaration of this catch clause.
     *
     * @return the exception variable declaration node
     */
    public SingleVariableDeclaration getException() {
        if (this.exceptionDecl == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.exceptionDecl == null) {
                    this.exceptionDecl = postLazyInit(new SingleVariableDeclaration(this.ast), EXCEPTION_PROPERTY);
                }
            }
        }
        return this.exceptionDecl;
    }

    /**
     * Sets the variable declaration of this catch clause.
     *
     * @param exception the exception variable declaration node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setException(SingleVariableDeclaration exception) {
        if (exception == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.exceptionDecl;
        preReplaceChild(oldChild, exception, EXCEPTION_PROPERTY);
        this.exceptionDecl = exception;

    }

    /**
     * Returns the body of this catch clause.
     *
     * @return the catch clause body
     */
    public Block getBody() {
        if (this.body == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.body == null) {
                    this.body = postLazyInit(new Block(this.ast), BODY_PROPERTY);
                }
            }
        }
        return this.body;
    }

    /**
     * Sets the body of this catch clause.
     *
     * @param body the catch clause block node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setBody(Block body) {
        if (body == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.body;
        preReplaceChild(oldChild, body, BODY_PROPERTY);
        this.body = body;

    }
}
