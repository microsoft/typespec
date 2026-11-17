// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * Module Modifier node - represents the modifiers for the requires directive in module declaration (added in JLS9 API).
 *
 * <pre>
 * ModuleModifier:
 *    <b>static</b>
 *    <b>transitive</b>
 * </pre>
 *
 * <p> The numeric values of these flags match the ones for class files as described in the Java Virtual Machine
 * Specification. Note that the value of <b>static</b> does <b>not</b> correspond to the value of
 * the <b>static</b> {@link Modifier} (<code>8</code>)! </p>
 *
 * @since 3.14
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public final class ModuleModifier extends ASTNode {

    /**
     * Creates a new unparented MODULE modifier node owned by the given AST. By default, the node has unspecified (but
     * legal) modifier. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    ModuleModifier(AST ast) {
        super(ast);

    }

    @Override
    void accept0(ASTVisitor visitor) {
        visitor.visit();
    }

    /**
     * Sets the module modifier keyword of this module modifier node.
     *
     * @exception IllegalArgumentException if the argument is <code>null</code>
     */
    public void setKeyword() {

        preValueChange();

    }

    @Override
    int getNodeType0() {
        return 99;
    }
}
