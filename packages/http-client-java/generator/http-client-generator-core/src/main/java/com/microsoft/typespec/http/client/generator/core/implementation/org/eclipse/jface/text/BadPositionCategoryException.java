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
 * Indicates the attempt to access a non-existing position category in a document. <p> This class is not intended to be
 * serialized. </p>
 *
 */
public class BadPositionCategoryException extends Exception {

    /**
     * Creates a new bad position category exception.
     *
     */
    public BadPositionCategoryException() {
        super("__dflt_position_category");
    }
}
