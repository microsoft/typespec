// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2013, 2014 IBM Corporation and others.
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
 * Abstract base class of all AST node types that represent a method reference expression (added in JLS8 API).
 *
 * <pre>
 * MethodReference:
 *    CreationReference
 *    ExpressionMethodReference
 *    SuperMethodReference
 *    TypeMethodReference
 * </pre>
 *
 * <p> A method reference that is represented by a simple or qualified name, followed by <code>::</code>, followed by a
 * simple name can be represented as {@link ExpressionMethodReference} or as {@link TypeMethodReference}. The ASTParser
 * currently prefers the first form. </p>
 *
 * @see CreationReference
 * @see ExpressionMethodReference
 * @see SuperMethodReference
 * @see TypeMethodReference
 * @since 3.10
 */
public abstract class MethodReference extends Expression {

    /**
     * The type arguments (element type: {@link Type}). Defaults to an empty list (see constructor).
     */
    ASTNode.NodeList<Type> typeArguments;

    /**
     * Creates and returns a structural property descriptor for the "typeArguments" property declared on the given
     * concrete node type (element type: {@link Type}).
     *
     * @return the property descriptor
     */
    static ChildListPropertyDescriptor internalTypeArgumentsFactory() {
        return new ChildListPropertyDescriptor(Type.class, false);
    }

    /**
     * Returns the structural property descriptor for the "typeArguments" property of this node (element type:
     * {@link Type}).
     *
     * @return the property descriptor
     */
    abstract ChildListPropertyDescriptor internalTypeArgumentsProperty();

    /**
     * Returns the structural property descriptor for the "typeArguments" property of this node (element type:
     * {@link Type}).
     *
     * @return the property descriptor
     */
    public final ChildListPropertyDescriptor getTypeArgumentsProperty() {
        return internalTypeArgumentsProperty();
    }

    /**
     * Creates a new AST node for a method reference owned by the given AST. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    MethodReference(AST ast) {
        super(ast);
        this.typeArguments = new ASTNode.NodeList<>(getTypeArgumentsProperty());
    }

}
