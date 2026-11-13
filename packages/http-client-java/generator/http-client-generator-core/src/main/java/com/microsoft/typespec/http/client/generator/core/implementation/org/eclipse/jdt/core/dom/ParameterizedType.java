// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2003, 2013 IBM Corporation and others.
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
 * Type node for a parameterized type (added in JLS3 API). These nodes are used for type references (as opposed to
 * declarations of parameterized types.)
 *
 * <pre>
 * ParameterizedType:
 *    Type <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b>
 * </pre>
 *
 * The first type may be a simple type or a qualified type; other kinds of types are meaningless.
 *
 * @since 3.1
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class ParameterizedType extends Type {

    /**
     * The "type" structural property of this node type (child type: {@link Type}).
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY
        = new ChildPropertyDescriptor(ParameterizedType.class, "type", Type.class, true); //$NON-NLS-1$

    /**
     * The "typeArguments" structural property of this node type (element type: {@link Type}).
     */
    public static final ChildListPropertyDescriptor TYPE_ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(ParameterizedType.class, "typeArguments", Type.class, true); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(ParameterizedType.class, propertyList);
        addProperty(TYPE_PROPERTY, propertyList);
        addProperty(TYPE_ARGUMENTS_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The type node; lazily initialized; defaults to an unspecified, but legal, type.
     */
    private volatile Type type;

    /**
     * The type arguments (element type: {@link Type}). Defaults to an empty list.
     */
    private final ASTNode.NodeList typeArguments = new ASTNode.NodeList(TYPE_ARGUMENTS_PROPERTY);

    /**
     * Creates a new unparented node for a parameterized type owned by the given AST. By default, an unspecified, but
     * legal, type, and no type arguments. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    ParameterizedType(AST ast) {
        super(ast);
        unsupportedIn2();
    }

    @Override
    final int getNodeType0() {
        return 74;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getType());
            acceptChildren(visitor, this.typeArguments);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the type of this parameterized type.
     *
     * @return the type of this parameterized type
     */
    public Type getType() {
        if (this.type == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.type == null) {
                    this.type = postLazyInit(new SimpleType(this.ast), TYPE_PROPERTY);
                }
            }
        }
        return this.type;
    }

    /**
     * Sets the type of this parameterized type.
     *
     * @param type the new type of this parameterized type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setType(Type type) {
        if (type == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.type;
        preReplaceChild(oldChild, type, TYPE_PROPERTY);
        this.type = type;

    }

    /**
     * Returns the live ordered list of type arguments of this parameterized type. For the parameterized type to be
     * plausible, the list should contain at least one element and not contain primitive or union types. <p> Since JLS4,
     * the list can also be empty if this is the type of a {@link ClassInstanceCreation} (a so-called "diamond"). </p>
     *
     * @return the live list of type arguments (element type: {@link Type})
     */
    public List typeArguments() {
        return this.typeArguments;
    }
}
