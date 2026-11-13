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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime.Assert;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.text.edits.ReplaceEdit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.text.edits.TextEdit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.text.edits.UndoEdit;

/**
 * Interface for objects which are interested in getting informed about document changes. A listener is informed about
 * document changes before they are applied and after they have been applied. It is ensured that the document event
 * passed into the listener is the same for the two notifications, i.e. the two document events can be checked using
 * object identity. <p> Clients may implement this interface. </p>
 *
 */
public class IDocumentListener {

    public UndoEdit undo;
    private final int fOffset;
    private int fLength;

    /**
     * @since 3.1
     */
    private String fLastCurrentText;

    public IDocumentListener(TextEdit root) {
        fOffset = root.getOffset();
        fLength = root.getLength();
    }

    public void connect(IDocument document) {
        document.addDocumentListener(this);
        undo = new UndoEdit();
    }

    public void disconnect(IDocument document) {
        if (undo != null) {
            document.removeDocumentListener(this);
            undo.defineRegion(fOffset, fLength);
        }
    }

    /**
     * The manipulation described by the document event has been performed.
     *
     * @param event the document event describing the document change
     */
    public void documentChanged(DocumentEvent event) {
        fLength += getDelta(event);
    }

    private static int getDelta(DocumentEvent event) {
        String text = event.getText();
        return text == null ? -event.getLength() : (text.length() - event.getLength());
    }

    /**
     * The manipulation described by the document event will be performed.
     *
     * @param event the document event describing the document change
     */
    public void documentAboutToBeChanged(DocumentEvent event) {
        int offset = event.getOffset();
        int currentLength = event.getLength();
        String currentText = null;
        try {
            currentText = event.getDocument().get(offset, currentLength);
        } catch (BadLocationException cannotHappen) {
            Assert.isTrue(false, "Can't happen"); //$NON-NLS-1$
        }

        /*
         * see https://bugs.eclipse.org/bugs/show_bug.cgi?id=93634 If the same string is replaced on many documents
         * (e.g. rename package), the size of the undo can be reduced by using the same String instance in all edits,
         * instead of using the unique String returned from IDocument.get(int, int).
         */
        if (fLastCurrentText != null && fLastCurrentText.equals(currentText)) {
            currentText = fLastCurrentText;
        } else {
            fLastCurrentText = currentText;
        }

        String newText = event.getText();
        undo.add(new ReplaceEdit(offset, newText != null ? newText.length() : 0, currentText));
    }
}
