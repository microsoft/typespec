// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2006, 2009 IBM Corporation and others.
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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser;

public class RecoveryScannerData {
    public int insertedTokensPtr = -1;
    public TerminalToken[][] insertedTokens;
    public int[] insertedTokensPosition;
    public boolean[] insertedTokenUsed;

    public int replacedTokensPtr = -1;
    public TerminalToken[][] replacedTokens;
    public int[] replacedTokensStart;
    public int[] replacedTokensEnd;
    public boolean[] replacedTokenUsed;

    public int removedTokensPtr = -1;
    public int[] removedTokensStart;
    public int[] removedTokensEnd;
    public boolean[] removedTokenUsed;

    public RecoveryScannerData removeUnused() {
        if (this.insertedTokens != null) {
            int newInsertedTokensPtr = -1;
            for (int i = 0; i <= this.insertedTokensPtr; i++) {
                if (this.insertedTokenUsed[i]) {
                    newInsertedTokensPtr++;
                    this.insertedTokens[newInsertedTokensPtr] = this.insertedTokens[i];
                    this.insertedTokensPosition[newInsertedTokensPtr] = this.insertedTokensPosition[i];
                    this.insertedTokenUsed[newInsertedTokensPtr] = this.insertedTokenUsed[i];
                }
            }
            this.insertedTokensPtr = newInsertedTokensPtr;
        }

        if (this.replacedTokens != null) {
            int newReplacedTokensPtr = -1;
            for (int i = 0; i <= this.replacedTokensPtr; i++) {
                if (this.replacedTokenUsed[i]) {
                    newReplacedTokensPtr++;
                    this.replacedTokens[newReplacedTokensPtr] = this.replacedTokens[i];
                    this.replacedTokensStart[newReplacedTokensPtr] = this.replacedTokensStart[i];
                    this.replacedTokensEnd[newReplacedTokensPtr] = this.replacedTokensEnd[i];
                    this.replacedTokenUsed[newReplacedTokensPtr] = this.replacedTokenUsed[i];
                }
            }
            this.replacedTokensPtr = newReplacedTokensPtr;
        }
        if (this.removedTokensStart != null) {
            int newRemovedTokensPtr = -1;
            for (int i = 0; i <= this.removedTokensPtr; i++) {
                if (this.removedTokenUsed[i]) {
                    newRemovedTokensPtr++;
                    this.removedTokensStart[newRemovedTokensPtr] = this.removedTokensStart[i];
                    this.removedTokensEnd[newRemovedTokensPtr] = this.removedTokensEnd[i];
                    this.removedTokenUsed[newRemovedTokensPtr] = this.removedTokenUsed[i];
                }
            }
            this.removedTokensPtr = newRemovedTokensPtr;
        }

        return this;
    }
}
