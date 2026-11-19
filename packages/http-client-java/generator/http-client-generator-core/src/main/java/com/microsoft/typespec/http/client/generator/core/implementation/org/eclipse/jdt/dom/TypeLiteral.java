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

/**
 * Type literal AST node type.
 *
 * <pre>
 * TypeLiteral:
 *     ( Type | <b>void</b> ) <b>.</b> <b>class</b>
 * </pre>
 *
 * @since 2.0
 */
public class TypeLiteral extends Expression {

    /**
     * The "type" structural property of this node type (child type: {@link Type}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY = new ChildPropertyDescriptor(Type.class, true);

    /**
     * The type; lazily initialized; defaults to a unspecified, legal type.
     */
    private Type type;

    /**
     * Creates a new AST node for a type literal owned by the given AST. By default, the expression has an unspecified
     * (but legal) type. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    TypeLiteral(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 57;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        acceptChild(visitor, getType());
    }

    /**
     * Returns the type in this type literal expression.
     *
     * @return the type
     */
    public Type getType() {
        if (this.type == null) {
            this.type = postLazyInit(this.ast.newPrimitiveType(PrimitiveType.INT), TYPE_PROPERTY);
        }
        return this.type;
    }

    /**
     * Sets the type in this type literal expression to the given type.
     *
     * @param type the new type
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
}
