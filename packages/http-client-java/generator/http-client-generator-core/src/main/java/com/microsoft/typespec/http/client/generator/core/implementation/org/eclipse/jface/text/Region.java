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
 * The default implementation of the
 * {@link com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IRegion} interface.
 */
public class Region implements IRegion {

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

    @Override
    public int getLength() {
        return fLength;
    }

    @Override
    public int getOffset() {
        return fOffset;
    }

    @Override
    public boolean equals(Object o) {
        if (o instanceof IRegion r) {
            return r.getOffset() == fOffset && r.getLength() == fLength;
        }
        return false;
    }

    @Override
    public int hashCode() {
        return (fOffset << 24) | (fLength << 16);
    }

    @Override
    public String toString() {
        return "offset: " + fOffset + ", length: " + fLength; //$NON-NLS-1$ //$NON-NLS-2$ ;
    }
}
