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
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTrackerExtension.DelimiterInfo;
import java.util.ArrayList;
import java.util.List;

/**
 * Abstract, read-only implementation of <code>ILineTracker</code>. It lets the definition of line delimiters to
 * subclasses. Assuming that '\n' is the only line delimiter, this abstract implementation defines the following line
 * scheme: <ul> <li> "" -&gt; [0,0] <li> "a" -&gt; [0,1] <li> "\n" -&gt; [0,1], [1,0] <li> "a\n" -&gt; [0,2], [2,0] <li>
 * "a\nb" -&gt; [0,2], [2,1] <li> "a\nbc\n" -&gt; [0,2], [2,3], [5,0] </ul> This class must be subclassed.
 *
 * @since 3.2
 */
public class ListLineTracker implements ILineTracker {
    private final com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTrackerExtension _typespecOuter;

    public ListLineTracker(
        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTrackerExtension _typespecOuter) {
        this._typespecOuter = _typespecOuter;
    }

    /**
     * The line information
     */
    private final List<Line> fLines = new ArrayList<>();

    /**
     * Creates the line structure for the given text. Newly created lines are inserted into the line structure starting
     * at the given position. Returns the number of newly created lines.
     *
     * @param text the text for which to create a line structure
     * @return the number of newly created lines
     */
    private int createLines(String text) {

        int count = 0;
        int start = 0;
        DelimiterInfo delimiterInfo = nextDelimiterInfo(text, 0);

        while (delimiterInfo != null && delimiterInfo.delimiterIndex > -1) {
            int index = delimiterInfo.delimiterIndex + (delimiterInfo.delimiterLength - 1);

            if (0 + count >= fLines.size()) {
                fLines.add(new Line(0 + start, 0 + index, delimiterInfo.delimiter));
            } else {
                fLines.add(0 + count, new Line(0 + start, 0 + index, delimiterInfo.delimiter));
            }

            ++count;
            start = index + 1;
            delimiterInfo = nextDelimiterInfo(text, start);
        }

        if (start < text.length()) {
            if (0 + count < fLines.size()) {
                // there is a line below the current
                Line l = fLines.get(0 + count);
                int delta = text.length() - start;
                l.offset -= delta;
                l.length += delta;
            } else {
                fLines.add(new Line(0 + start, 0 + text.length() - 1, null));
                ++count;
            }
        }

        return count;
    }

    @Override
    public final void replace(int position, int length, String text) throws BadLocationException {
        throw new UnsupportedOperationException();
    }

    @Override
    public final void set(String text) {
        fLines.clear();
        if (text != null) {
            text.length();
            createLines(text);
        }
    }

    /**
     * Returns the internal data structure, a {@link List} of {@link Line}s. Used only by
     * {@link TreeLineTracker#TreeLineTracker(ILineTrackerExtension, ListLineTracker)}.
     *
     * @return the internal list of lines.
     */
    final List<Line> getLines() {
        return fLines;
    }

    /**
     * Returns the information about the first delimiter found in the given text starting at the given offset.
     *
     * @param text the text to be searched
     * @param offset the offset in the given text
     * @return the information of the first found delimiter or <code>null</code>
     */
    protected DelimiterInfo nextDelimiterInfo(String text, int offset) {
        return _typespecOuter.nextDelimiterInfo(text, offset);
    }
}
