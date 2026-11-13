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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
import java.util.List;

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
@SuppressWarnings("rawtypes")
public class WildcardType extends AnnotatableType {

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY
        = internalAnnotationsPropertyFactory(WildcardType.class);

    /**
     * The "bound" structural property of this node type (child type: {@link Type}).
     */
    public static final ChildPropertyDescriptor BOUND_PROPERTY
        = new ChildPropertyDescriptor(WildcardType.class, "bound", Type.class, true); //$NON-NLS-1$

    /**
     * The "upperBound" structural property of this node type (type: {@link Boolean}).
     */
    public static final SimplePropertyDescriptor UPPER_BOUND_PROPERTY
        = new SimplePropertyDescriptor(WildcardType.class, "upperBound", boolean.class); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(WildcardType.class, propertyList);
        addProperty(BOUND_PROPERTY, propertyList);
        addProperty(UPPER_BOUND_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList(4);
        createPropertyList(WildcardType.class, propertyList);
        addProperty(ANNOTATIONS_PROPERTY, propertyList);
        addProperty(BOUND_PROPERTY, propertyList);
        addProperty(UPPER_BOUND_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The optional type bound node; <code>null</code> if none; defaults to none.
     */
    private Type optionalBound = null;

    /**
     * Indicates whether the wildcard bound is an upper bound ("extends") as opposed to a lower bound ("super").
     * Defaults to <code>true</code> initially.
     */
    private boolean isUpperBound = true;

    /**
     * Creates a new unparented node for a wildcard type owned by the given AST. By default, no upper bound. <p> N.B.
     * This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    WildcardType(AST ast) {
        super(ast);
        unsupportedIn2();
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
            if (this.ast.apiLevel >= 8) {
                acceptChildren(visitor, this.annotations);
            }
            acceptChild(visitor, getBound());
        }
        visitor.endVisit(this);
    }

    /**
     * Returns whether this wildcard type is an upper bound ("extends") as opposed to a lower bound ("super"). <p> Note
     * that this property is irrelevant for wildcards that do not have a bound. </p>
     *
     * @return <code>true</code> if an upper bound, and <code>false</code> if a lower bound
     * @see #setBound(Type)
     */
    public boolean isUpperBound() {
        return this.isUpperBound;
    }

    /**
     * Returns the bound of this wildcard type if it has one. If {@link #isUpperBound isUpperBound} returns true, this
     * is an upper bound ("? extends B"); if it returns false, this is a lower bound ("? super B").
     *
     * @return the bound of this wildcard type, or <code>null</code> if none
     * @see #setBound(Type)
     */
    public Type getBound() {
        return this.optionalBound;
    }

    /**
     * Sets the bound of this wildcard type to the given type and marks it as an upper or a lower bound. The method is
     * equivalent to calling <code>setBound(type); setUpperBound(isUpperBound)</code>.
     *
     * @param type the new bound of this wildcard type, or <code>null</code> if none
     * @param isUpperBound <code>true</code> for an upper bound ("? extends B"), and <code>false</code> for a lower
     * bound ("? super B")
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     * @see #getBound()
     * @see #isUpperBound()
     */
    public void setBound(Type type, boolean isUpperBound) {
        setBound(type);
        setUpperBound(isUpperBound);
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

    /**
     * Sets whether this wildcard type is an upper bound ("extends") as opposed to a lower bound ("super").
     *
     * @param isUpperBound <code>true</code> if an upper bound, and <code>false</code> if a lower bound
     * @see #isUpperBound()
     */
    public void setUpperBound(boolean isUpperBound) {
        preValueChange();
        this.isUpperBound = isUpperBound;

    }
}
