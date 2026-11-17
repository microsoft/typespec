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
    SimpleName variableName;

    /**
     * List of extra dimensions this node has with optional annotations (element type: {@link Dimension}); defaults to
     * an empty list (see constructor).
     *
     * @since 3.10
     */
    final ASTNode.NodeList extraDimensions;

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
    static ChildPropertyDescriptor internalNamePropertyFactory() {
        return new ChildPropertyDescriptor(SimpleName.class, false);
    }

    /**
     * Creates and returns a structural property descriptor for the "extraDimensions2" property declared on the given
     * concrete node type (element type: {@link Dimension}).
     *
     * @return the property descriptor
     */
    static ChildListPropertyDescriptor internalExtraDimensions2PropertyFactory() {
        return new ChildListPropertyDescriptor(Dimension.class, true);
    }

    /**
     * Creates and returns a structural property descriptor for the "initializer" property declared on the given
     * concrete node type (child type: {@link Expression}).
     *
     * @return the property descriptor
     */
    static ChildPropertyDescriptor internalInitializerPropertyFactory() {
        return new ChildPropertyDescriptor(Expression.class, true);
    }

    /**
     * Returns structural property descriptor for the "name" property of this node (child type: {@link SimpleName}).
     *
     * @return the property descriptor
     * @since 3.1
     */
    abstract ChildPropertyDescriptor internalNameProperty();

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
        this.extraDimensions = new ASTNode.NodeList(getExtraDimensions2Property());
    }

    /**
     * Returns the name of the variable declared in this variable declaration.
     *
     * @return the variable name node
     */
    public SimpleName getName() {
        if (this.variableName == null) {
            this.variableName = postLazyInit(new SimpleName(this.ast), internalNameProperty());
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

        ChildPropertyDescriptor p = internalNameProperty();
        ASTNode oldChild = this.variableName;
        preReplaceChild(oldChild, variableName, p);
        this.variableName = variableName;

    }

    /**
     * Returns the number of extra array dimensions over and above the explicitly-specified type. <p> For example,
     * <code>int x[][]</code> has a type of <code>int</code> and two extra array dimensions; <code>int[][] x</code> has
     * a type of <code>int[][]</code> and zero extra array dimensions. The two constructs have different ASTs, even
     * though there are really syntactic variants of the same variable declaration. </p> <p> This is a convenience
     * method that counts {@link #extraDimensions()}. </p>
     *
     * @return the number of extra array dimensions
     * @since 2.1
     */
    public int getExtraDimensions() {
        return this.extraDimensions.size();
    }

    /**
     * Returns the live ordered list of extra dimensions with optional annotations (added in JLS8 API).
     *
     * @return the live list of extra dimensions with optional annotations (element type: {@link Dimension})
     * @since 3.10
     */
    public List extraDimensions() {
        // more efficient than just calling unsupportedIn2_3_4() to check

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
