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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.List;

/**
 * Abstract base class of all AST node types that declare a single variable.
 *
 * <pre>
 * VariableDeclaration:
 *    SingleVariableDeclaration
 *    VariableDeclarationFragment
 * </pre>
 *
 * @see SingleVariableDeclaration
 * @see VariableDeclarationFragment
 * @since 2.0
 */
@SuppressWarnings({ "rawtypes" })
public abstract class VariableDeclaration extends ASTNode {

    /**
     * The variable name; lazily initialized; defaults to an unspecified, legal Java identifier.
     */
    volatile SimpleName variableName;

    /**
     * The number of extra array dimensions that appear after the variable; defaults to 0. Not used in JLS8 and later.
     *
     * @since 2.1
     * @deprecated In JLS8 and later, use {@link #extraDimensions} instead.
     */
    int extraArrayDimensions = 0;

    /**
     * List of extra dimensions this node has with optional annotations (element type: {@link Dimension}). Null before
     * JLS8. Added in JLS8; defaults to an empty list (see constructor).
     *
     * @since 3.10
     */
    ASTNode.NodeList extraDimensions = null;

    /**
     * The initializer expression, or <code>null</code> if none; defaults to none.
     */
    Expression optionalInitializer = null;

    /**
     * Creates and returns a structural property descriptor for the "name" property declared on the given concrete node
     * type (child type: {@link SimpleName}).
     *
     * @return the property descriptor
     */
    static final ChildPropertyDescriptor internalNamePropertyFactory(Class nodeClass) {
        return new ChildPropertyDescriptor(nodeClass, "name", SimpleName.class, false); //$NON-NLS-1$
    }

    /**
     * Creates and returns a structural property descriptor for the "extraDimensions" property declared on the given
     * concrete node type (type: {@link Integer}).
     *
     * @return the property descriptor
     * @deprecated In JLS8 and later, use {@link #internalExtraDimensions2PropertyFactory(Class)} instead.
     */
    static final SimplePropertyDescriptor internalExtraDimensionsPropertyFactory(Class nodeClass) {
        return new SimplePropertyDescriptor(nodeClass, "extraDimensions", int.class); //$NON-NLS-1$
    }

    /**
     * Creates and returns a structural property descriptor for the "extraDimensions2" property declared on the given
     * concrete node type (element type: {@link Dimension}).
     *
     * @return the property descriptor
     */
    static final ChildListPropertyDescriptor internalExtraDimensions2PropertyFactory(Class nodeClass) {
        return new ChildListPropertyDescriptor(nodeClass, "extraDimensions2", Dimension.class, true); //$NON-NLS-1$
    }

    /**
     * Creates and returns a structural property descriptor for the "initializer" property declared on the given
     * concrete node type (child type: {@link Expression}).
     *
     * @return the property descriptor
     */
    static final ChildPropertyDescriptor internalInitializerPropertyFactory(Class nodeClass) {
        return new ChildPropertyDescriptor(nodeClass, "initializer", Expression.class, true); //$NON-NLS-1$
    }

    /**
     * Returns structural property descriptor for the "name" property of this node (child type: {@link SimpleName}).
     *
     * @return the property descriptor
     * @since 3.1
     */
    abstract ChildPropertyDescriptor internalNameProperty();

    /**
     * Returns the structural property descriptor for the "extraDimensions" property of this node (type:
     * {@link Integer}) (below JLS8 only).
     *
     * @return the property descriptor
     * @since 3.1
     * @deprecated In JLS8 and later, use {@link #internalExtraDimensions2Property()} instead.
     */
    abstract SimplePropertyDescriptor internalExtraDimensionsProperty();

    /**
     * Returns the structural property descriptor for the "extraDimensions" property of this node (element type:
     * {@link Dimension}) (added in JLS8 API).
     *
     * @return the property descriptor
     * @since 3.10
     */
    abstract ChildListPropertyDescriptor internalExtraDimensions2Property();

    /**
     * Returns the structural property descriptor for the "extraDimensions" property of this node (element type:
     * {@link Dimension}) (added in JLS8 API).
     *
     * @return the property descriptor
     * @since 3.10
     */
    public final ChildListPropertyDescriptor getExtraDimensions2Property() {
        return internalExtraDimensions2Property();
    }

    /**
     * Returns structural property descriptor for the "initializer" property of this node (child type:
     * {@link Expression}).
     *
     * @return the property descriptor
     * @since 3.1
     */
    abstract ChildPropertyDescriptor internalInitializerProperty();

