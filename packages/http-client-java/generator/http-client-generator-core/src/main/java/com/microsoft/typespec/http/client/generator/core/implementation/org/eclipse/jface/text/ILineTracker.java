// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2009 IBM Corporation and others.
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
 * A line tracker maps character positions to line numbers and vice versa. Initially the line tracker is informed about
 * its underlying text in order to initialize the mapping information. After that, the line tracker is informed about
 * all changes of the underlying text allowing for incremental updates of the mapping information. It is the client's
 * responsibility to actively inform the line tacker about text changes. For example, when using a line tracker in
 * combination with a document the document controls the line tracker. <p> The standard implementation is
 * {@link ILineTrackerExtension}. </p>
 */
public interface ILineTracker {

    /**
     * Informs the line tracker about the specified change in the tracked text.
     *
     * @param offset the offset of the replaced text
     * @param length the length of the replaced text
     * @param text the substitution text
     * @exception BadLocationException if specified range is unknown to this tracker
     */
    void replace(int offset, int length, String text) throws BadLocationException;

    /**
     * Sets the tracked text to the specified text.
     *
     * @param text the new tracked text
     */
    void set(String text);
}
