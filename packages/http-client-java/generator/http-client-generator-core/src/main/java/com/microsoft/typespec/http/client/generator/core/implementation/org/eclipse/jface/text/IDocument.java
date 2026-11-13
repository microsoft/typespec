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
 * Copyright (c) 2000, 2016 IBM Corporation and others.
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
 * Copyright (c) 2000, 2016 IBM Corporation and others.
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
 * Copyright (c) 2000, 2007 IBM Corporation and others.
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
 * Copyright (c) 2007, 2010 IBM Corporation and others.
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
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime.ISafeRunnable;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime.ListenerList;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime.SafeRunner;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * An <code>IDocument</code> represents text providing support for <ul> <li> text manipulation <li> positions <li> line
 * information <li> document change listeners </ul>
 *
 * A document allows to set its content and to manipulate it. For manipulation a document provides the
 * <code>replace</code> method which substitutes a given string for a specified text range in the document. On each
 * document change, all registered document listeners are informed exactly once. <p> Positions are stickers to the
 * document's text that are updated when the document is changed. Positions are updated by {@link IPositionUpdater}s.
 * Position updaters are managed as a list. The list defines the sequence in which position updaters are invoked. This
 * way, position updaters may rely on each other. The document keeps its positions in a default position category,
 * ordered by offset, for which a default position updater is installed.</p> <p> An <code>IDocument</code> provides
 * methods to map line numbers and character positions onto each other based on the document's line delimiters, which
 * are "\n", "\r", and "\r\n". An <code>IDocument</code> does not care about mixed line delimiters.</p> <p>
 * <code>IDocument</code> throws <code>BadLocationException</code> if the parameters of queries or manipulation requests
 * are not inside the bounds of the document. </p> <p> The document uses a {@link GapTextStore} wrapped inside a
 * {@link CopyOnWriteTextStore} as text store and records a modification stamp for each change. </p> <p>
 * <strong>Performance:</strong> The implementation should perform reasonably well for typical source code documents.
 * It is not designed for very large documents of a size of several megabytes. Space-saving implementations are
 * initially used for both the text store and the line tracker; the first modification after a set incurs the cost to
 * transform the document structures to efficiently handle updates. </p> <p> See {@link GapTextStore} and
 * {@link TreeLineTracker} for algorithmic behavior of the used document structures. </p>
 *
 * @since 2.0
 */
public class IDocument {

    /** The document's text store */
    private ITextStore fStore;
    /** The document's line tracker */
    private ILineTracker fTracker;
    /** The registered document listeners */
    private final ListenerList<IDocumentListener> fDocumentListeners = new ListenerList<>();
    /** The registered pre-notified document listeners */
    private final ListenerList<IDocumentListener> fPrenotifiedDocumentListeners = new ListenerList<>();
    /** All positions managed by the document ordered by their start positions. */
    private final Map<String, List<Position>> fPositions = new HashMap<>();
    /**
     * All positions managed by the document ordered by their end positions.
     *
     * @since 3.4
     */
    private final Map<String, List<Position>> fEndPositions = new HashMap<>();
    /** All registered document position updaters */
    private final List<IPositionUpdater> fPositionUpdaters = new CopyOnWriteArrayList<>();
    /**
     * The current modification stamp.
     *
     * @since 3.1
     */
    private long fModificationStamp = getNextModificationStamp();
    /**
     * Keeps track of next modification stamp.
     *
     * @since 3.1.1
     */
    private long fNextModificationStamp = -1L;

    /**
     * Returns the document's text store. Assumes that the document has been initialized with a text store.
     *
     * @return the document's text store
     */
    protected ITextStore getStore() {
        Assert.isNotNull(fStore);
        return fStore;
    }

    /**
     * Returns the document's line tracker. Assumes that the document has been initialized with a line tracker.
     *
     * @return the document's line tracker
     */
    protected ILineTracker getTracker() {
        Assert.isNotNull(fTracker);
        return fTracker;
    }

    /**
     * Sets the document's text store. Must be called at the beginning of the constructor.
     *
     * @param store the document's text store
     */
    protected void setTextStore(ITextStore store) {
        fStore = store;
    }

