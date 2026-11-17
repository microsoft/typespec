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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

/**
 * A range of the source: an offset and a length.
 */
public final class Region {

    /** The region offset */
    private final int fOffset;
    /** The region length */
    private final int fLength;

    /**
     * Create a new region.
     *
     * @param offset the offset of the region
     * @param length the length of the region
     */
    public Region(int offset, int length) {
        fOffset = offset;
        fLength = length;
    }

    public int getLength() {
        return fLength;
    }

    public int getOffset() {
        return fOffset;
    }
}
