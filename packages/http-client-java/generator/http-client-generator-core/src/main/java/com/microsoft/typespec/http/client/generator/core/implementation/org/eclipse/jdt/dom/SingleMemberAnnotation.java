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
 * Single member annotation node (added in JLS3 API). The single member annotation "@foo(bar)" is equivalent to the
 * normal annotation "@foo(value=bar)".
 *
 * <pre>
 * SingleMemberAnnotation:
 *   <b>@</b> TypeName <b>(</b> Expression  <b>)</b>
 * </pre>
 *
 * <p> Within annotations, only certain kinds of expressions are meaningful, including other annotations. </p>
 *
 * @since 3.1
 */
public final class SingleMemberAnnotation extends Annotation {

    /**
     * The "typeName" structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor TYPE_NAME_PROPERTY = internalTypeNamePropertyFactory();

    /**
     * The "value" structural property of this node type (child type: {@link Expression}).
     */
    public static final ChildPropertyDescriptor VALUE_PROPERTY = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The value; lazily initialized; defaults to a unspecified, but legal, expression.
     */
    private Expression value;

    /**
     * Creates a new unparented normal annotation node owned by the given AST. By default, the annotation has an
     * unspecified type name and an unspecified value. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    SingleMemberAnnotation(AST ast) {
        super(ast);

    }

    @Override
    ChildPropertyDescriptor internalTypeNameProperty() {
        return TYPE_NAME_PROPERTY;
    }

    @Override
    int getNodeType0() {
        return 79;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getTypeName());
            acceptChild(visitor, getValue());
        }

    }

    /**
     * Returns the value of this annotation.
     *
     * @return the value node
     */
    public Expression getValue() {
        if (this.value == null) {
            this.value = postLazyInit(new SimpleName(this.ast), VALUE_PROPERTY);
        }
        return this.value;
    }

    /**
     * Sets the value of this annotation.
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
