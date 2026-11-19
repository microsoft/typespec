// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2003, 2019 IBM Corporation and others.
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
 * Type parameter declaration node (added in JLS3 API).
 *
 * <pre>
 * TypeParameter:
 *    { ExtendedModifier } Identifier [ <b>extends</b> Type { <b>&amp;</b> Type } ]
 * </pre>
 *
 * @since 3.1
 */
public class TypeParameter extends ASTNode {

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS8
     * API).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor MODIFIERS_PROPERTY
        = new ChildListPropertyDescriptor(IExtendedModifier.class, true);

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The "typeBounds" structural property of this node type (element type: {@link Type}).
     */
    public static final ChildListPropertyDescriptor TYPE_BOUNDS_PROPERTY
        = new ChildListPropertyDescriptor(Type.class, false);

    /**
     * The type variable node; lazily initialized; defaults to an unspecified, but legal, name.
     */
    private SimpleName typeVariableName;

    /**
     * The type bounds (element type: {@link Type}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<Type> typeBounds = new ASTNode.NodeList<>(TYPE_BOUNDS_PROPERTY);

    /**
     * The modifiers (element type: {@link IExtendedModifier}). Null in JLS < 8. Added in JLS8; defaults to an empty
     * list (see constructor).
     */
    private final ASTNode.NodeList<IExtendedModifier> modifiers;

    /**
     * Creates a new unparented node for a parameterized type owned by the given AST. By default, an unspecified, but
     * legal, type variable name, and no type bounds. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    TypeParameter(AST ast) {
        super(ast);

        this.modifiers = new ASTNode.NodeList<>(MODIFIERS_PROPERTY);
    }

    @Override
    final int getNodeType0() {
        return 73;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.modifiers);
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.typeBounds);
        }

    }

    /**
     * Returns the name of the type variable declared in this type parameter.
     *
     * @return the name of the type variable
     */
    public SimpleName getName() {
        if (this.typeVariableName == null) {
            this.typeVariableName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.typeVariableName;
    }

    /**
     * Sets the name of the type variable of this type parameter to the given name.
     *
     * @param typeName the new name of this type parameter
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName typeName) {

        ASTNode oldChild = this.typeVariableName;
        preReplaceChild(oldChild, typeName, NAME_PROPERTY);
        this.typeVariableName = typeName;

    }

    /**
     * Returns the live ordered list of type bounds of this type parameter. For the type parameter to be plausible,
     * there can be at most one class in the list, and it must be first, and the remaining ones must be interfaces; the
     * list should not contain primitive types (but array types and parameterized types are allowed).
     *
     * @return the live list of type bounds (element type: {@link Type})
     */
    public List<Type> typeBounds() {
        return this.typeBounds;
    }

    /**
     * Returns the live ordered list of modifiers for this TypeParameter node (added in JLS8 API).
     *
     * @return the live list of modifiers (element type: {@link IExtendedModifier})
     * @since 3.10
     */
    public List<IExtendedModifier> modifiers() {
        return this.modifiers;
    }
}