    /**
     * Sets the document's line tracker. Must be called at the beginning of the constructor.
     *
     * @param tracker the document's line tracker
     */
    protected void setLineTracker(ILineTracker tracker) {
        fTracker = tracker;
    }

    /**
     * Initializes document listeners, positions, and position updaters. Must be called inside the constructor after the
     * implementation plug-ins have been set.
     */
    protected void completeInitialization() {
        addPositionCategory();
        addPositionUpdater(new IPositionUpdater());
    }

    /**
     * Registers the document listener with the document. After registration the IDocumentListener is informed about
     * each change of this document. If the listener is already registered nothing happens.<p> An
     * <code>IDocumentListener</code> may call back to this method when being inside a document notification.
     *
     * @param listener the listener to be registered
     */
    public void addDocumentListener(IDocumentListener listener) {
        Assert.isNotNull(listener);
        fDocumentListeners.add(listener);
    }

    /**
     * Removes the listener from the document's list of document listeners. If the listener is not registered with the
     * document nothing happens.<p> An <code>IDocumentListener</code> may call back to this method when being inside a
     * document notification.
     *
     * @param listener the listener to be removed
     */
    public void removeDocumentListener(IDocumentListener listener) {
        Assert.isNotNull(listener);
        fDocumentListeners.remove(listener);
    }

    public void addPositionCategory() {

        {
        }

        if (!containsPositionCategory()) {
            fPositions.put("__dflt_position_category", new ArrayList<>());
            fEndPositions.put("__dflt_position_category", new ArrayList<>());
        }
    }

    public void addPositionUpdater(IPositionUpdater updater) {
        insertPositionUpdater(updater, fPositionUpdaters.size());
    }

    public boolean containsPositionCategory() {

        {
            return fPositions.containsKey("__dflt_position_category");
        }
    }

    /**
     * Computes the index in the list of positions at which a position with the given position would be inserted. The
     * position to insert is supposed to become the first in this list of all positions with the same position.
     *
     * @param positions the list in which the index is computed
     * @param offset the offset for which the index is computed
     * @param orderedByOffset <code>true</code> if ordered by offset, false if ordered by end position
     * @return the computed index
     * @since 3.4
     */
    protected int computeIndexInPositionList(List<? extends Position> positions, int offset, boolean orderedByOffset) {
        if (positions.isEmpty()) {
            return 0;
        }

        int left = 0;
        int right = positions.size() - 1;
        int mid;
        Position p;

        while (left < right) {
            mid = (left + right) / 2;

            p = positions.get(mid);
            int pOffset = getOffset(orderedByOffset, p);
            if (offset < pOffset) {
                if (left == mid) {
                    right = left;
                } else {
                    right = mid - 1;
                }
            } else if (offset > pOffset) {
                if (right == mid) {
                    left = right;
                } else {
                    left = mid + 1;
                }
            } else {
                left = right = mid;
            }
        }

        int pos = left;
        p = positions.get(pos);
        int pPosition = getOffset(orderedByOffset, p);
        if (offset > pPosition) {
            // append to the end
            pos++;
        } else {
            // entry will become the first of all entries with the same offset
            do {
                --pos;
                if (pos < 0) {
                    break;
                }
                p = positions.get(pos);
                pPosition = getOffset(orderedByOffset, p);
            } while (offset == pPosition);
            ++pos;
        }

        Assert.isTrue(pos <= positions.size());

        return pos;
    }

    /*
     * @since 3.4
     */
    private int getOffset(boolean orderedByOffset, Position position) {
        if (orderedByOffset || position.getLength() == 0) {
            return position.getOffset();
        }
        return position.getOffset() + position.getLength() - 1;
    }

    /**
     * Fires the given document event to all registers document listeners informing them about the forthcoming document
     * manipulation. Uses a robust iterator.
     *
     * @param event the event to be sent out
     */
    protected void fireDocumentAboutToBeChanged(DocumentEvent event) {

        for (IDocumentListener listener : fPrenotifiedDocumentListeners) {
            try {
                listener.documentAboutToBeChanged(event);
            } catch (Exception ex) {
                log(ex);
            }
        }

        for (IDocumentListener listener : fDocumentListeners) {
            try {
                listener.documentAboutToBeChanged(event);
            } catch (Exception ex) {
                log(ex);
            }
        }
    }

