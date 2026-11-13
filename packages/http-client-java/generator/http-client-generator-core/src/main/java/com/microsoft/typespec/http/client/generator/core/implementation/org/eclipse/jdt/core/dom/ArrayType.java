// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2014 IBM Corporation and others.
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
 * Type node for an array type. <p> In JLS8 and later, array types are represented by a base element type (which cannot
 * be an array type) and a list of dimensions, each of which may have a list of annotations. </p>
 *
 * <pre>
 * ArrayType:
 *    Type Dimension <b>{</b> Dimension <b>}</b>
 * </pre>
 *
 * In JLS4 and before, array types were expressed in a recursive manner, one dimension at a time:
 *
 * <pre>
 * ArrayType:
 *    Type <b>[</b> <b>]</b>
 * </pre>
 *
 * This structure became untenable with the advent of type-use annotations, because in the language model, the base type
 * binds with array dimensions from right to left, whereas a recursive structure binds from left to right (inside out).
 * <p> Example:<br> <code><u>int @A[] @B[] @C[]</u></code> is an <u><code>@A</code></u>-array of<br> <code><u>int
 * </u>&nbsp;&nbsp;&nbsp;&nbsp;<u> @B[] @C[]</u></code>, but such a component type is not representable by nested
 * <code>ArrayType</code>s with contiguous source ranges.
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class ArrayType extends Type {

    /**
     * The "componentType" structural property of this node type (child type: {@link Type}).
     *
     * @deprecated In the JLS8 API, this property is replaced by {@link #ELEMENT_TYPE_PROPERTY} and
     * {@link #DIMENSIONS_PROPERTY}.
     * @since 3.0
     */
    public static final ChildPropertyDescriptor COMPONENT_TYPE_PROPERTY
        = new ChildPropertyDescriptor(ArrayType.class, "componentType", Type.class, true); //$NON-NLS-1$

    /**
     * The "elementType" structural property of this node type (child type: {@link Type}) (added in JLS8 API). Cannot be
     * an array type.
     *
     * @since 3.10
     */
    public static final ChildPropertyDescriptor ELEMENT_TYPE_PROPERTY
        = new ChildPropertyDescriptor(ArrayType.class, "elementType", Type.class, true); //$NON-NLS-1$

    /**
     * The "dimensions" structural property of this node type (element type: {@link Dimension}) (added in JLS8 API).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor DIMENSIONS_PROPERTY
        = new ChildListPropertyDescriptor(ArrayType.class, "dimensions", Dimension.class, true); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(2);
        createPropertyList(ArrayType.class, propertyList);
        addProperty(COMPONENT_TYPE_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList(3);
        createPropertyList(ArrayType.class, propertyList);
        addProperty(ELEMENT_TYPE_PROPERTY, propertyList);
        addProperty(DIMENSIONS_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

    /**
     * The element type (before JLS8: component type); lazily initialized; defaults to a simple type with an
     * unspecified, but legal, name.
     */
    private volatile Type type;

    /**
     * List of dimensions this node has with optional annotations (element type: {@link Dimension}). Null before JLS8.
     * Added in JLS8; defaults to a list with one element (see constructor).
     *
     * @since 3.10
     */
    private ASTNode.NodeList dimensions = null;

    /**
     * Creates a new unparented node for an array type owned by the given AST. By default, a 1-dimensional array of an
     * unspecified simple type. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    ArrayType(AST ast) {
        super(ast);
        if (ast.apiLevel >= 8) {
            this.dimensions = new ASTNode.NodeList(DIMENSIONS_PROPERTY);
            // single dimension array is the default
            this.dimensions().add(this.ast.newDimension());
        }
    }

    /**
     * Creates a new unparented node for an array type owned by the given AST. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     * @param dimensions no of dimensions - can be zero
     *
     * @since 3.10
     */
    ArrayType(AST ast, int dimensions) {
        super(ast);
        unsupportedIn2_3_4();
        this.dimensions = new ASTNode.NodeList(DIMENSIONS_PROPERTY);
        for (int i = 0; i < dimensions; ++i) {
            this.dimensions().add(this.ast.newDimension());
        }
    }

    @Override
    final int getNodeType0() {
        return 5;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            if (this.ast.apiLevel < 8) {
                acceptChild(visitor, getComponentType());
            } else {
                acceptChild(visitor, getElementType());
                acceptChildren(visitor, this.dimensions);
            }
        }
        visitor.endVisit(this);
    }

    /**
     * Returns the component type of this array type. The component type may be another array type.
     *
     * @return the component type node
     * @exception UnsupportedOperationException if this operation is used in an AST later than JLS4
     * @see #dimensions()
     * @deprecated In the JLS8 API, the recursive structure is not valid.
     */
    public Type getComponentType() {
        supportedOnlyIn2_3_4();
        return internalGetType(COMPONENT_TYPE_PROPERTY);
    }

    private Type internalGetType(ChildPropertyDescriptor property) {
        if (this.type == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.type == null) {
                    this.type = postLazyInit(new SimpleType(this.ast), property);
                }
            }
        }
        return this.type;
    }

    /**
     * Sets the component type of this array type. The component type may be another array type.
     *
     * @param componentType the component type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     * @exception UnsupportedOperationException if this operation is used in an AST later than JLS4
     * @deprecated In the JLS8 API, the recursive structure is not valid.
     */
    public void setComponentType(Type componentType) {
        supportedOnlyIn2_3_4();
        if (componentType == null) {
            throw new IllegalArgumentException();
        }
        internalSetType(componentType, COMPONENT_TYPE_PROPERTY);
    }

    private void internalSetType(Type componentType, ChildPropertyDescriptor property) {
        ASTNode oldChild = this.type;
        preReplaceChild(oldChild, componentType, property);
        this.type = componentType;

    }

    /**
     * Returns the element type of this array type. The element type is never an array type. <p> In JLS4 and earlier,
     * this is a convenience method that descends a chain of nested array types until it reaches a non-array type. </p>
     *
     * @return the element type node
     */
    public Type getElementType() {
        if (this.ast.apiLevel() < 8) {
            Type t = getComponentType();
            while (t.isArrayType()) {
                t = ((ArrayType) t).getComponentType();
            }
            return t;
        }
        return internalGetType(ELEMENT_TYPE_PROPERTY);
    }

    /**
     * Sets the element type of the array.
     *
     * @param type the new type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>the node is an array type</li> </ul>
     * @exception UnsupportedOperationException if this operation is used below JLS8
     * @since 3.10
     */
    public void setElementType(Type type) {
        unsupportedIn2_3_4();
        if (type == null || type instanceof ArrayType) {
            throw new IllegalArgumentException();
        }
        internalSetType(type, ELEMENT_TYPE_PROPERTY);
    }

    /**
     * Returns the number of dimensions in this array type. <p> In JLS8 and later, this is a convenience method that
     * returns <code>dimensions().size()</code>. </p> <p> In JLS4 and earlier, this is a convenience method that
     * descends a chain of nested array types until it reaches a non-array type. </p>
     *
     * @return the number of dimensions (always positive)
     */
    public int getDimensions() {
        if (this.ast.apiLevel() >= 8) {
            return dimensions().size();
        }
        Type t = getComponentType();
        int dimension = 1; // always include this array type
        while (t.isArrayType()) {
            dimension++;
            t = ((ArrayType) t).getComponentType();
        }
        return dimension;
    }

    /**
     * Returns the live ordered list of dimensions with optional annotations (added in JLS8 API). <p> For the array type
     * to be plausible, the list should contain at least one element. </p>
     *
     * @return the live list of dimensions with optional annotations (element type: {@link Dimension})
     * @exception UnsupportedOperationException if this operation is used below JLS8
     * @since 3.10
     */
    public List dimensions() {
        // more efficient than just calling unsupportedIn2_3_4() to check
        if (this.dimensions == null) {
            unsupportedIn2_3_4();
        }
        return this.dimensions;
    }
}
