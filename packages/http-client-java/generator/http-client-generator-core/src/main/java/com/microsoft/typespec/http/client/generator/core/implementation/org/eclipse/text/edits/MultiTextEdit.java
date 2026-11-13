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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IDocument;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IRegion;
import java.util.List;

/**
 * A multi-text edit can be used to aggregate several edits into one edit. The edit itself doesn't modify a document.
 * <p> Clients are allowed to implement subclasses of a multi-text edit.Subclasses must implement <code>doCopy()</code>
 * to ensure the a copy of the right type is created. Not implementing <code>doCopy()</code> in subclasses will result
 * in an assertion failure during copying.
 *
 * @since 3.0
 */
public class MultiTextEdit extends TextEdit {

    private boolean fDefined;

    /**
     * Creates a new <code>MultiTextEdit</code>. The range of the edit is determined by the range of its children.
     *
     * Adding this edit to a parent edit sets its range to the range covered by its children. If the edit doesn't have
     * any children its offset is set to the parent's offset and its length is set to 0.
     */
    public MultiTextEdit() {
        super(0, Integer.MAX_VALUE);
        fDefined = false;
    }

    @Override
    final boolean isDefined() {
        if (fDefined) {
            return true;
        }
        return hasChildren();
    }

    @Override
    public final int getOffset() {
        if (fDefined) {
            return super.getOffset();
        }

        List<TextEdit> children = internalGetChildren();
        if (children == null || children.isEmpty()) {
            return 0;
        }
        // the children are already sorted
        return children.get(0).getOffset();
    }

    @Override
    public final int getLength() {
        if (fDefined) {
            return super.getLength();
        }

        List<TextEdit> children = internalGetChildren();
        if (children == null || children.isEmpty()) {
            return 0;
        }
        // the children are already sorted
        TextEdit first = children.get(0);
        TextEdit last = children.get(children.size() - 1);
        return last.getOffset() - first.getOffset() + last.getLength();
    }

    @Override
    public final boolean covers(TextEdit other) {
        if (fDefined) {
            return super.covers(other);
        }
        // an undefined multiple text edit covers everything
        return true;
    }

    @Override
    protected boolean canZeroLengthCover() {
        return true;
    }

    @Override
    void adjustOffset(int delta) {
        if (fDefined) {
            super.adjustOffset(delta);
        }
    }

    @Override
    void adjustLength(int delta) {
        if (fDefined) {
            super.adjustLength(delta);
        }
    }

    @Override
    void performConsistencyCheck() throws MalformedTreeException {

    }

    @Override
    int performDocumentUpdating(IDocument document) {
        fDelta = 0;
        return fDelta;
    }

    @Override
    boolean deleteChildren() {
        return false;
    }

    @Override
    void aboutToBeAdded(TextEdit parent) {
        defineRegion(parent.getOffset());
    }

    void defineRegion(int parentOffset) {
        if (fDefined) {
            return;
        }
        if (hasChildren()) {
            IRegion region = getCoverage(getChildren());
            internalSetOffset(region.getOffset());
            internalSetLength(region.getLength());
        } else {
            internalSetOffset(parentOffset);
            internalSetLength(0);
        }
        fDefined = true;
    }

    @Override
    void internalToString(StringBuilder buffer, int indent) {
        super.internalToString(buffer, indent);
        if (!fDefined) {
            buffer.append(" [undefined]"); //$NON-NLS-1$
        }
    }
}
