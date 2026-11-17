// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2014 IBM Corporation and others.
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
 * Common interface for AST nodes that represent modifiers or annotations.
 *
 * <pre>
 * IExtendedModifier:
 *   Modifier
 *   Annotation
 * </pre>
 *
 * @since 3.1
 * @noextend This interface is not intended to be extended by clients.
 * @noimplement This interface is not intended to be implemented by clients.
 */
public interface IExtendedModifier {

    /**
     * Returns whether this extended modifier is a standard modifier.
     *
     * @return <code>true</code> if this is a standard modifier (instance of {@link Modifier}), and <code>false</code>
     * otherwise
     */
    boolean isModifier();

    /**
     * Returns whether this extended modifier is an annotation.
     *
     * @return <code>true</code> if this is an annotation (instance of a subclass of {@link Annotation}), and
     * <code>false</code> otherwise
     */
    boolean isAnnotation();
}
