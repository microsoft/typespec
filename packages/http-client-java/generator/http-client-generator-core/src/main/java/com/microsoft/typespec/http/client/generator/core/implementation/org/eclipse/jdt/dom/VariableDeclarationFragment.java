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
 * Variable declaration fragment AST node type, used in field declarations, local variable declarations,
 * <code>ForStatement</code> initializers, and <code>LambdaExpression</code> parameters. In contrast to
 * <code>SingleVariableDeclaration</code>, fragments are missing the modifiers and the type; these are either located in
 * the fragment's parent node, or inferred (for lambda parameters).
 *
 * <pre>
 * VariableDeclarationFragment:
 *    Identifier { Dimension } [ <b>=</b> Expression ]
 * </pre>
 *
 * @since 2.0
 */
public class VariableDeclarationFragment extends VariableDeclaration {

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = internalNamePropertyFactory();

    /**
     * The "extraDimensions2" structural property of this node type (element type: {@link Dimension}) (added in JLS8
     * API).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor EXTRA_DIMENSIONS2_PROPERTY
        = internalExtraDimensions2PropertyFactory();

    /**
     * The "initializer" structural property of this node type (child type: {@link Expression}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor INITIALIZER_PROPERTY = internalInitializerPropertyFactory();

    /**
     * Creates a new AST node for a variable declaration fragment owned by the given AST. By default, the variable
     * declaration has: an unspecified (but legal) variable name, no initializer, and no extra array dimensions. <p>
     * N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    VariableDeclarationFragment(AST ast) {
        super(ast);
    }

    @Override
    final ChildPropertyDescriptor internalNameProperty() {
        return NAME_PROPERTY;
    }

    @Override
    final ChildListPropertyDescriptor internalExtraDimensions2Property() {
        return EXTRA_DIMENSIONS2_PROPERTY;
    }

    @Override
    final ChildPropertyDescriptor internalInitializerProperty() {
        return INITIALIZER_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 59;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.extraDimensions);
            acceptChild(visitor, getInitializer());
        }

    }
}
