// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2022 IBM Corporation and others.
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
 * Modifier node.
 *
 * <pre>
 * Modifier:
 *    <b>public</b>
 *    <b>protected</b>
 *    <b>private</b>
 *    <b>static</b>
 *    <b>abstract</b>
 *    <b>final</b>
 *    <b>native</b>
 *    <b>synchronized</b>
 *    <b>transient</b>
 *    <b>volatile</b>
 *    <b>strictfp</b>
 *    <b>default</b>
 * </pre>
 *
 * <p> The node records only the source range of its keyword, not which keyword it is. </p>
 *
 * @since 2.0
 */
public final class Modifier extends ASTNode implements IExtendedModifier {

    /**
     * Creates a new unparented modifier node owned by the given AST. <p> N.B. This constructor is package-private.
     * </p>
     *
     * @param ast the AST that is to own this node
     * @since 3.0
     */
    Modifier(AST ast) {
        super(ast);

    }

    @Override
    void accept0(ASTVisitor visitor) {
    }

    @Override
    int getNodeType0() {
        return 83;
    }

    /**
     * @see IExtendedModifier#isAnnotation()
     */
    @Override
    public boolean isAnnotation() {
        return false;
    }

    /**
     * @see IExtendedModifier#isModifier()
     */
    @Override
    public boolean isModifier() {
        return true;
    }
}
