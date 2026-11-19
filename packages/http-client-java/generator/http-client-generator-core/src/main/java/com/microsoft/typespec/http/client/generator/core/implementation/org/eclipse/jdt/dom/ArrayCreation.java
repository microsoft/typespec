// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
 * Array creation expression AST node type.
 *
 * <pre>
 * ArrayCreation:
 *    <b>new</b> PrimitiveType <b>[</b> Expression <b>]</b> { <b>[</b> Expression <b>]</b> } { <b>[</b> <b>]</b> }
 *    <b>new</b> TypeName [ <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b> ]
 *        <b>[</b> Expression <b>]</b> { <b>[</b> Expression <b>]</b> } { <b>[</b> <b>]</b> }
 *    <b>new</b> PrimitiveType <b>[</b> <b>]</b> { <b>[</b> <b>]</b> } ArrayInitializer
 *    <b>new</b> TypeName [ <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b> ]
 *        <b>[</b> <b>]</b> { <b>[</b> <b>]</b> } ArrayInitializer
 * </pre>
 *
 * <p> The mapping from Java language syntax to AST nodes is as follows: <ul> <li>the type node is the array type of the
 * creation expression, with one level of array per set of square brackets,</li> <li>the dimension expressions are
 * collected into the <code>dimensions</code> list.</li> </ul>
 *
 * @since 2.0
 */
public class ArrayCreation extends Expression {

    /**
     * The "type" structural property of this node type (child type: {@link ArrayType}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY = new ChildPropertyDescriptor(ArrayType.class, false);

    /**
     * The "dimensions" structural property of this node type (element type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor DIMENSIONS_PROPERTY
        = new ChildListPropertyDescriptor(Expression.class, true);

    /**
     * The "initializer" structural property of this node type (child type: {@link ArrayInitializer}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor INITIALIZER_PROPERTY
        = new ChildPropertyDescriptor(ArrayInitializer.class, true);

    /**
     * The array type; lazily initialized; defaults to a unspecified, legal array type.
     */
    private ArrayType arrayType;

    /**
     * The list of dimension expressions (element type: {@link Expression}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<Expression> dimensions = new ASTNode.NodeList<>(DIMENSIONS_PROPERTY);

    /**
     * The optional array initializer, or <code>null</code> if none; defaults to none.
     */
    private ArrayInitializer optionalInitializer = null;

    /**
     * Creates a new AST node for an array creation expression owned by the given AST. By default, the array type is an
     * unspecified 1-dimensional array, the list of dimensions is empty, and there is no array initializer.
     *
     * @param ast the AST that is to own this node
     */
    ArrayCreation(AST ast) {
        super(ast);
    }

    @Override
    final int getNodeType0() {
        return 3;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getType());
            acceptChildren(visitor, this.dimensions);
            acceptChild(visitor, getInitializer());
        }

    }

    /**
     * Returns the array type in this array creation expression.
     *
     * @return the array type
     */
    public ArrayType getType() {
        if (this.arrayType == null) {
            this.arrayType
                = postLazyInit(this.ast.newArrayType(this.ast.newPrimitiveType(PrimitiveType.INT)), TYPE_PROPERTY);
        }
        return this.arrayType;
    }

    /**
     * Sets the array type in this array creation expression.
     *
     * @param type the new array type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setType(ArrayType type) {
        if (type == null) {
            throw new IllegalArgumentException();
        }
        // an ArrayCreation cannot occur inside a ArrayType - cycles not possible
        ASTNode oldChild = this.arrayType;
        preReplaceChild(oldChild, type, TYPE_PROPERTY);
        this.arrayType = type;

    }

    /**
     * Returns the live ordered list of dimension expressions in this array initializer.
     *
     * @return the live list of dimension expressions (element type: {@link Expression})
     */
    public List<Expression> dimensions() {
        return this.dimensions;
    }

    /**
     * Returns the array initializer of this array creation expression, or <code>null</code> if there is none.
     *
     * @return the array initializer node, or <code>null</code> if there is none
     */
    public ArrayInitializer getInitializer() {
        return this.optionalInitializer;
    }

    /**
     * Sets or clears the array initializer of this array creation expression.
     *
     * @param initializer the array initializer node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setInitializer(ArrayInitializer initializer) {
        // an ArrayCreation may occur inside an ArrayInitializer
        // must check cycles
        ASTNode oldChild = this.optionalInitializer;
        preReplaceChild(oldChild, initializer, INITIALIZER_PROPERTY);
        this.optionalInitializer = initializer;

    }
}