    /**
     * Updates document partitioning and document positions according to the specification given by the document event.
     *
     * @param event the document event describing the change to which structures must be adapted
     */
    protected void updateDocumentStructures(DocumentEvent event) {
        if (!fPositions.isEmpty()) {
            updatePositions(event);
        }
    }

    /**
     * Notifies all listeners about the given document change. Uses a robust iterator. <p> Executes all registered post
     * notification replace operation.
     *
     * @param event the event to be sent out.
     */
    protected void doFireDocumentChanged(DocumentEvent event) {
        doFireDocumentChanged2(event);
    }

    /**
     * Notifies all listeners about the given document change. Uses a robust iterator. <p> Executes all registered post
     * notification replace operation. <p> This method will be renamed to <code>doFireDocumentChanged</code>.
     *
     * @param event the event to be sent out
     * @since 3.0
     */
    protected void doFireDocumentChanged2(DocumentEvent event) {
        for (IDocumentListener listener : fPrenotifiedDocumentListeners) {
            try {
                listener.documentChanged(event);
            } catch (Exception ex) {
                log(ex);
            }
        }

        for (IDocumentListener listener : fDocumentListeners) {
            try {
                listener.documentChanged(event);
            } catch (Exception ex) {
                log(ex);
            }
        }
    }

    /**
     * Updates the internal document structures and informs all document listeners if listener notification has been
     * enabled. Otherwise it remembers the event to be sent to the listeners on resume.
     *
     * @param event the document event to be sent out
     */
    protected void fireDocumentChanged(DocumentEvent event) {
        updateDocumentStructures(event);
        doFireDocumentChanged(event);
    }

    /**
     * Returns the number of characters in this document.
     *
     * @return the number of characters in this document
     */
    public int getLength() {
        return getStore().getLength();
    }

    /**
     * Returns all positions of the given position category. The positions are ordered according to the category's
     * order. Manipulating this list does not affect the document, but manipulating the position does affect the
     * document.
     *
     * @return the list of all positions
     * @exception BadPositionCategoryException if category is undefined in this document
     */
    public Position[] getPositions() throws BadPositionCategoryException {

        List<Position> c = fPositions.get("__dflt_position_category");
        if (c == null) {
            throw new BadPositionCategoryException();
        }

        Position[] positions = new Position[c.size()];
        c.toArray(positions);
        return positions;
    }

    /**
     * Returns this document's complete text.
     *
     * @return the document's complete text
     */
    public String get() {
        return getStore().get(0, getLength());
    }

    /**
     * Returns this document's text for the specified range.
     *
     * @param pos the document offset
     * @param length the length of the specified range
     * @return the document's text for the specified range
     * @exception BadLocationException if the range is invalid in this document
     */
    public String get(int pos, int length) throws BadLocationException {
        int myLength = getLength();
        if ((0 > pos) || (0 > length) || (pos + length > myLength)) {
            throw new BadLocationException();
        }
        return getStore().get(pos, length);
    }

    public void insertPositionUpdater(IPositionUpdater updater, int index) {
        for (IPositionUpdater u : fPositionUpdaters) {
            if (u == updater) {
                return;
            }
        }
        fPositionUpdaters.add(index, updater);
    }

    /**
     * Removes the given position from the specified position category. If the position is not part of the specified
     * category nothing happens. If the position has been added multiple times, only the first occurrence is deleted.
     *
     * @param position the position to be deleted
     * @exception BadPositionCategoryException if category is undefined in this document
     */
    public void removePosition(Position position) throws BadPositionCategoryException {
        if (position == null) {
            return;
        }

        List<Position> c = fPositions.get("__dflt_position_category");
        if (c == null) {
            throw new BadPositionCategoryException();
        }
        removeFromPositionsList(c, position, true);

        List<Position> endPositions = fEndPositions.get("__dflt_position_category");
        if (endPositions == null) {
            throw new BadPositionCategoryException();
        }
        removeFromPositionsList(endPositions, position, false);
    }

