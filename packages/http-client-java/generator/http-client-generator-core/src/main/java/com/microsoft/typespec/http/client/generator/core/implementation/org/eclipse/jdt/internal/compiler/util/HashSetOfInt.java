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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util;

/**
 * HashSet of Object[]
 */
public final class HashSetOfInt implements Cloneable {

    // to avoid using Enumerations, walk the individual tables skipping nulls
    public int[] set;

    public int elementSize; // number of elements in the table
    int threshold;

    public HashSetOfInt(int size) {
        this.elementSize = 0;
        this.threshold = size; // size represents the expected number of elements
        int extraRoom = (int) (size * 1.75f);
        if (this.threshold == extraRoom)
            extraRoom++;
        this.set = new int[extraRoom];
    }

    public boolean contains(int element) {
        int length = this.set.length;
        int index = element % length;
        int currentElement;
        while ((currentElement = this.set[index]) != 0) {
            if (currentElement == element)
                return true;
            if (++index == length) {
                index = 0;
            }
        }
        return false;
    }

    public int add(int element) {
        int length = this.set.length;
        int index = element % length;
        int currentElement;
        while ((currentElement = this.set[index]) != 0) {
            if (currentElement == element)
                return this.set[index] = element;
            if (++index == length) {
                index = 0;
            }
        }
        this.set[index] = element;

        // assumes the threshold is never equal to the size of the table
        if (++this.elementSize > this.threshold)
            rehash();
        return element;
    }

    private void rehash() {
        HashSetOfInt newHashSet = new HashSetOfInt(this.elementSize * 2);		// double the number of expected
                                                                                 // elements
        int currentElement;
        for (int i = this.set.length; --i >= 0;)
            if ((currentElement = this.set[i]) != 0)
                newHashSet.add(currentElement);

        this.set = newHashSet.set;
        this.threshold = newHashSet.threshold;
    }

    @Override
    public String toString() {
        StringBuilder buffer = new StringBuilder();
        int element;
        for (int i = 0, length = this.set.length; i < length; i++)
            if ((element = this.set[i]) != 0) {
                buffer.append(element);
                if (i != length - 1)
                    buffer.append('\n');
            }
        return buffer.toString();
    }
}
