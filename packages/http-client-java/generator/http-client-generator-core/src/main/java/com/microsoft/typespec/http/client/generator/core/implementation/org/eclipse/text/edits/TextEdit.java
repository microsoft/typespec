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
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IRegion;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.Region;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * A text edit describes an elementary text manipulation operation. Edits are executed by applying them to a document
 * (e.g. an instance of <code>IDocument </code>). <p> Text edits form a tree. Clients can navigate the tree upwards,
 * from child to parent, as well as downwards. Newly created edits are un-parented. New edits are added to the tree by
 * calling one of the <code>add</code> methods on a parent edit. </p> <p> An edit tree is well formed in the following
 * sense: </p> <ul> <li>a parent edit covers all its children</li> <li>children don't overlap</li> <li>an edit with
 * length 0 can't have any children</li> </ul> <p> Any manipulation of the tree that violates one of the above
 * requirements results in a <code>MalformedTreeException</code>. </p> <p> Insert edits are represented by an edit of
 * length 0. If more than one insert edit exists at the same offset then the edits are executed in the order in which
 * they have been added to a parent. The following code example: </p>
 *
 * <pre>
 * IDocument document = new IDocument("org");
 * MultiTextEdit edit = new MultiTextEdit();
 * edit.addChild(new ReplaceEdit(0, 0, "www."));
 * edit.addChild(new ReplaceEdit(0, 0, "eclipse."));
 * edit.apply(document);
 * </pre>
 *
 * <p> therefore results in string: "www.eclipse.org". </p> <p> Executing text edits updates each edit's region to
 * reflect the edit's position in the changed document. In the above example the region of the <code>ReplaceEdit(0, 0,
 * "eclipse.")</code> edit after executing the root
 * edit is <code>[3, 8]</code>. If the region of an edit got deleted during change execution the region is set to
 * <code>[-1, -1]</code> and the method {@link #isDeleted() isDeleted} returns <code>true</code>. </p> This class isn't
 * intended to be subclassed outside of the edit framework. Clients are only allowed to subclass
 * <code>MultiTextEdit</code>.
 *
 * @since 3.0
 * @noextend This class is not intended to be subclassed by clients.
 */
public abstract class TextEdit {

    private static class InsertionComparator implements Comparator<TextEdit> {
        @Override
        public int compare(TextEdit edit1, TextEdit edit2) throws MalformedTreeException {
            int offset1 = edit1.getOffset();
            int length1 = edit1.getLength();

            int offset2 = edit2.getOffset();
            int length2 = edit2.getLength();

            if (offset1 == offset2 && length1 == 0 && length2 == 0) {
                return 0;
            }
            if (offset1 + length1 <= offset2) {
                return -1;
            }
            if (offset2 + length2 <= offset1) {
                return 1;
            }
            throw new MalformedTreeException(TextEditMessages.getString("TextEdit.overlapping")); //$NON-NLS-1$
        }
    }

    private static final TextEdit[] EMPTY_ARRAY = new TextEdit[0];
    private static final InsertionComparator INSERTION_COMPARATOR = new InsertionComparator();

    private int fOffset;
    private int fLength;

    private TextEdit fParent;
    private List<TextEdit> fChildren;

    int fDelta;

    /**
     * Create a new text edit. Parent is initialized to <code> null</code> and the edit doesn't have any children.
     *
     * @param offset the edit's offset
     * @param length the edit's length
     */
    protected TextEdit(int offset, int length) {
        Assert.isTrue(offset >= 0 && length >= 0);
        fOffset = offset;
        fLength = length;
        fDelta = 0;
    }

    /**
     * Returns the offset of the edit. An offset is a 0-based character index. Returns <code>-1</code> if the edit is
     * marked as deleted.
     *
     * @return the offset of the edit
     */
    public int getOffset() {
        return fOffset;
    }

    /**
     * Returns the length of the edit. Returns <code>-1</code> if the edit is marked as deleted.
     *
     * @return the length of the edit
     */
    public int getLength() {
        return fLength;
    }

    /**
     * Returns the exclusive end position of this edit. The exclusive end position denotes the next character of the
     * region manipulated by this edit. The returned value is the result of the following calculation:
     *
     * <pre>
     *   getOffset() + getLength();
     * </pre>
     *
     * @return the exclusive end position
     */
    public final int getExclusiveEnd() {
        return getOffset() + getLength();
    }

    /**
     * Returns whether this edit has been deleted or not.
     *
     * @return <code>true</code> if the edit has been deleted; otherwise <code>false</code> is returned.
     */
    public final boolean isDeleted() {
        return fOffset == -1 && fLength == -1;
    }

    /**
     * Returns <code>true</code> if the edit covers the given edit <code>other</code>. It is up to the concrete text
     * edit to decide if a edit of length zero can cover another edit.
     *
     * @param other the other edit
     * @return <code>true</code> if the edit covers the other edit; otherwise <code>false</code> is returned.
     */
    public boolean covers(TextEdit other) {
        if (getLength() == 0 && !canZeroLengthCover()) {
            return false;
        }

        if (!other.isDefined()) {
            return true;
        }

        int thisOffset = getOffset();
        int otherOffset = other.getOffset();
        return thisOffset <= otherOffset && otherOffset + other.getLength() <= thisOffset + getLength();
    }

    /**
     * Returns <code>true</code> if an edit with length zero can cover another edit. Returns <code>false</code>
     * otherwise.
     *
     * @return whether an edit of length zero can cover another edit
     */
    protected boolean canZeroLengthCover() {
        return false;
    }

    /**
     * Returns whether the region of this edit is defined or not.
     *
     * @return whether the region of this edit is defined or not
     *
     * @since 3.1
     */
    boolean isDefined() {
        return true;
    }

    /**
     * Adds the given edit <code>child</code> to this edit.
     *
     * @param child the child edit to add
     * @exception MalformedTreeException is thrown if the child edit can't be added to this edit. This is the case if
     * the child overlaps with one of its siblings or if the child edit's region isn't fully covered by this edit.
     */
    public final void addChild(TextEdit child) throws MalformedTreeException {
        internalAdd(child);
    }

    /**
     * Returns <code>true</code> if this edit has children. Otherwise <code>false</code> is returned.
     *
     * @return <code>true</code> if this edit has children; otherwise <code>false</code> is returned
     */
    public final boolean hasChildren() {
        return fChildren != null && !fChildren.isEmpty();
    }

    /**
     * Returns the edit's children. If the edit doesn't have any children an empty array is returned.
     *
     * @return the edit's children
     */
    public final TextEdit[] getChildren() {
        if (fChildren == null) {
            return EMPTY_ARRAY;
        }
        return fChildren.toArray(new TextEdit[0]);
    }

    /**
     * Returns the text range spawned by the given array of text edits. The method requires that the given array
     * contains at least one edit. If all edits passed are deleted the method returns <code> null</code>.
     *
     * @param edits an array of edits
     * @return the text range spawned by the given array of edits or <code>null</code> if all edits are marked as
     * deleted
     */
    public static IRegion getCoverage(TextEdit[] edits) {
        Assert.isTrue(edits != null && edits.length > 0);

        int offset = Integer.MAX_VALUE;
        int end = Integer.MIN_VALUE;
        int deleted = 0;
        for (TextEdit edit : edits) {
            if (edit.isDeleted()) {
                deleted++;
            } else {
                offset = Math.min(offset, edit.getOffset());
                end = Math.max(end, edit.getExclusiveEnd());
            }
        }
        if (edits.length == deleted) {
            return null;
        }

        return new Region(offset, end - offset);
    }

    /**
     * Hook called before this edit gets added to the passed parent.
     *
     * @param parent the parent text edit
     */
    void aboutToBeAdded(TextEdit parent) {
    }

    /**
     * The <code>Edit</code> implementation of this <code>Object</code> method uses object identity (==).
     *
     * @param obj the other object
     * @return <code>true</code> iff <code>this == obj</code>; otherwise <code>false</code> is returned
     *
     * @see Object#equals(java.lang.Object)
     */
    @Override
    public final boolean equals(Object obj) {
        return this == obj; // equivalent to Object.equals
    }

    /**
     * The <code>Edit</code> implementation of this <code>Object</code> method calls uses <code>Object#hashCode()</code>
     * to compute its hash code.
     *
     * @return the object's hash code value
     *
     * @see Object#hashCode()
     */
    @Override
    public final int hashCode() {
        return super.hashCode();
    }

    @Override
    public String toString() {
        StringBuilder buffer = new StringBuilder();
        toStringWithChildren(buffer, 0);
        return buffer.toString();
    }

    /**
     * Adds the string representation of this text edit without children information to the given string builder.
     *
     * @param buffer the string builder
     * @param indent the indent level in number of spaces
     * @since 3.3
     */
    void internalToString(StringBuilder buffer, int indent) {
        buffer.append("  ".repeat(Math.max(0, indent))); //$NON-NLS-1$
        buffer.append("{"); //$NON-NLS-1$
        String name = getClass().getName();
        int index = name.lastIndexOf('.');
        if (index != -1) {
            buffer.append(name.substring(index + 1));
        } else {
            buffer.append(name);
        }
        buffer.append("} "); //$NON-NLS-1$
        if (isDeleted()) {
            buffer.append("[deleted]"); //$NON-NLS-1$
        } else {
            buffer.append("["); //$NON-NLS-1$
            buffer.append(getOffset());
            buffer.append(","); //$NON-NLS-1$
            buffer.append(getLength());
            buffer.append("]"); //$NON-NLS-1$
        }
    }

    /**
     * Adds the string representation for this text edit and its children to the given string builder.
     *
     * @param buffer the string builder
     * @param indent the indent level in number of spaces
     * @since 3.3
     */
    private void toStringWithChildren(StringBuilder buffer, int indent) {
        internalToString(buffer, indent);
        if (fChildren != null) {
            for (TextEdit child : fChildren) {
                buffer.append('\n');
                child.toStringWithChildren(buffer, indent + 1);
            }
        }
    }

    /**
     * Applies the edit tree rooted by this edit to the given document, creating an undo edit and updating the regions
     * of the edits.
     *
     * @param document the document to which to apply this edit
     * @return the undo edit
     * @exception MalformedTreeException is thrown if the tree isn't in a valid state. This exception is thrown before
     * any edit is executed. So the document is still in its original state.
     * @exception BadLocationException is thrown if one of the edits in the tree can't be executed. The state of the
     * document is undefined if this exception is thrown.
     */
    public final UndoEdit apply(IDocument document) throws MalformedTreeException, BadLocationException {
        try {
            TextEditProcessor processor = new TextEditProcessor(document, this);
            return processor.performEdits();
        } finally {
            // disconnect from text edit processor
            fParent = null;
        }
    }

    UndoEdit dispatchPerformEdits(TextEditProcessor processor) throws BadLocationException {
        return processor.executeDo();
    }

    void dispatchCheckIntegrity(TextEditProcessor processor) throws MalformedTreeException {
        processor.checkIntegrityDo();
    }

    void internalSetParent(TextEdit parent) {
        if (parent != null) {
            Assert.isTrue(fParent == null);
        }
        fParent = parent;
    }

    void internalSetOffset(int offset) {
        Assert.isTrue(offset >= 0);
        fOffset = offset;
    }

    void internalSetLength(int length) {
        Assert.isTrue(length >= 0);
        fLength = length;
    }

    List<TextEdit> internalGetChildren() {
        return fChildren;
    }

    void internalSetChildren(List<TextEdit> children) {
        fChildren = children;
    }

    void internalAdd(TextEdit child) throws MalformedTreeException {
        child.aboutToBeAdded(this);
        if (child.isDeleted()) {
            throw new MalformedTreeException(TextEditMessages.getString("TextEdit.deleted_edit")); //$NON-NLS-1$
        }
        if (!covers(child)) {
            throw new MalformedTreeException(TextEditMessages.getString("TextEdit.range_outside")); //$NON-NLS-1$
        }
        if (fChildren == null) {
            fChildren = new ArrayList<>(2);
        }
        int index = computeInsertionIndex(child);
        fChildren.add(index, child);
        child.internalSetParent(this);
    }

    private int computeInsertionIndex(TextEdit edit) throws MalformedTreeException {
        int size = fChildren.size();
        if (size == 0) {
            return 0;
        }
        int lastIndex = size - 1;
        TextEdit last = fChildren.get(lastIndex);
        if (last.getExclusiveEnd() <= edit.getOffset()) {
            return size;
        }
        try {
            int index = Collections.binarySearch(fChildren, edit, INSERTION_COMPARATOR);

            if (index < 0) {
                // edit is not in fChildren
                return -index - 1;
            }

            // edit is already in fChildren
            // make sure that multiple insertion points at the same offset are inserted last.
            while (index < lastIndex
                && INSERTION_COMPARATOR.compare(fChildren.get(index), fChildren.get(index + 1)) == 0) {
                index++;
            }

            return index + 1;
        } catch (MalformedTreeException e) {
            java.util.Objects.requireNonNull(e);
            throw e;
        }
    }

    /**
     * Adjusts the edits offset according to the given delta. This method doesn't update any children.
     *
     * @param delta the delta of the text replace operation
     */
    void adjustOffset(int delta) {
        if (isDeleted()) {
            return;
        }
        fOffset += delta;
        Assert.isTrue(fOffset >= 0);
    }

    /**
     * Adjusts the edits length according to the given delta. This method doesn't update any children.
     *
     * @param delta the delta of the text replace operation
     */
    void adjustLength(int delta) {
        if (isDeleted()) {
            return;
        }
        fLength += delta;
        Assert.isTrue(fLength >= 0);
    }

    /**
     * Marks the edit as deleted. This method doesn't update any children.
     */
    void markAsDeleted() {
        fOffset = -1;
        fLength = -1;
    }

    /**
     * Traverses the edit tree to perform the consistency check.
     *
     * @param processor the text edit processor
     * @param document the document to be manipulated
     * @return the number of indirect move or copy target edit children
     */
    int traverseConsistencyCheck(TextEditProcessor processor, IDocument document) {
        int result = 0;
        if (fChildren != null) {
            for (int i = fChildren.size() - 1; i >= 0; i--) {
                TextEdit child = fChildren.get(i);
                result = Math.max(result, child.traverseConsistencyCheck(processor, document));
            }
        }
        {
            java.util.Objects.requireNonNull(processor);
            performConsistencyCheck();
        }
        return result;
    }

    /**
     * Performs the consistency check.
     *
     */
    void performConsistencyCheck() {
    }

    int traverseDocumentUpdating(TextEditProcessor processor, IDocument document) throws BadLocationException {
        int delta = 0;
        if (fChildren != null) {
            for (int i = fChildren.size() - 1; i >= 0; i--) {
                TextEdit child = fChildren.get(i);
                delta += child.traverseDocumentUpdating(processor, document);
            }
        }
        {
            java.util.Objects.requireNonNull(processor);
            if (delta != 0) {
                adjustLength(delta);
            }
            int r = performDocumentUpdating(document);
            if (r != 0) {
                adjustLength(r);
            }
            delta += r;
        }
        return delta;
    }

    abstract int performDocumentUpdating(IDocument document) throws BadLocationException;

    int traverseRegionUpdating(int accumulatedDelta, boolean delete) {
        performRegionUpdating(accumulatedDelta, delete);
        if (fChildren != null) {
            boolean childDelete = delete || deleteChildren();
            for (TextEdit child : fChildren) {
                accumulatedDelta = child.traverseRegionUpdating(accumulatedDelta, childDelete);
            }
        }
        return accumulatedDelta + fDelta;
    }

    void performRegionUpdating(int accumulatedDelta, boolean delete) {
        if (delete) {
            markAsDeleted();
        } else {
            adjustOffset(accumulatedDelta);
        }
    }

    abstract boolean deleteChildren();
}
