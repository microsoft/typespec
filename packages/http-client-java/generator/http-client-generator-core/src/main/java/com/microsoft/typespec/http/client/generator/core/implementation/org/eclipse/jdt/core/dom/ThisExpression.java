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
 * Simple or qualified "this" AST node type.
 *
 * <pre>
 * ThisExpression:
 *     [ ClassName <b>.</b> ] <b>this</b>
 * </pre>
 *
 * <p> See <code>FieldAccess</code> for guidelines on handling other expressions that resemble qualified names. </p>
 *
 * @see FieldAccess
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class ThisExpression extends Expression {

    /**
     * The "qualifier" structural property of this node type (child type: {@link Name}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor QUALIFIER_PROPERTY
        = new ChildPropertyDescriptor(ThisExpression.class, "qualifier", Name.class, false); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(2);
        createPropertyList(ThisExpression.class, propertyList);
        addProperty(QUALIFIER_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The optional qualifier; <code>null</code> for none; defaults to none.
     */
    private Name optionalQualifier = null;

    /**
     * Creates a new AST node for a "this" expression owned by the given AST. By default, there is no qualifier.
     *
     * @param ast the AST that is to own this node
     */
    ThisExpression(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 52;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            acceptChild(visitor, getQualifier());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the qualifier of this "this" expression, or <code>null</code> if there is none.
     *
     * @return the qualifier name node, or <code>null</code> if there is none
     */
    public Name getQualifier() {
        return this.optionalQualifier;
    }

    /**
     * Sets or clears the qualifier of this "this" expression.
     *
     * @param name the qualifier name node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setQualifier(Name name) {
        ASTNode oldChild = this.optionalQualifier;
        preReplaceChild(oldChild, name, QUALIFIER_PROPERTY);
        this.optionalQualifier = name;

    }
}
