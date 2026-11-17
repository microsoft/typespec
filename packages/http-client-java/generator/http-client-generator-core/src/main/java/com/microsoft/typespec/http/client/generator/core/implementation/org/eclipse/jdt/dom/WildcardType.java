// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2003, 2014 IBM Corporation and others.
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
 * Type node for a wildcard type (added in JLS3 API).
 *
 * <pre>
 * WildcardType:
 *    { Annotation } <b>?</b> [ ( <b>extends</b> | <b>super</b>) Type ]
 * </pre>
 *
 * <p> Not all node arrangements will represent legal Java constructs. In particular, it is nonsense if a wildcard type
 * node appears anywhere other than as an argument of a <code>ParameterizedType</code> node. </p>
 *
 * @since 3.1
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
public class WildcardType extends AnnotatableType {

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY = internalAnnotationsPropertyFactory();

    /**
     * The "bound" structural property of this node type (child type: {@link Type}).
     */
    public static final ChildPropertyDescriptor BOUND_PROPERTY = new ChildPropertyDescriptor(Type.class, true);

    /**
     * The optional type bound node; <code>null</code> if none; defaults to none.
     */
    private Type optionalBound = null;

    /**
     * Creates a new unparented node for a wildcard type owned by the given AST. By default, no upper bound. <p> N.B.
     * This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    WildcardType(AST ast) {
        super(ast);

    }

    /*
     * (omit javadoc for this method) Method declared on AnnotatableType.
     *
     * @since 3.10
     */
    @Override
    final ChildListPropertyDescriptor internalAnnotationsProperty() {
        return ANNOTATIONS_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 76;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.annotations);
            acceptChild(visitor, getBound());
        }

    }

    /**
     * Returns the bound of this wildcard type if it has one.
     *
     * @return the bound of this wildcard type, or <code>null</code> if none
     * @see #setBound(Type)
     */
    public Type getBound() {
        return this.optionalBound;
    }

    /**
     * Sets the bound of this wildcard type to the given type.
     *
     * @param type the new bound of this wildcard type, or <code>null</code> if none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     * @see #getBound()
     */
    public void setBound(Type type) {
        ASTNode oldChild = this.optionalBound;
        preReplaceChild(oldChild, type, BOUND_PROPERTY);
        this.optionalBound = type;

    }

}
