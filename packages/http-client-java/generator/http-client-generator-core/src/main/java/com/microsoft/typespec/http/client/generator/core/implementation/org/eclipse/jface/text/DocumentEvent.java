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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime.Assert;

/**
 * Specification of changes applied to documents. All changes are represented as replace commands, i.e. specifying a
 * document range whose text gets replaced with different text. In addition to this information, the event also contains
 * the changed document.
 *
 */
public class DocumentEvent {

    /** The changed document */
    public IDocument fDocument;
    /** The document offset */
    public int fOffset;
    /** Length of the replaced document text */
    public int fLength;
    /** Text inserted into the document */
    public String fText = ""; //$NON-NLS-1$
    /**
     * The modification stamp of the document when firing this event.
     *
     * @since 3.1 and public since 3.3
     */
    public long fModificationStamp;

    /**
     * Creates a new document event.
     *
     * @param doc the changed document
     * @param offset the offset of the replaced text
     * @param length the length of the replaced text
     * @param text the substitution text
     */
    public DocumentEvent(IDocument doc, int offset, int length, String text) {
        Assert.isNotNull(doc);
        Assert.isTrue(offset >= 0);
        Assert.isTrue(length >= 0);

        fDocument = doc;
        fOffset = offset;
        fLength = length;
        fText = text;

        fModificationStamp = fDocument.getModificationStamp();
    }

    /**
     * Returns the changed document.
     *
     * @return the changed document
     */
    public IDocument getDocument() {
        return fDocument;
    }

    /**
     * Returns the offset of the change.
     *
     * @return the offset of the change
     */
    public int getOffset() {
        return fOffset;
    }

    /**
     * Returns the length of the replaced text.
     *
     * @return the length of the replaced text
     */
    public int getLength() {
        return fLength;
    }

    /**
     * Returns the text that has been inserted.
     *
     * @return the text that has been inserted
     */
    public String getText() {
        return fText;
    }

    @Override
    public String toString() {
        // $NON-NLS-1$
        return "offset: " //$NON-NLS-1$
            + fOffset + ", length: " //$NON-NLS-1$
            + fLength + ", timestamp: " //$NON-NLS-1$
            + fModificationStamp + "\ntext:>" //$NON-NLS-1$
            + fText + "<\n";
    }
}