    /**
     * Creates a new AST node for a variable declaration owned by the given AST. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    VariableDeclaration(AST ast) {
        super(ast);
        if (ast.apiLevel >= 8) {
            this.extraDimensions = new ASTNode.NodeList(getExtraDimensions2Property());
        }
    }

    /**
     * Returns the name of the variable declared in this variable declaration.
     *
     * @return the variable name node
     */
    public SimpleName getName() {
        if (this.variableName == null) {
            // lazy init must be thread-safe for readers
            synchronized (this) {
                if (this.variableName == null) {
                    this.variableName = postLazyInit(new SimpleName(this.ast), internalNameProperty());
                }
            }
        }
        return this.variableName;
    }

    /**
     * Sets the name of the variable declared in this variable declaration to the given name.
     *
     * @param variableName the new variable name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName variableName) {
        if (variableName == null) {
            throw new IllegalArgumentException();
        }
        ChildPropertyDescriptor p = internalNameProperty();
        ASTNode oldChild = this.variableName;
        preReplaceChild(oldChild, variableName, p);
        this.variableName = variableName;

    }

    /**
     * Returns the number of extra array dimensions over and above the explicitly-specified type. <p> For example,
     * <code>int x[][]</code> has a type of <code>int</code> and two extra array dimensions; <code>int[][] x</code> has
     * a type of <code>int[][]</code> and zero extra array dimensions. The two constructs have different ASTs, even
     * though there are really syntactic variants of the same variable declaration. </p> <p> In the JLS8 API, this
     * method is a convenience method that counts {@link #extraDimensions()}. </p>
     *
     * @return the number of extra array dimensions
     * @since 2.1
     */
    public int getExtraDimensions() {
        // more efficient than checking getAST().API_LEVEL
        if (this.extraDimensions == null) {
            // JLS2,3,4 behavior - bona fide property
            return this.extraArrayDimensions;
        } else {
            return this.extraDimensions.size();
        }
    }

    /**
     * Sets the number of extra array dimensions over and above the explicitly-specified type. <p> For example,
     * <code>int x[][]</code> has a type of <code>int</code> and two extra array dimensions; <code>int[][] x</code> has
     * a type of <code>int[][]</code> and zero extra array dimensions. The two constructs have different ASTs, even
     * though there are really syntactic variants of the same variable declaration. </p>
     *
     * @param dimensions the number of array dimensions
     * @exception IllegalArgumentException if the number of dimensions is negative
     * @exception UnsupportedOperationException if this operation is used in a JLS8 or later AST
     * @deprecated In the JLS8 API, this method is replaced by {@link #extraDimensions()} which contains a list of
     * {@link Dimension} nodes.
     * @since 2.1
     */
    public void setExtraDimensions(int dimensions) {
        internalSetExtraDimensions(dimensions);
    }

    /**
     * Internal synonym for deprecated method. Used to avoid deprecation warnings.
     *
     * @since 3.10
     */
    final void internalSetExtraDimensions(int dimensions) {
        // more efficient than just calling supportedOnlyIn2_3_4() to check
        if (this.extraDimensions != null) {
            supportedOnlyIn2_3_4();
        }
        if (dimensions < 0) {
            throw new IllegalArgumentException();
        }
        SimplePropertyDescriptor p = internalExtraDimensionsProperty();
        preValueChange();
        this.extraArrayDimensions = dimensions;

    }

    /**
     * Returns the live ordered list of extra dimensions with optional annotations (added in JLS8 API).
     *
     * @return the live list of extra dimensions with optional annotations (element type: {@link Dimension})
     * @exception UnsupportedOperationException if this operation is used below JLS8
     * @since 3.10
     */
    public List extraDimensions() {
        // more efficient than just calling unsupportedIn2_3_4() to check
        if (this.extraDimensions == null) {
            unsupportedIn2_3_4();
        }
        return this.extraDimensions;
    }

    /**
     * Returns the initializer of this variable declaration, or <code>null</code> if there is none.
     *
     * @return the initializer expression node, or <code>null</code> if there is none
     */
    public Expression getInitializer() {
        return this.optionalInitializer;
    }

    /**
     * Sets or clears the initializer of this variable declaration.
     *
     * @param initializer the initializer expression node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setInitializer(Expression initializer) {
        ChildPropertyDescriptor p = internalInitializerProperty();
        ASTNode oldChild = this.optionalInitializer;
        preReplaceChild(oldChild, initializer, p);
        this.optionalInitializer = initializer;

    }

}
