// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2014, 2015 Mateusz Matela and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Formatter does not format Java code correctly, especially when max line width is set - https://bugs.eclipse.org/303519
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter;

import java.util.List;

/**
 * Helper class that can be subclassed every time an algorithm needs to swipe through all or part of the tokens and
 * easily keep track or previous and future tokens and whitespace.
 */
public abstract class TokenTraverser {
    /** General purpose field that can be used by subclasses to count things */
    protected int counter = 0;
    /** General purpose field that can be used by subclasses to store an integer value */
    protected int value = 0;

    private boolean spaceBefore, spaceAfter;
    private int lineBreaksBefore, lineBreaksAfter;
    private Token previous, current, next;
    private boolean structureChanged = false;

    protected abstract boolean token(Token token, int index);

    /**
     * Must be called every time tokens are added or removed from the list that is currently being traversed so that
     * cached data can be refreshed.
     */
    protected void structureChanged() {
        this.structureChanged = true;
    }

    protected boolean isSpaceBefore() {
        return this.spaceBefore;
    }

    protected boolean isSpaceAfter() {
        return this.spaceAfter;
    }

    protected int getLineBreaksBefore() {
        return this.lineBreaksBefore;
    }

    protected int getLineBreaksAfter() {
        return this.lineBreaksAfter;
    }

    protected Token getPrevious() {
        return this.previous;
    }

    protected Token getCurrent() {
        return this.current;
    }

    protected Token getNext() {
        return this.next;
    }

    private void initTraverse(List<Token> tokens, int startIndex) {
        if (tokens.isEmpty())
            return;
        this.structureChanged = false;

        this.previous = this.next = null;
        if (startIndex > 0)
            this.previous = tokens.get(startIndex - 1);
        this.current = tokens.get(startIndex);
        this.lineBreaksBefore = Math.max(this.previous != null ? this.previous.getLineBreaksAfter() : 0,
            this.current.getLineBreaksBefore());
        this.spaceBefore = this.current.isSpaceBefore();
        if (this.lineBreaksBefore == 0) {
            this.spaceBefore = this.spaceBefore || (this.previous != null && this.previous.isSpaceAfter());
        }
    }

    public int traverse(List<Token> tokens, int startIndex) {
        initTraverse(tokens, startIndex);

        for (int i = startIndex; i < tokens.size(); i++) {
            if (this.structureChanged)
                initTraverse(tokens, i);

            this.next = null;
            if (i < tokens.size() - 1) {
                this.next = tokens.get(i + 1);
            }
            this.lineBreaksAfter
                = Math.max(this.current.getLineBreaksAfter(), this.next != null ? this.next.getLineBreaksBefore() : 0);
            this.spaceAfter = this.current.isSpaceAfter();
            if (this.lineBreaksAfter == 0) {
                this.spaceAfter = this.spaceAfter || (this.next != null && this.next.isSpaceBefore());
            }

            if (!this.token(this.current, i))
                return i;

            if (this.next != null) {
                this.previous = this.current;
                this.current = this.next;
                this.lineBreaksBefore = this.lineBreaksAfter;
                this.spaceBefore = this.spaceAfter;
                if (this.lineBreaksBefore > 0)
                    this.spaceBefore = this.current.isSpaceBefore();
            }
        }
        return tokens.size() - 1;
    }
}
