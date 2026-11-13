// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2009 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util;

/**
 * Hashtable for non-zero int keys.
 */
public final class HashtableOfInt {
    // to avoid using Enumerations, walk the individual tables skipping nulls
    public int[] keyTable;
    public Object[] valueTable;

    public int elementSize; // number of elements in the table
    int threshold;

    public HashtableOfInt(int size) {
        this.elementSize = 0;
        this.threshold = size; // size represents the expected number of elements
        int extraRoom = (int) (size * 1.75f);
        if (this.threshold == extraRoom)
            extraRoom++;
        this.keyTable = new int[extraRoom];
        this.valueTable = new Object[extraRoom];
    }

    public Object get(int key) {
        int length = this.keyTable.length, index = key % length;
        int currentKey;
        while ((currentKey = this.keyTable[index]) != 0) {
            if (currentKey == key)
                return this.valueTable[index];
            if (++index == length) {
                index = 0;
            }
        }
        return null;
    }

    public Object put(int key, Object value) {
        int length = this.keyTable.length, index = key % length;
        int currentKey;
        while ((currentKey = this.keyTable[index]) != 0) {
            if (currentKey == key)
                return this.valueTable[index] = value;
            if (++index == length) {
                index = 0;
            }
        }
        this.keyTable[index] = key;
        this.valueTable[index] = value;

        // assumes the threshold is never equal to the size of the table
        if (++this.elementSize > this.threshold)
            rehash();
        return value;
    }

    private void rehash() {
        HashtableOfInt newHashtable = new HashtableOfInt(this.elementSize * 2); // double the number of expected
                                                                                // elements
        int currentKey;
        for (int i = this.keyTable.length; --i >= 0;)
            if ((currentKey = this.keyTable[i]) != 0)
                newHashtable.put(currentKey, this.valueTable[i]);

        this.keyTable = newHashtable.keyTable;
        this.valueTable = newHashtable.valueTable;
        this.threshold = newHashtable.threshold;
    }

    @Override
    public String toString() {
        String s = ""; //$NON-NLS-1$
        Object object;
        for (int i = 0, length = this.valueTable.length; i < length; i++)
            if ((object = this.valueTable[i]) != null)
                s += this.keyTable[i] + " -> " + object.toString() + "\n"; //$NON-NLS-2$ //$NON-NLS-1$
        return s;
    }
}
