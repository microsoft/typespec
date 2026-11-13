// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2010 IBM Corporation and others.
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

/**
 * A position updater is responsible for adapting document positions. When installed on a document, the position updater
 * updates the document's positions to changes applied to this document. Document updaters can be selective, i.e. they
 * might only update positions of a certain category. <p> Position updaters are of primary importance for the definition
 * of the semantics of positions. <p> Clients may implement this interface or use the standard implementation
 * {@link com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IPositionUpdater}.
 * </p>
 *
 * Default implementation of
 * {@link com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IPositionUpdater}. <p>
 * A default position updater must be
 * configured with the position category whose positions it will update. Other position categories are not affected by
 * this updater. </p> <p> This implementation follows the specification below: </p> <ul> <li>Inserting or deleting text
 * before the position shifts the position accordingly.</li> <li>Inserting text at the position offset shifts the
 * position accordingly.</li> <li>Inserting or deleting text strictly contained by the position shrinks or stretches the
 * position.</li> <li>Inserting or deleting text after a position does not affect the position.</li> <li>Deleting text
 * which strictly contains the position deletes the position. Note that the position is not deleted if its only shrunken
 * to length zero. To delete a position, the modification must delete from <i>strictly before</i> to <i>strictly
 * after</i> the position.</li> <li>Replacing text contained by the position shrinks or expands the position (but does
 * not shift it), such that the final position contains the original position and the replacing text.</li> <li>Replacing
 * text overlapping the position in other ways is considered as a sequence of first deleting the replaced text and
 * afterwards inserting the new text. Thus, a position is shrunken and can then be shifted (if the replaced text
 * overlaps the offset of the position).</li> </ul> This class can be used as is or be adapted by subclasses. Fields are
 * protected to allow subclasses direct access. Because of the frequency with which position updaters are used this is a
 * performance decision.
 *
 */
public class IPositionUpdater {

    /** Caches the currently investigated position */
    protected Position fPosition;
    /** Caches the original state of the investigated position */
    protected Position fOriginalPosition = new Position();

    /** Caches the offset of the replaced text */
    protected int fOffset;
    /** Caches the length of the replaced text */
    protected int fLength;
    /** Caches the length of the newly inserted text */
    protected int fReplaceLength;
    /** Caches the document */
    protected IDocument fDocument;

    /**
     * Creates a new default position updater for the given category.
     *
     */
    public IPositionUpdater() {

    }

    /**
     * Adapts the currently investigated position to an insertion.
     */
    protected void adaptToInsert() {
        int myStart = fPosition.offset;
        int myEnd = fPosition.offset + fPosition.length - 1;
        myEnd = Math.max(myStart, myEnd);

        int yoursStart = fOffset;

        if (myEnd < yoursStart) {
            return;
        }

        if (myStart < yoursStart) {
            fPosition.length += fReplaceLength;
        } else {
            fPosition.offset += fReplaceLength;
        }
    }

    /**
     * Adapts the currently investigated position to a deletion.
     */
    protected void adaptToRemove() {
        int myStart = fPosition.offset;
        int myEnd = fPosition.offset + fPosition.length - 1;
        myEnd = Math.max(myStart, myEnd);

        int yoursStart = fOffset;
        int yoursEnd = fOffset + fLength - 1;
        yoursEnd = Math.max(yoursStart, yoursEnd);

        if (myEnd < yoursStart) {
            return;
        }

        if (myStart <= yoursStart) {
            if (yoursEnd <= myEnd) {
                fPosition.length -= fLength;
            } else {
                fPosition.length -= (myEnd - yoursStart + 1);
            }
        } else {
            if (yoursEnd < myStart) {
                fPosition.offset -= fLength;
            } else {
                fPosition.offset -= (myStart - yoursStart);
                fPosition.length -= (yoursEnd - myStart + 1);
            }
        }

        // validate position to allowed values
        if (fPosition.offset < 0) {
            fPosition.offset = 0;
        }

        if (fPosition.length < 0) {
            fPosition.length = 0;
        }
    }

    /**
     * Adapts the currently investigated position to the replace operation. First it checks whether the change replaces
     * only a non-zero range inside the range of the position (including the borders). If not, it performs first the
     * deletion of the previous text and afterwards the insertion of the new text.
     */
    protected void adaptToReplace() {
        if (fLength > 0 && fPosition.offset <= fOffset && fOffset + fLength <= fPosition.offset + fPosition.length) {
            fPosition.length += fReplaceLength - fLength;
        } else {
            if (fLength > 0) {
                adaptToRemove();
            }

            if (fReplaceLength > 0) {
                adaptToInsert();
            }
        }
    }

    /**
     * Determines whether the currently investigated position has been deleted by the replace operation specified in the
     * current event. If so, it deletes the position and removes it from the document's position category.
     *
     * @return <code>true</code> if position has not been deleted
     */
    protected boolean notDeleted() {
        if (fOffset < fPosition.offset && (fPosition.offset + fPosition.length < fOffset + fLength)) {
            fPosition.delete();

            try {
                fDocument.removePosition(fPosition);
            } catch (BadPositionCategoryException x) {
            }

            return false;
        }

        return true;
    }

    /**
     * Adapts positions to the change specified by the document event. It is ensured that the document's partitioning
     * has been adapted to this document change and that all the position updaters which have a smaller index in the
     * document's position updater list have been called.
     *
     * @param event the document event describing the document change
     */
    public void update(DocumentEvent event) {
        try {
            fOffset = event.getOffset();
            fLength = event.getLength();
            fReplaceLength = (event.getText() == null ? 0 : event.getText().length());
            fDocument = event.getDocument();

            Position[] category = fDocument.getPositions();
            for (Position element : category) {
                fPosition = element;
                fOriginalPosition.offset = fPosition.offset;
                fOriginalPosition.length = fPosition.length;

                if (notDeleted()) {
                    adaptToReplace();
                }
            }
        } catch (BadPositionCategoryException x) {
            // do nothing
        } finally {
            fDocument = null;
        }
    }
}
