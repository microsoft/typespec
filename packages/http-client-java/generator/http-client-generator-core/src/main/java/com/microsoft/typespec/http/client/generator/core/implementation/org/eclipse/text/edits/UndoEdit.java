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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.text.edits;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.BadLocationException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IDocument;
import java.util.ArrayList;
import java.util.List;

/**
 * This class encapsulates the reverse changes of an executed text edit tree. To apply an undo memento to a document use
 * method <code>apply(IDocument)</code>. <p> Clients can't add additional children to an undo edit nor can they add an
 * undo edit as a child to another edit. Doing so results in both cases in a <code>MalformedTreeException</code>. </p>
 *
 * @since 3.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
public final class UndoEdit extends TextEdit {

    public UndoEdit() {
        super(0, Integer.MAX_VALUE);
    }

    @Override
    void internalAdd(TextEdit child) throws MalformedTreeException {
        throw new MalformedTreeException(TextEditMessages.getString("UndoEdit.no_children")); //$NON-NLS-1$
    }

    @Override
    void aboutToBeAdded(TextEdit parent) {
        throw new MalformedTreeException(TextEditMessages.getString("UndoEdit.can_not_be_added")); //$NON-NLS-1$
    }

    @Override
    UndoEdit dispatchPerformEdits(TextEditProcessor processor) throws BadLocationException {
        return processor.executeUndo();
    }

    @Override
    void dispatchCheckIntegrity(TextEditProcessor processor) throws MalformedTreeException {
        processor.checkIntegrityUndo();
    }

    @Override
    int performDocumentUpdating(IDocument document) {
        fDelta = 0;
        return fDelta;
    }

    public void add(ReplaceEdit edit) {
        List<TextEdit> children = internalGetChildren();
        if (children == null) {
            children = new ArrayList<>(2);
            internalSetChildren(children);
        }
        children.add(edit);
    }

    public void defineRegion(int offset, int length) {
        internalSetOffset(offset);
        internalSetLength(length);
    }

    @Override
    boolean deleteChildren() {
        return false;
    }
}
