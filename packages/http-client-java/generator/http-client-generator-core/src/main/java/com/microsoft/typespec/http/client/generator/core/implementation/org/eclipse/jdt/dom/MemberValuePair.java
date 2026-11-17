// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2019 IBM Corporation and others.
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
 * Member value pair node (added in JLS3 API). Member value pairs appear in annotations.
 *
 * <pre>
 * MemberValuePair:
 *   SimpleName <b>=</b> Expression
 * </pre>
 *
 * <p> Within annotations, only certain kinds of expressions are meaningful, including other annotations. </p>
 *
 * @see NormalAnnotation
 * @since 3.1
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings("rawtypes")
public class MemberValuePair extends ASTNode {

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The "value" structural property of this node type (child type: {@link Expression}).
     */
    public static final ChildPropertyDescriptor VALUE_PROPERTY = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The member name; lazily initialized; defaults to a unspecified, legal name.
     */
    private SimpleName name;

    /**
     * The value; lazily initialized; defaults to a unspecified, legal expression.
     */
    private Expression value;

    /**
     * Creates a new AST node for a member value pair owned by the given AST. By default, the node has an unspecified
     * (but legal) member name and value. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    MemberValuePair(AST ast) {
        super(ast);

    }

    @Override
    final int getNodeType0() {
        return 80;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getName());
            acceptChild(visitor, getValue());
        }

    }

    /**
     * Returns the member name.
     *
     * @return the member name node
     */
    public SimpleName getName() {
        if (this.name == null) {
            this.name = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.name;
    }

    /**
     * Sets the member name.
     *
     * @param name the member name node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName name) {

        ASTNode oldChild = this.name;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.name = name;

    }

    /**
     * Returns the value expression.
     *
     * @return the value expression
     */
    public Expression getValue() {
        if (this.value == null) {
            this.value = postLazyInit(new SimpleName(this.ast), VALUE_PROPERTY);
        }
        return this.value;
    }

    /**
     * Sets the value of this pair.
     *
     * @param value the new value
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setValue(Expression value) {
        if (value == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.value;
        preReplaceChild(oldChild, value, VALUE_PROPERTY);
        this.value = value;

    }
}
