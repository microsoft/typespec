// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2006, 2014 IBM Corporation and others.
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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.InvalidInputException;
import java.util.Arrays;

public class RecoveryScanner extends Scanner {
    public static final char[] FAKE_IDENTIFIER = "$missing$".toCharArray(); //$NON-NLS-1$

    private RecoveryScannerData data;

    private TerminalToken[] pendingTokens;
    private int pendingTokensPtr = -1;
    private char[] fakeTokenSource = null;
    private int skipNextInsertedTokens = -1;

    public boolean record = true;

    public RecoveryScanner(Scanner scanner, RecoveryScannerData data) {
        super(false, scanner.tokenizeWhiteSpace, scanner.checkNonExternalizedStringLiterals, scanner.sourceLevel,
            scanner.complianceLevel, scanner.taskTags, scanner.taskPriorities, scanner.isTaskCaseSensitive,
            scanner.previewEnabled);
        setData(data);
    }

    public void insertToken(TerminalToken token, int position) {

        insertTokens(new TerminalToken[] { token }, -1, position);
    }

    private TerminalToken[] reverse(TerminalToken[] tokens) {
        int length = tokens.length;
        for (int i = 0, max = length / 2; i < max; i++) {
            TerminalToken tmp = tokens[i];
            tokens[i] = tokens[length - i - 1];
            tokens[length - i - 1] = tmp;
        }
        return filterTokens(tokens);
    }

    public void insertTokens(int[] tokens, int completedToken, int position) {
        insertTokens(mapTokens(tokens), completedToken, position);
    }

    public void insertTokens(TerminalToken[] tokens, int completedToken, int position) {
        if (!this.record)
            return;
        tokens = filterTokens(tokens);
        if (tokens.length == 0)
            return;

        if (completedToken > -1 && Parser.statements_recovery_filter[completedToken] != 0)
            return;

        this.data.insertedTokensPtr++;
        if (this.data.insertedTokens == null) {
            this.data.insertedTokens = new TerminalToken[10][];
            this.data.insertedTokensPosition = new int[10];
            this.data.insertedTokenUsed = new boolean[10];
        } else if (this.data.insertedTokens.length == this.data.insertedTokensPtr) {
            int length = this.data.insertedTokens.length;
            System.arraycopy(this.data.insertedTokens, 0, this.data.insertedTokens = new TerminalToken[length * 2][], 0,
                length);
            System.arraycopy(this.data.insertedTokensPosition, 0,
                this.data.insertedTokensPosition = new int[length * 2], 0, length);
            System.arraycopy(this.data.insertedTokenUsed, 0, this.data.insertedTokenUsed = new boolean[length * 2], 0,
                length);
        }
        this.data.insertedTokens[this.data.insertedTokensPtr] = reverse(tokens);
        this.data.insertedTokensPosition[this.data.insertedTokensPtr] = position;
        this.data.insertedTokenUsed[this.data.insertedTokensPtr] = false;
    }

    public void insertTokenAhead(int index) {
        if (!this.record)
            return;
        if (TerminalToken.TokenNameEQUAL == TerminalToken.TokenNameRestrictedIdentifierrecord)
            return;
        int length = this.data.insertedTokens[index].length;
        TerminalToken[] tokens = new TerminalToken[length + 1];
        System.arraycopy(this.data.insertedTokens[index], 0, tokens, 1, length);
        tokens[0] = TerminalToken.TokenNameEQUAL;
        this.data.insertedTokens[index] = tokens;
    }

    public void replaceTokens(int token, int start, int end) {
        replaceTokens(new TerminalToken[] { TerminalToken.of(token) }, start, end);
    }

    public void replaceTokens(TerminalToken token, int start, int end) {
        replaceTokens(new TerminalToken[] { token }, start, end);
    }

    TerminalToken[] filterTokens(TerminalToken[] tokens) {
        return Arrays.stream(tokens)
            .filter(x -> x != TerminalToken.TokenNameRestrictedIdentifierrecord)
            .toArray(TerminalToken[]::new);
    }

    public void replaceTokens(int[] tokens, int start, int end) {
        TerminalToken[] mappedTokens = mapTokens(tokens);
        replaceTokens(mappedTokens, start, end);
    }

    private TerminalToken[] mapTokens(int[] tokens) {
        TerminalToken[] mappedTokens = new TerminalToken[tokens.length];
        for (int i = 0; i < tokens.length; ++i)
            mappedTokens[i] = TerminalToken.of(tokens[i]);
        return mappedTokens;
    }

    public void replaceTokens(TerminalToken[] tokens, int start, int end) {
        if (!this.record)
            return;
        tokens = filterTokens(tokens);
        if (tokens.length == 0)
            return;
        this.data.replacedTokensPtr++;
        if (this.data.replacedTokensStart == null) {
            this.data.replacedTokens = new TerminalToken[10][];
            this.data.replacedTokensStart = new int[10];
            this.data.replacedTokensEnd = new int[10];
            this.data.replacedTokenUsed = new boolean[10];
        } else if (this.data.replacedTokensStart.length == this.data.replacedTokensPtr) {
            int length = this.data.replacedTokensStart.length;
            System.arraycopy(this.data.replacedTokens, 0, this.data.replacedTokens = new TerminalToken[length * 2][], 0,
                length);
            System.arraycopy(this.data.replacedTokensStart, 0, this.data.replacedTokensStart = new int[length * 2], 0,
                length);
            System.arraycopy(this.data.replacedTokensEnd, 0, this.data.replacedTokensEnd = new int[length * 2], 0,
                length);
            System.arraycopy(this.data.replacedTokenUsed, 0, this.data.replacedTokenUsed = new boolean[length * 2], 0,
                length);
        }
        this.data.replacedTokens[this.data.replacedTokensPtr] = reverse(tokens);
        this.data.replacedTokensStart[this.data.replacedTokensPtr] = start;
        this.data.replacedTokensEnd[this.data.replacedTokensPtr] = end;
        this.data.replacedTokenUsed[this.data.replacedTokensPtr] = false;
    }

