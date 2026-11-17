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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

import java.util.List;

/**
 * Local variable declaration expression AST node type. <p> This kind of node collects together several variable
 * declaration fragments (<code>VariableDeclarationFragment</code>) into a single expression (<code>Expression</code>),
 * all sharing the same modifiers and base type. This type of node can be used as the initializer of a
 * <code>ForStatement</code>, or wrapped in an <code>ExpressionStatement</code> to form the equivalent of a
 * <code>VariableDeclarationStatement</code>. </p>
 *
 * <pre>
 * VariableDeclarationExpression:
 *    { ExtendedModifier } Type VariableDeclarationFragment
 *         { <b>,</b> VariableDeclarationFragment }
 * </pre>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class VariableDeclarationExpression extends Expression {

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS3
     * API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY
        = new ChildListPropertyDescriptor(IExtendedModifier.class, true);

    /**
     * The "type" structural property of this node type (child type: {@link Type}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY = new ChildPropertyDescriptor(Type.class, false);

    /**
     * The "fragments" structural property of this node type (element type: {@link VariableDeclarationFragment}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor FRAGMENTS_PROPERTY
        = new ChildListPropertyDescriptor(VariableDeclarationFragment.class, true);

    /**
     * The extended modifiers (element type: {@link IExtendedModifier}). Null in JLS2. Added in JLS3; defaults to an
     * empty list (see constructor).
     *
     * @since 3.0
     */
    private ASTNode.NodeList modifiers = null;

    /**
     * The base type; lazily initialized; defaults to an unspecified, legal type.
     */
    private Type baseType;

    /**
     * The list of variable declaration fragments (element type: {@link VariableDeclarationFragment}). Defaults to an
     * empty list.
     */
    private final ASTNode.NodeList variableDeclarationFragments = new ASTNode.NodeList(FRAGMENTS_PROPERTY);

    /**
     * Creates a new unparented local variable declaration expression node owned by the given AST. By default, the
     * variable declaration has: no modifiers, an unspecified (but legal) type, and an empty list of variable
     * declaration fragments (which is syntactically illegal). <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    VariableDeclarationExpression(AST ast) {
        super(ast);
        this.modifiers = new ASTNode.NodeList(MODIFIERS2_PROPERTY);
    }

    @Override
    final int getNodeType0() {
        return 58;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.modifiers);
            acceptChild(visitor, getType());
            acceptChildren(visitor, this.variableDeclarationFragments);
        }

    }

    /**
     * Returns the live ordered list of modifiers and annotations of this declaration (added in JLS3 API). <p> Note that
     * the final modifier is the only meaningful modifier for local variable declarations. </p>
     *
     * @return the live list of modifiers and annotations (element type: {@link IExtendedModifier})
     * @since 3.1
     */
    public List modifiers() {
        // more efficient than just calling unsupportedIn2() to check

        return this.modifiers;
    }

    /**
     * Returns the base type declared in this variable declaration. <p> N.B. The individual child variable declaration
     * fragments may specify additional array dimensions. So the type of the variable are not necessarily exactly this
     * type. </p>
     *
     * @return the base type
     */
    public Type getType() {
        if (this.baseType == null) {
            this.baseType = postLazyInit(this.ast.newPrimitiveType(PrimitiveType.INT), TYPE_PROPERTY);
        }
        return this.baseType;
    }

    /**
     * Sets the base type declared in this variable declaration to the given type.
     *
     * @param type the new base type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setType(Type type) {
        if (type == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.baseType;
        preReplaceChild(oldChild, type, TYPE_PROPERTY);
        this.baseType = type;

    }

    /**
     * Returns the live list of variable declaration fragments in this expression. Adding and removing nodes from this
     * list affects this node dynamically. All nodes in this list must be <code>VariableDeclarationFragment</code>s;
     * attempts to add any other type of node will trigger an exception.
     *
     * @return the live list of variable declaration fragments in this expression (element type:
     * {@link VariableDeclarationFragment})
     */
    public List fragments() {
        return this.variableDeclarationFragments;
    }
}
