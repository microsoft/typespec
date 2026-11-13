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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
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
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class TypeParameter extends ASTNode {

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS8
     * API).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor MODIFIERS_PROPERTY
        = new ChildListPropertyDescriptor(TypeParameter.class, "modifiers", IExtendedModifier.class, true); //$NON-NLS-1$

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY
        = new ChildPropertyDescriptor(TypeParameter.class, "name", SimpleName.class, false); //$NON-NLS-1$

    /**
     * The "typeBounds" structural property of this node type (element type: {@link Type}).
     */
    public static final ChildListPropertyDescriptor TYPE_BOUNDS_PROPERTY
        = new ChildListPropertyDescriptor(TypeParameter.class, "typeBounds", Type.class, false); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(3);
        createPropertyList(TypeParameter.class, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        addProperty(TYPE_BOUNDS_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList(4);
        createPropertyList(TypeParameter.class, propertyList);
        addProperty(MODIFIERS_PROPERTY, propertyList);
        addProperty(NAME_PROPERTY, propertyList);
        addProperty(TYPE_BOUNDS_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The type variable node; lazily initialized; defaults to an unspecified, but legal, name.
     */
    private volatile SimpleName typeVariableName;

    /**
     * The type bounds (element type: {@link Type}). Defaults to an empty list.
     */
    private final ASTNode.NodeList typeBounds = new ASTNode.NodeList(TYPE_BOUNDS_PROPERTY);

    /**
     * The modifiers (element type: {@link IExtendedModifier}). Null in JLS < 8. Added in JLS8; defaults to an empty
     * list (see constructor).
     */
    private ASTNode.NodeList modifiers = null;

    /**
     * Creates a new unparented node for a parameterized type owned by the given AST. By default, an unspecified, but
     * legal, type variable name, and no type bounds. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    TypeParameter(AST ast) {
        super(ast);
        unsupportedIn2();
        if (ast.apiLevel >= 8) {
            this.modifiers = new ASTNode.NodeList(MODIFIERS_PROPERTY);
        }
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
            if (this.ast.apiLevel >= 8) {
                acceptChildren(visitor, this.modifiers);
            }
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.typeBounds);
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the name of the type variable declared in this type parameter.
     *
     * @return the name of the type variable
     */
    public SimpleName getName() {
        if (this.typeVariableName == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.typeVariableName == null) {
                    this.typeVariableName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
                }
            }
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
        if (typeName == null) {
            throw new IllegalArgumentException();
        }
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
    public List typeBounds() {
        return this.typeBounds;
    }

    /**
     * Returns the live ordered list of modifiers for this TypeParameter node (added in JLS8 API).
     *
     * @return the live list of modifiers (element type: {@link IExtendedModifier})
     * @exception UnsupportedOperationException if this operation is used in a JLS2, JLS3 or JLS4 AST
     * @since 3.10
     */
    public List modifiers() {
        // more efficient than just calling unsupportedIn2_3_4() to check
        if (this.modifiers == null) {
            unsupportedIn2_3_4();
        }
        return this.modifiers;
    }
}
