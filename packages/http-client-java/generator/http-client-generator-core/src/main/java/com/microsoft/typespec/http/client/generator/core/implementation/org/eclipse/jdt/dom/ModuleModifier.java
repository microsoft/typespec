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
 * <p> The node records only the source range of its keyword, not which keyword it is. </p>
 *
 * @since 3.14
 */
public final class ModuleModifier extends ASTNode {

    /**
     * Creates a new unparented module modifier node owned by the given AST. <p> N.B. This constructor is
     * package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    ModuleModifier(AST ast) {
        super(ast);

    }

    @Override
    void accept0(ASTVisitor visitor) {
    }

    @Override
    int getNodeType0() {
        return 99;
    }
}
