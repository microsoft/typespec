// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2024 IBM Corporation and others.
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

/*
 * Copyright (c) 2000, 2024 IBM Corporation and others.
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 * SPDX-License-Identifier: EPL-2.0
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *## compiler messages.
 *## compilation
 */
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util;

@SuppressWarnings({ "rawtypes", "unchecked" })
public abstract class Messages {

    /**
     * Bind the given message's substitution locations with the given string values.
     *
     * @param message the message to be manipulated
     * @return the manipulated String
     */
    public static String bind(String message) {
        return bind(message, null);
    }

    /**
     * Bind the given message's substitution locations with the given string values.
     *
     * @param message the message to be manipulated
     * @param binding the object to be inserted into the message
     * @return the manipulated String
     */
    public static String bind(String message, Object binding) {
        return bind(message, new Object[] { binding });
    }

    /**
     * Bind the given message's substitution locations with the given string values.
     *
     * @param message the message to be manipulated
     * @param bindings An array of objects to be inserted into the message
     * @return the manipulated String
     */
    public static String bind(String message, Object[] bindings) {
        return new java.text.MessageFormat(message, java.util.Locale.ENGLISH).format(bindings);
    }
}
