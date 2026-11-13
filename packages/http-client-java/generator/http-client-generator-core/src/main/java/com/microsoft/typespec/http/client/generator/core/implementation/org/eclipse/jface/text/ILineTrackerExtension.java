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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text;

/**
 * Extension interface for
 * {@link com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTracker}. Adds
 * the concept of rewrite sessions. A rewrite
 * session is a sequence of replace operations that form a semantic unit.
 *
 * Abstract implementation of <code>ILineTracker</code>. It lets the definition of line delimiters to subclasses.
 * Assuming that '\n' is the only line delimiter, this abstract implementation defines the following line scheme: <ul>
 * <li> "" -&gt; [0,0] <li> "a" -&gt; [0,1] <li> "\n" -&gt; [0,1], [1,0] <li> "a\n" -&gt; [0,2], [2,0] <li> "a\nb" -&gt;
 * [0,2], [2,1] <li> "a\nbc\n" -&gt; [0,2], [2,3], [5,0] </ul> <p> This class must be subclassed. </p>
 *
 * Standard implementation of
 * {@link com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTracker}. <p> The
 * line tracker considers the three
 * common line delimiters which are '\n', '\r', '\r\n'. <p> This class is not intended to be subclassed. </p>
 *
 * @since 3.1
 * @noextend This class is not intended to be subclassed by clients.
 */
public class ILineTrackerExtension
    implements com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTracker {

    /**
     * Combines the information of the occurrence of a line delimiter. <code>delimiterIndex</code> is the index where a
     * line delimiter starts, whereas <code>delimiterLength</code>, indicates the length of the delimiter.
     *
     * @since 3.10
     */
    public static class DelimiterInfo {
        public int delimiterIndex;
        public int delimiterLength;
        public String delimiter;
    }

    /**
     * The implementation that this tracker delegates to.
     *
     * @since 3.2
     */
    private volatile ILineTracker fDelegate
        = new com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ListLineTracker(
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTrackerExtension.this);
    /**
     * Whether the delegate needs conversion when the line structure is modified.
     */
    private boolean fNeedsConversion = true;

    @Override
    public void set(String text) {
        fDelegate.set(text);
    }

    @Override
    public void replace(int offset, int length, String text) throws BadLocationException {
        checkImplementation();

        fDelegate.replace(offset, length, text);
    }

    /**
     * Converts the implementation to be a {@link TreeLineTracker} if it isn't yet.
     *
     * @since 3.2
     */
    private synchronized void checkImplementation() {
        if (fNeedsConversion) {
            fNeedsConversion = false;
            fDelegate
                = new com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.TreeLineTracker(
                    com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.ILineTrackerExtension.this,
                    (ListLineTracker) fDelegate);
        }
    }

    /** The predefined delimiters of this tracker */
    public final static String[] DELIMITERS = { "\r", "\n", "\r\n" }; //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-2$
    /** A predefined delimiter information which is always reused as return value */
    private final DelimiterInfo fDelimiterInfo = new DelimiterInfo();

    /**
     * Creates a standard line tracker.
     */
    public ILineTrackerExtension() {
    }

    /**
     * Returns the information about the first delimiter found in the given text starting at the given offset.
     *
     * @param text the text to be searched
     * @param offset the offset in the given text
     * @return the information of the first found delimiter or <code>null</code>
     */
    protected DelimiterInfo nextDelimiterInfo(String text, int offset) {
        char ch;
        int length = text.length();
        for (int i = offset; i < length; i++) {
            ch = text.charAt(i);
            if (ch == '\r') {
                if (i + 1 < length) {
                    if (text.charAt(i + 1) == '\n') {
                        fDelimiterInfo.delimiter = DELIMITERS[2];
                        fDelimiterInfo.delimiterIndex = i;
                        fDelimiterInfo.delimiterLength = 2;
                        return fDelimiterInfo;
                    }
                }

                fDelimiterInfo.delimiter = DELIMITERS[0];
                fDelimiterInfo.delimiterIndex = i;
                fDelimiterInfo.delimiterLength = 1;
                return fDelimiterInfo;
            } else if (ch == '\n') {
                fDelimiterInfo.delimiter = DELIMITERS[1];
                fDelimiterInfo.delimiterIndex = i;
                fDelimiterInfo.delimiterLength = 1;
                return fDelimiterInfo;
            }
        }

        return null;
    }
}
