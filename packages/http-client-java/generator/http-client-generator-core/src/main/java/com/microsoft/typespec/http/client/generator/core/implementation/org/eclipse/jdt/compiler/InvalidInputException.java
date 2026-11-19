// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2008 IBM Corporation and others.
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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

/**
 * Exception thrown by a scanner when encountering lexical errors.
 *
 * @noextend This class is not intended to be subclassed by clients.
 */
public class InvalidInputException extends Exception {

    /**
     * Creates a new exception with no detail message.
     */
    public InvalidInputException() {
        super();
    }

    /**
     * Creates a new exception with the given detail message.
     *
     * @param message the detail message
     */
    public InvalidInputException(String message) {
        super(message);
    }
}
