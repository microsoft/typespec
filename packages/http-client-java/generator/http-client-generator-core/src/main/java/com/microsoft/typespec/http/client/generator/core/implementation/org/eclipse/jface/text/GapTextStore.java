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

/**
 * Implements a gap managing text store. The gap text store relies on the assumption that consecutive changes to a
 * document are co-located. The start of the gap is always moved to the location of the last change. <p>
 * <strong>Performance:</strong> Typing-style changes perform in constant time unless re-allocation becomes necessary.
 * Generally, a change that does not cause re-allocation will cause at most one
 * {@linkplain System#arraycopy(Object, int, Object, int, int) arraycopy} operation of a length of about <var>d</var>,
 * where <var>d</var> is the distance from the previous change. Let <var>a(x)</var> be the algorithmic performance of an
 * <code>arraycopy</code> operation of the length <var>x</var>, then such a change then performs in <i>O(a(x))</i>,
 * and {@linkplain #get(int, int) get(int, <var>length</var>)} performs in <i>O(a(length))</i>. <p> Re-allocation uses a
 * minimum gap of 256 characters, a maximum gap of 4096 characters, and a maximum gap factor of 0.1. </p> <p>
 * This class is not intended to be subclassed. </p>
 *
 * @see CopyOnWriteTextStore for a copy-on-write text store wrapper
 * @noextend This class is not intended to be subclassed by clients.
 */
public class GapTextStore implements ITextStore {

    /** The store's content */
    private char[] fContent = new char[0];
    /** Starting index of the gap */
    private int fGapStart = 0;
    /** End index of the gap */
    private int fGapEnd = 0;
    /**
     * The current high water mark. If a change would cause the gap to grow larger than this, the array is re-allocated.
     *
     * @since 3.3
     */
    private int fThreshold = 0;

    /**
     * Equivalent to new GapTextStore(256, 4096, 0.1f).
     *
     * @since 3.3
     */
    public GapTextStore() {

    }

    @Override
    public final String get(int offset, int length) {
        if (fGapStart <= offset) {
            return new String(fContent, offset + gapSize(), length);
        }

        final int end = offset + length;

        if (end <= fGapStart) {
            return new String(fContent, offset, length);
        }

        // see Bug 113871
        return String.valueOf(fContent, offset, fGapStart - offset)
            + String.valueOf(fContent, fGapEnd, end - fGapStart);
    }

    @Override
    public final int getLength() {
        return fContent.length - gapSize();
    }

    @Override
    public final void set(String text) {
        /*
         * Moves the gap to the end of the content. There is no sensible prediction of where the next change will occur,
         * but at least the next change will not trigger re-allocation. This is especially important when using the
         * GapTextStore within a CopyOnWriteTextStore, where the GTS is only initialized right before a modification.
         */
        replace(0, getLength(), text);
    }

    @Override
    public final void replace(int offset, int length, String text) {
        if (text == null) {
            adjustGap(offset, length, 0);
        } else {
            int textLength = text.length();
            adjustGap(offset, length, textLength);
            if (textLength != 0) {
                text.getChars(0, textLength, fContent, offset);
            }
        }
    }

    /**
     * Moves the gap to <code>offset + add</code>, moving any content after <code>offset + remove</code> behind the gap.
     * The gap size is kept between 0 and {@link #fThreshold}, leading to re-allocation if needed. The content between
     * <code>offset</code> and <code>offset + add</code> is undefined after this operation.
     *
     * @param offset the offset at which a change happens
     * @param remove the number of character which are removed or overwritten at <code>offset</code>
     * @param add the number of character which are inserted or overwriting at <code>offset</code>
     */
    private void adjustGap(int offset, int remove, int add) {
        final int oldGapSize = gapSize();
        final int newGapSize = oldGapSize - add + remove;
        final boolean reuseArray = 0 <= newGapSize && newGapSize <= fThreshold;

        final int newGapStart = offset + add;
        final int newGapEnd;

        if (reuseArray) {
            newGapEnd = moveGap(offset, remove, oldGapSize, newGapSize, newGapStart);
        } else {
            newGapEnd = reallocate(offset, remove, oldGapSize, newGapSize, newGapStart);
        }

        fGapStart = newGapStart;
        fGapEnd = newGapEnd;
    }

