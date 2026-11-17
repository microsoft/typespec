// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
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
 * Abstract base class of AST nodes that represent module directives (added in JLS9 API).
 *
 * <pre>
 * ModuleDirective:
 *    {@link RequiresDirective}
 *    {@link ExportsDirective}
 *    {@link OpensDirective}
 *    {@link UsesDirective}
 *    {@link ProvidesDirective}
 * </pre>
 *
 * @noextend This class is not intended to be subclassed by clients.
 * @since 3.14
 */
public abstract class ModuleDirective extends ASTNode {

    ModuleDirective(AST ast) {
        super(ast);

    }
}
