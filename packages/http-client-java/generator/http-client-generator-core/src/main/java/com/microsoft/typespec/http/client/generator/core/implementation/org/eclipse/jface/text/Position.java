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
 * Positions describe text ranges of a document. Positions are adapted to changes applied to that document. The text
 * range is specified by an offset and a length. Positions can be marked as deleted. Deleted positions are considered to
 * no longer represent a valid text range in the managing document. <p> Positions attached to documents are usually
 * updated by position updaters. Because position updaters are freely definable and because of the frequency in which
 * they are used, the fields of a position are made publicly accessible. Clients other than position updaters are not
 * allowed to access these public fields. </p> <p> Positions cannot be used as keys in hash tables as they override
 * <code>equals</code> and <code>hashCode</code> as they would be value objects. </p>
 *
 */
public class Position {

    /** The offset of the position */
    public int offset;
    /** The length of the position */
    public int length;
    /** Indicates whether the position has been deleted */
    public boolean isDeleted;

    /**
     * Creates a new position with the given offset and length.
     *
     */
    public Position() {
        this.offset = 0;
        this.length = 0;
    }

    @Override
    public int hashCode() {
        int deleted = isDeleted ? 0 : 1;
        return (offset << 24) | (length << 16) | deleted;
    }

    /**
     * Marks this position as deleted.
     */
    public void delete() {
        isDeleted = true;
    }

    @Override
    public boolean equals(Object other) {
        if (other instanceof Position rp) {
            return (rp.offset == offset) && (rp.length == length);
        }
        return super.equals(other);
    }

    /**
     * Returns the length of this position.
     *
     * @return the length of this position
     */
    public int getLength() {
        return length;
    }

    /**
     * Returns the offset of this position.
     *
     * @return the offset of this position
     */
    public int getOffset() {
        return offset;
    }

    @Override
    public String toString() {
        String position = "offset: " + offset + ", length: " + length; //$NON-NLS-1$//$NON-NLS-2$
        return isDeleted ? position + " (deleted)" : position; //$NON-NLS-1$
    }
}
