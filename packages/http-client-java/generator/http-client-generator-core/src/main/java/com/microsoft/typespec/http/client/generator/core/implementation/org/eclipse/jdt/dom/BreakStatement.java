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
 * Break statement AST node type.
 *
 * <pre>
 * BreakStatement:
 *    <b>break</b> [ Identifier ] <b>;</b>
 * </pre>
 *
 * @since 2.0
 */
public class BreakStatement extends Statement {

    /**
     * The "label" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor LABEL_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    static {
        new ChildPropertyDescriptor(Expression.class, false);
    }

    /**
     * The label, or <code>null</code> if none; none by default.
     */
    private SimpleName optionalLabel = null;

    /**
     * Creates a new unparented break statement node owned by the given AST. By default, the break statement has no
     * label/identifier/expression and is not implicit. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    BreakStatement(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 10;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        acceptChild(visitor, getLabel());
    }

    /**
     * Returns the label of this break statement, or <code>null</code> if there is none.
     *
     * @return the label, or <code>null</code> if there is none
     */
    public SimpleName getLabel() {
        return this.optionalLabel;
    }

    /**
     * Sets or clears the label of this break statement.
     *
     * @param label the label, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setLabel(SimpleName label) {
        ASTNode oldChild = this.optionalLabel;
        preReplaceChild(oldChild, label, LABEL_PROPERTY);
        this.optionalLabel = label;

    }
}
