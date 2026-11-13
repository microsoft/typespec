// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2015 IBM Corporation and others.
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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime.Assert;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.BadLocationException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IDocument;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IDocumentListener;
import java.util.ArrayList;
import java.util.List;

/**
 * A <code>TextEditProcessor</code> manages a set of edits and applies them as a whole to an <code>IDocument</code>. <p>
 * This class isn't intended to be subclassed.</p>
 *
 *
 * @since 3.0
 * @noextend This class is not intended to be subclassed by clients.
 */
public class TextEditProcessor {

    private final IDocument fDocument;
    private final TextEdit fRoot;

    private List<List<TextEdit>> fSourceEdits;

    /**
     * Constructs a new edit processor for the given document.
     *
     * @param document the document to manipulate
     * @param root the root of the text edit tree describing the modifications. By passing a text edit a a text edit
     * processor the ownership of the edit is transfered to the text edit processors. Clients must not modify the edit
     * (e.g adding new children) any longer.
     *
     */
    public TextEditProcessor(IDocument document, TextEdit root) {
        Assert.isNotNull(document);
        Assert.isNotNull(root);
        fDocument = document;
        fRoot = root;
        if (fRoot instanceof MultiTextEdit) {
            ((MultiTextEdit) fRoot).defineRegion(0);
        }

    }

    /**
     * Executes the text edits.
     *
     * @return an object representing the undo of the executed edits
     * @exception MalformedTreeException is thrown if the edit tree isn't in a valid state. This exception is thrown
     * before any edit is executed. So the document is still in its original state.
     * @exception BadLocationException is thrown if one of the edits in the tree can't be executed. The state of the
     * document is undefined if this exception is thrown.
     */
    public UndoEdit performEdits() throws MalformedTreeException, BadLocationException {
        fRoot.dispatchCheckIntegrity(this);
        return fRoot.dispatchPerformEdits(this);
    }

    void checkIntegrityDo() throws MalformedTreeException {
        fSourceEdits = new ArrayList<>();
        fRoot.traverseConsistencyCheck(this, fDocument);
        if (fRoot.getExclusiveEnd() > fDocument.getLength()) {
            throw new MalformedTreeException(TextEditMessages.getString("TextEditProcessor.invalid_length")); //$NON-NLS-1$
        }
    }

    void checkIntegrityUndo() {
        if (fRoot.getExclusiveEnd() > fDocument.getLength()) {
            throw new MalformedTreeException(TextEditMessages.getString("TextEditProcessor.invalid_length")); //$NON-NLS-1$
        }
    }

    UndoEdit executeDo() throws BadLocationException {
        IDocumentListener collector = new IDocumentListener(fRoot);
        try {
            collector.connect(fDocument);
            computeSources();
            fRoot.traverseDocumentUpdating(this, fDocument);
            fRoot.traverseRegionUpdating(0, false);
        } finally {
            collector.disconnect(fDocument);
        }
        return collector.undo;
    }

    private void computeSources() {
        for (List<TextEdit> list : fSourceEdits) {
            if (list != null) {
                for (TextEdit edit : list) {
                    java.util.Objects.requireNonNull(edit);
                }
            }
        }
    }

    UndoEdit executeUndo() throws BadLocationException {
        IDocumentListener collector = new IDocumentListener(fRoot);
        try {
            collector.connect(fDocument);
            TextEdit[] edits = fRoot.getChildren();
            for (int i = edits.length - 1; i >= 0; i--) {
                edits[i].performDocumentUpdating(fDocument);
            }
        } finally {
            collector.disconnect(fDocument);
        }
        return collector.undo;
    }

}