    public void removeTokens(int start, int end) {
        if (!this.record)
            return;
        this.data.removedTokensPtr++;
        if (this.data.removedTokensStart == null) {
            this.data.removedTokensStart = new int[10];
            this.data.removedTokensEnd = new int[10];
            this.data.removedTokenUsed = new boolean[10];
        } else if (this.data.removedTokensStart.length == this.data.removedTokensPtr) {
            int length = this.data.removedTokensStart.length;
            System.arraycopy(this.data.removedTokensStart, 0, this.data.removedTokensStart = new int[length * 2], 0,
                length);
            System.arraycopy(this.data.removedTokensEnd, 0, this.data.removedTokensEnd = new int[length * 2], 0,
                length);
            System.arraycopy(this.data.removedTokenUsed, 0, this.data.removedTokenUsed = new boolean[length * 2], 0,
                length);
        }
        this.data.removedTokensStart[this.data.removedTokensPtr] = start;
        this.data.removedTokensEnd[this.data.removedTokensPtr] = end;
        this.data.removedTokenUsed[this.data.removedTokensPtr] = false;
    }

    @Override
    protected TerminalToken getNextToken0() throws InvalidInputException {
        if (this.pendingTokensPtr > -1) {
            TerminalToken pendingToken = this.pendingTokens[this.pendingTokensPtr--];
            if (pendingToken == TerminalToken.TokenNameIdentifier) {
                this.fakeTokenSource = FAKE_IDENTIFIER;
            } else {
                this.fakeTokenSource = CharOperation.NO_CHAR;
            }
            return pendingToken;
        }

        this.fakeTokenSource = null;

        if (this.data.insertedTokens != null) {
            for (int i = 0; i <= this.data.insertedTokensPtr; i++) {
                if (this.data.insertedTokensPosition[i] == this.currentPosition - 1
                    && i > this.skipNextInsertedTokens) {
                    this.data.insertedTokenUsed[i] = true;
                    this.pendingTokens = this.data.insertedTokens[i];
                    this.pendingTokensPtr = this.data.insertedTokens[i].length - 1;
                    this.startPosition = this.currentPosition;
                    this.skipNextInsertedTokens = i;
                    TerminalToken pendingToken = this.pendingTokens[this.pendingTokensPtr--];
                    if (pendingToken == TerminalToken.TokenNameIdentifier) {
                        this.fakeTokenSource = FAKE_IDENTIFIER;
                    } else {
                        this.fakeTokenSource = CharOperation.NO_CHAR;
                    }
                    return pendingToken;
                }
            }
            this.skipNextInsertedTokens = -1;
        }

        int previousLocation = this.currentPosition;
        TerminalToken currentToken = super.getNextToken0();

        if (this.data.replacedTokens != null) {
            for (int i = 0; i <= this.data.replacedTokensPtr; i++) {
                if (this.data.replacedTokensStart[i] >= previousLocation
                    && this.data.replacedTokensStart[i] <= this.startPosition
                    && this.data.replacedTokensEnd[i] >= this.currentPosition - 1) {
                    this.data.replacedTokenUsed[i] = true;
                    this.pendingTokens = this.data.replacedTokens[i];
                    this.pendingTokensPtr = this.data.replacedTokens[i].length - 1;
                    this.fakeTokenSource = FAKE_IDENTIFIER;
                    this.currentPosition = this.data.replacedTokensEnd[i] + 1;
                    TerminalToken pendingToken = this.pendingTokens[this.pendingTokensPtr--];
                    if (pendingToken == TerminalToken.TokenNameIdentifier) {
                        this.fakeTokenSource = FAKE_IDENTIFIER;
                    } else {
                        this.fakeTokenSource = CharOperation.NO_CHAR;
                    }
                    return pendingToken;
                }
            }
        }
        if (this.data.removedTokensStart != null) {
            for (int i = 0; i <= this.data.removedTokensPtr; i++) {
                if (this.data.removedTokensStart[i] >= previousLocation
                    && this.data.removedTokensStart[i] <= this.startPosition
                    && this.data.removedTokensEnd[i] >= this.currentPosition - 1) {
                    this.data.removedTokenUsed[i] = true;
                    this.currentPosition = this.data.removedTokensEnd[i] + 1;
                    return getNextToken0();
                }
            }
        }
        return currentToken;
    }

    @Override
    public char[] getCurrentIdentifierSource() {
        if (this.fakeTokenSource != null)
            return this.fakeTokenSource;
        return super.getCurrentIdentifierSource();
    }

    @Override
    public char[] getCurrentTokenSourceString() {
        if (this.fakeTokenSource != null)
            return this.fakeTokenSource;
        return super.getCurrentTokenSourceString();
    }

    @Override
    public char[] getCurrentTokenSource() {
        if (this.fakeTokenSource != null)
            return this.fakeTokenSource;
        return super.getCurrentTokenSource();
    }

    public RecoveryScannerData getData() {
        return this.data;
    }

    public void setData(RecoveryScannerData data) {
        if (data == null) {
            this.data = new RecoveryScannerData();
        } else {
            this.data = data;
        }
    }

    public void setPendingTokens(TerminalToken[] pendingTokens) {
        this.pendingTokens = pendingTokens;
        this.pendingTokensPtr = pendingTokens.length - 1;
    }
}
