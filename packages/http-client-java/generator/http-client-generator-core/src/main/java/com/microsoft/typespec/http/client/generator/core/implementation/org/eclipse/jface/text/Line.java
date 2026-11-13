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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text;

/**
 * Describes a line as a particular number of characters beginning at a particular offset, consisting of a particular
 * number of characters, and being closed with a particular line delimiter.
 */
final class Line implements IRegion {

    /** The offset of the line */
    public int offset;
    /** The length of the line */
    public int length;
    /** The delimiter of this line */
    public final String delimiter;

    /**
     * Creates a new Line.
     *
     * @param offset the offset of the line
     * @param end the last including character offset of the line
     * @param delimiter the line's delimiter
     */
    public Line(int offset, int end, String delimiter) {
        this.offset = offset;
        this.length = (end - offset) + 1;
        this.delimiter = delimiter;
    }

    @Override
    public int getOffset() {
        return offset;
    }

    @Override
    public int getLength() {
        return length;
    }

    @Override
    public String toString() {
        return "Line [offset: " + offset + ", length: " + length + ", delimiter: '" + delimiter + "']"; //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
    }
}
