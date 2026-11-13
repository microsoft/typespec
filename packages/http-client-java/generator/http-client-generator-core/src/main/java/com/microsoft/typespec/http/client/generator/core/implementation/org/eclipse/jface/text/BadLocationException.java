// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2005 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text;

/**
 * Indicates the attempt to access a non-existing position. The attempt has been performed on a text store such as a
 * document or string. <p> This class is not intended to be serialized. </p>
 */
public class BadLocationException extends Exception {

    /**
     * Creates a new bad location exception.
     */
    public BadLocationException() {
        super();
    }

    /**
     * Creates a new bad location exception.
     *
     * @param message the exception message
     */
    public BadLocationException(String message) {
        super(message);
    }
}
