// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2006 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.text.edits;

/**
 * Thrown to indicate that an edit got added to a parent edit but the child edit somehow conflicts with the parent or
 * one of it siblings. <p> This class is not intended to be serialized. </p>
 *
 * @see TextEdit#addChild(TextEdit)
 *
 * @since 3.0
 */
public class MalformedTreeException extends RuntimeException {

    /**
     * Constructs a new malformed tree exception.
     *
     * @param message the detail message
     */
    public MalformedTreeException(String message) {
        super(message);
    }
}
