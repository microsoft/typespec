// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2012 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOLON_COLON;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameEOF;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.Util;

public class LexStream {

    public static class Token {
        TerminalToken kind;
        char[] name;
        int start;
        int end;
        int line;

    }

    private int tokenCacheIndex;
    private int tokenCacheEOFIndex;
    private final Token[] tokenCache;

    private int currentIndex = -1;

    private final Scanner scanner;
    private final int[] intervalStartToSkip;
    private final int[] intervalEndToSkip;

    private int currentInterval = -1;
    private boolean awaitingColonColon;

    public LexStream(Scanner scanner, int[] intervalStartToSkip, int[] intervalEndToSkip, TerminalToken firstToken,
        int init, int eof) {

        this.tokenCache = new Token[32];
        this.tokenCacheIndex = 0;
        this.tokenCacheEOFIndex = Integer.MAX_VALUE;
        this.tokenCache[0] = new Token();
        this.tokenCache[0].kind = firstToken;
        this.tokenCache[0].name = CharOperation.NO_CHAR;
        this.tokenCache[0].start = init;
        this.tokenCache[0].end = init;
        this.tokenCache[0].line = 0;

        this.intervalStartToSkip = intervalStartToSkip;
        this.intervalEndToSkip = intervalEndToSkip;
        this.awaitingColonColon = false;
        scanner.resetTo(init, eof);
        this.scanner = scanner;
    }

    private void readTokenFromScanner() {
        int length = this.tokenCache.length;
        boolean tokenNotFound = true;

        while (tokenNotFound) {
            try {
                TerminalToken tokenKind = this.scanner.getNextToken();
                if (tokenKind == TerminalToken.TokenNameBeginTypeArguments) {
                    this.awaitingColonColon = true;
                } else if (tokenKind == TokenNameCOLON_COLON) {
                    this.awaitingColonColon = false;
                }
                if (tokenKind != TokenNameEOF) {
                    int start = this.scanner.getCurrentTokenStartPosition();
                    int end = this.scanner.getCurrentTokenEndPosition();

                    int nextInterval = this.currentInterval + 1;
                    if (this.intervalStartToSkip.length == 0
                        || nextInterval >= this.intervalStartToSkip.length
                        || start < this.intervalStartToSkip[nextInterval]) {
                        Token token = new Token();
                        token.kind = tokenKind;
                        token.name = this.scanner.getCurrentTokenSource();
                        token.start = start;
                        token.end = end;
                        token.line = Util.getLineNumber(end, this.scanner.lineEnds, this.scanner.linePtr);

                        this.tokenCache[++this.tokenCacheIndex % length] = token;

                        tokenNotFound = false;
                    } else {
                        this.scanner.resetTo(this.intervalEndToSkip[++this.currentInterval] + 1,
                            this.scanner.eofPosition - 1);
                    }
                } else {
                    int start = this.scanner.getCurrentTokenStartPosition();
                    int end = this.scanner.getCurrentTokenEndPosition();
                    Token token = new Token();
                    token.kind = tokenKind;
                    token.name = CharOperation.NO_CHAR;
                    token.start = start;
                    token.end = end;
                    token.line = Util.getLineNumber(end, this.scanner.lineEnds, this.scanner.linePtr);

                    this.tokenCache[++this.tokenCacheIndex % length] = token;

                    this.tokenCacheEOFIndex = this.tokenCacheIndex;
                    tokenNotFound = false;
                }
            } catch (InvalidInputException e) {
                // return next token
            }
        }
    }

    public Token token(int index) {
        if (index < 0) {
            Token eofToken = new Token();
            eofToken.kind = TokenNameEOF;
            eofToken.name = CharOperation.NO_CHAR;
            return eofToken;
        }
        if (this.tokenCacheEOFIndex >= 0 && index > this.tokenCacheEOFIndex) {
            return token(this.tokenCacheEOFIndex);
        }
        int length = this.tokenCache.length;
        if (index > this.tokenCacheIndex) {
            int tokensToRead = index - this.tokenCacheIndex;
            while (tokensToRead-- != 0) {
                readTokenFromScanner();
            }
        } else if (this.tokenCacheIndex - length >= index) {
            return null;
        }

        return this.tokenCache[index % length];
    }

    public int getToken() {
        return this.currentIndex = next(this.currentIndex);
    }

    public int previous(int tokenIndex) {
        return tokenIndex > 0 ? tokenIndex - 1 : 0;
    }

    public int next(int tokenIndex) {
        return tokenIndex < this.tokenCacheEOFIndex ? tokenIndex + 1 : this.tokenCacheEOFIndex;
    }

    public boolean afterEol(int i) {
        return i < 1 || line(i - 1) < line(i);
    }

    public void reset() {
        this.currentIndex = -1;
    }

    public void reset(int i) {
        this.currentIndex = previous(i);
    }

    public TerminalToken kind(int tokenIndex) {
        return token(tokenIndex).kind;
    }

    public char[] name(int tokenIndex) {
        return token(tokenIndex).name;
    }

    public int line(int tokenIndex) {
        return token(tokenIndex).line;
    }

    public int start(int tokenIndex) {
        return token(tokenIndex).start;
    }

    public int end(int tokenIndex) {
        return token(tokenIndex).end;
    }

    public boolean isInsideStream(int index) {
        if (this.tokenCacheEOFIndex >= 0 && index > this.tokenCacheEOFIndex) {
            return false;
        } else if (index > this.tokenCacheIndex) {
            return true;
        } else {
            return this.tokenCacheIndex - this.tokenCache.length < index;
        }
    }

    public boolean awaitingColonColon() {
        return this.awaitingColonColon;
    }
}