    /**
     * Moves the gap to <code>newGapStart</code>.
     *
     * @param offset the change offset
     * @param remove the number of removed / overwritten characters
     * @param oldGapSize the old gap size
     * @param newGapSize the gap size after the change
     * @param newGapStart the offset in the array to move the gap to
     * @return the new gap end
     * @since 3.3
     */
    private int moveGap(int offset, int remove, int oldGapSize, int newGapSize, int newGapStart) {
        /*
         * No re-allocation necessary. The area between the change offset and gap can be copied in at most one
         * operation. Don't copy parts that will be overwritten anyway.
         */
        final int newGapEnd = newGapStart + newGapSize;
        if (offset < fGapStart) {
            int afterRemove = offset + remove;
            if (afterRemove < fGapStart) {
                final int betweenSize = fGapStart - afterRemove;
                arrayCopy(afterRemove, fContent, newGapEnd, betweenSize);
            }
            // otherwise, only the gap gets enlarged
        } else {
            final int offsetShifted = offset + oldGapSize;
            final int betweenSize = offsetShifted - fGapEnd; // in the typing case, betweenSize is 0
            arrayCopy(fGapEnd, fContent, fGapStart, betweenSize);
        }
        return newGapEnd;
    }

    /**
     * Reallocates a new array and copies the data from the previous one.
     *
     * @param offset the change offset
     * @param remove the number of removed / overwritten characters
     * @param oldGapSize the old gap size
     * @param newGapSize the gap size after the change if no re-allocation would occur (can be negative)
     * @param newGapStart the offset in the array to move the gap to
     * @return the new gap end
     * @since 3.3
     */
    private int reallocate(int offset, int remove, final int oldGapSize, int newGapSize, final int newGapStart) {
        // the new content length (without any gap)
        final int newLength = fContent.length - newGapSize;
        // the new array size based on the gap factor
        int newArraySize = (int) (newLength * 1.0526316f);
        newGapSize = newArraySize - newLength;

        // bound the gap size within min/max
        if (newGapSize < 256) {
            newGapSize = 256;
            newArraySize = newLength + newGapSize;
        } else if (newGapSize > 4096) {
            newGapSize = 4096;
            newArraySize = newLength + newGapSize;
        }

        // the upper threshold is always twice the gapsize
        fThreshold = newGapSize * 2;
        final char[] newContent = allocate(newArraySize);
        final int newGapEnd = newGapStart + newGapSize;

        /*
         * Re-allocation: The old content can be copied in at most 3 operations to the newly allocated array. Either one
         * of change offset and the gap may come first. - unchanged area before the change offset / gap - area between
         * the change offset and the gap (either one may be first) - rest area after the change offset / after the gap
         */
        if (offset < fGapStart) {
            // change comes before gap
            arrayCopy(0, newContent, 0, offset);
            int afterRemove = offset + remove;
            if (afterRemove < fGapStart) {
                // removal is completely before the gap
                final int betweenSize = fGapStart - afterRemove;
                arrayCopy(afterRemove, newContent, newGapEnd, betweenSize);
                final int restSize = fContent.length - fGapEnd;
                arrayCopy(fGapEnd, newContent, newGapEnd + betweenSize, restSize);
            } else {
                // removal encompasses the gap
                afterRemove += oldGapSize;
                final int restSize = fContent.length - afterRemove;
                arrayCopy(afterRemove, newContent, newGapEnd, restSize);
            }
        } else {
            // gap comes before change
            arrayCopy(0, newContent, 0, fGapStart);
            final int offsetShifted = offset + oldGapSize;
            final int betweenSize = offsetShifted - fGapEnd;
            arrayCopy(fGapEnd, newContent, fGapStart, betweenSize);
            final int afterRemove = offsetShifted + remove;
            final int restSize = fContent.length - afterRemove;
            arrayCopy(afterRemove, newContent, newGapEnd, restSize);
        }

        fContent = newContent;
        return newGapEnd;
    }

    /**
     * Allocates a new <code>char[size]</code>.
     *
     * @param size the length of the new array.
     * @return a newly allocated char array
     * @since 3.3
     */
    private char[] allocate(int size) {
        return new char[size];
    }

    /*
     * Executes System.arraycopy if length != 0. A length < 0 cannot happen -> don't hide coding errors by checking for
     * negative lengths.
     *
     * @since 3.3
     */
    private void arrayCopy(int srcPos, char[] dest, int destPos, int length) {
        if (length != 0) {
            System.arraycopy(fContent, srcPos, dest, destPos, length);
        }
    }

    /**
     * Returns the gap size.
     *
     * @return the gap size
     * @since 3.3
     */
    private int gapSize() {
        return fGapEnd - fGapStart;
    }
}