    /**
     * Remove the given position form the given list of positions based on identity not equality.
     *
     * @param positions a list of positions
     * @param position the position to remove
     * @param orderedByOffset true if <code>positions</code> is ordered by offset, false if ordered by end position
     * @since 3.4
     */
    private void removeFromPositionsList(List<Position> positions, Position position, boolean orderedByOffset) {
        int size = positions.size();

        // Assume position is somewhere near it was before
        int index = computeIndexInPositionList(positions,
            orderedByOffset ? position.offset : position.offset + position.length - 1, orderedByOffset);
        if (index < size && positions.get(index) == position) {
            positions.remove(index);
            return;
        }

        int back = index - 1;
        int forth = index + 1;
        while (back >= 0 || forth < size) {
            if (back >= 0) {
                if (position == positions.get(back)) {
                    positions.remove(back);
                    return;
                }
                back--;
            }

            if (forth < size) {
                if (position == positions.get(forth)) {
                    positions.remove(forth);
                    return;
                }
                forth++;
            }
        }
    }

    private long getNextModificationStamp() {
        if (fNextModificationStamp == Long.MAX_VALUE || fNextModificationStamp == -1L) {
            fNextModificationStamp = 0;
        } else {
            fNextModificationStamp = fNextModificationStamp + 1;
        }

        return fNextModificationStamp;
    }

    /**
     * Returns the modification stamp of this document. The modification stamp is updated each time a modifying
     * operation is called on this document. If two modification stamps of the same document are identical then the
     * document content is too, however, same content does not imply same modification stamp. <p> The magnitude or sign
     * of the numerical difference between two modification stamps is not significant. </p>
     *
     * @return the modification stamp of this document or <code>-1</code> if it is unknown
     */
    public long getModificationStamp() {
        return fModificationStamp;
    }

    public void replace(int pos, int length, String text, long modificationStamp) throws BadLocationException {
        if ((0 > pos) || (0 > length) || (pos + length > getLength())) {
            throw new BadLocationException();
        }

        DocumentEvent e = new DocumentEvent(this, pos, length, text);
        fireDocumentAboutToBeChanged(e);

        getStore().replace(pos, length, text);
        getTracker().replace(pos, length, text);

        fModificationStamp = modificationStamp;
        fNextModificationStamp = Math.max(fModificationStamp, fNextModificationStamp);
        e.fModificationStamp = fModificationStamp;

        fireDocumentChanged(e);
    }

    /**
     * Substitutes the given text for the specified document range. Sends a <code>DocumentEvent</code> to all registered
     * <code>IDocumentListener</code>.
     *
     * @param pos the document offset
     * @param length the length of the specified range
     * @param text the substitution text
     * @exception BadLocationException if the offset is invalid in this document
     * @see DocumentEvent
     * @see IDocumentListener
     */
    public void replace(int pos, int length, String text) throws BadLocationException {
        if (length == 0 && (text == null || text.isEmpty())) {
            replace(pos, length, text, getModificationStamp());
        } else {
            replace(pos, length, text, getNextModificationStamp());
        }
    }

    /**
     * Updates all positions of all categories to the change described by the document event. All registered document
     * updaters are called in the sequence they have been arranged. Uses a robust iterator.
     *
     * @param event the document event describing the change to which to adapt the positions
     */
    protected void updatePositions(DocumentEvent event) {
        for (IPositionUpdater u : fPositionUpdaters) {
            u.update(event);
        }
    }

    /**
     * Logs the given exception by reusing the code in {@link SafeRunner}.
     *
     * @param ex the exception
     * @since 3.6
     */
    private static void log(final Exception ex) {
        SafeRunner.run(new ISafeRunnable(ex));
    }

    /**
     * Creates a new document with the given initial content.
     *
     * @param initialContent the document's initial content
     */
    public IDocument(String initialContent) {
        super();
        setTextStore(new CopyOnWriteTextStore(new GapTextStore()));
        setLineTracker(new ILineTrackerExtension());
        getStore().set(initialContent);
        getTracker().set(initialContent);
        completeInitialization();
    }
}
