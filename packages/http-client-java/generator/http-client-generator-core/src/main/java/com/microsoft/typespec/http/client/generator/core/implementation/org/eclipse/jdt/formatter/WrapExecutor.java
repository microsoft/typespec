// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2014, 2023 Mateusz Matela and others.
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
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] follow up bug for comments - https://bugs.eclipse.org/458208
 *     Mateusz Matela <mateusz.matela@gmail.com> - NPE in WrapExecutor during Java text formatting  - https://bugs.eclipse.org/465669
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOMMENT_BLOCK;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOMMENT_JAVADOC;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOMMENT_LINE;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameTextBlock;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameWHITESPACE;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.ScannerHelper;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter.Token.WrapMode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter.Token.WrapPolicy;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.function.Predicate;

public class WrapExecutor {

    private static class WrapInfo {
        public int wrapTokenIndex;
        public int indent;

        public WrapInfo(int wrapIndex, int indent) {
            this.wrapTokenIndex = wrapIndex;
            this.indent = indent;
        }

        public WrapInfo() {
            // empty constructor
        }

        @Override
        public int hashCode() {

            int result = 1;
            result = 31 * result + this.indent;
            result = 31 * result + this.wrapTokenIndex;
            return result;
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj)
                return true;
            if (obj == null)
                return false;
            if (getClass() != obj.getClass())
                return false;
            WrapInfo other = (WrapInfo) obj;
            if (this.indent != other.indent)
                return false;
            return this.wrapTokenIndex == other.wrapTokenIndex;
        }
    }

    /**
     * @param penalty Penalty for used wraps
     * @param extraPenalty Penalty for exceeding line limit and extra lines in comments
     * @param nextWrap
     * Contains information about the next wrap in the result or <code>null</code> if this is the last wrap. Can be
     * used as a key in {@link WrapExecutor#wrapSearchResults} to retrieve the next wraps.
     */
    private record WrapResult(double penalty, int extraPenalty, WrapInfo nextWrap) {
        public static final WrapResult NO_WRAP_NEEDED = new WrapResult(0, 0, null);
    }

    private class LineAnalyzer extends TokenTraverser {

        private final TokenManager tm2 = WrapExecutor.this.tm;
        private final CommentWrapExecutor commentWrapper;
        private int lineIndent;
        int firstPotentialWrap;
        int activeTopPriorityWrap;
        int minStructureDepth;
        int extraLines;
        int lineWidthExtent;
        boolean isNextLineWrapped;
        final List<Integer> extraLinesPerComment = new ArrayList<>();
        final List<Integer> topPriorityGroupStarts = new ArrayList<>();
        private int currentTopPriorityGroupEnd;
        private boolean isNLSTagInLine;

        public LineAnalyzer(TokenManager tokenManager, DefaultCodeFormatterOptions options) {
            this.commentWrapper = new CommentWrapExecutor(tokenManager, options);
        }

        /**
         * @return index of the last token in line
         */
        public int analyzeLine(int startIndex, int indent) {
            Token startToken = this.tm2.get(startIndex);
            assert startToken.getLineBreaksBefore() > 0;
            this.counter = this.tm2.toIndent(indent, startToken.isWrappable());
            this.lineIndent = indent;
            this.firstPotentialWrap = -1;
            this.activeTopPriorityWrap = -1;
            this.minStructureDepth = Integer.MAX_VALUE;
            this.extraLines = 0;
            this.lineWidthExtent = 0;
            this.isNextLineWrapped = false;
            this.extraLinesPerComment.clear();
            this.topPriorityGroupStarts.clear();
            this.currentTopPriorityGroupEnd = -1;
            this.isNLSTagInLine = false;
            int lastIndex = this.tm2.traverse(startIndex, this);
            return lastIndex + (this.isNextLineWrapped ? 1 : 0);
        }

        @Override
        protected boolean token(Token token, int index) {
            setIndent(token, this.lineIndent);

            if (token.hasNLSTag())
                this.isNLSTagInLine = true;

            if (token.isWrappable() && isWrapInsideFormatRegion(index)) {
                WrapPolicy wrapPolicy = token.getWrapPolicy();
                if (wrapPolicy.wrapMode() == WrapMode.TOP_PRIORITY
                    && getLineBreaksBefore() == 0
                    && index > this.currentTopPriorityGroupEnd) {
                    if (isActiveTopPriorityWrap(index, wrapPolicy)) {
                        this.activeTopPriorityWrap = index;
                    } else {
                        this.topPriorityGroupStarts.add(index);
                        this.currentTopPriorityGroupEnd = wrapPolicy.groupEndIndex();
                    }
                    if (this.firstPotentialWrap < 0)
                        this.firstPotentialWrap = index;
                } else if (this.firstPotentialWrap < 0 && getWrapIndent(token) < this.counter) {
                    this.firstPotentialWrap = index;
                }
                this.minStructureDepth = Math.min(this.minStructureDepth, wrapPolicy.structureDepth());
            }

            if (token.getAlign() > 0) {
                this.counter = token.getAlign();
            } else if (isSpaceBefore()
                && getLineBreaksBefore() == 0
                && index > 0
                && token.tokenType != TokenNameCOMMENT_LINE) {
                this.counter++;
            }

            if (token.tokenType == TokenNameTextBlock) {
                List<Token> lines = token.getInternalStructure();
                if (lines == null) {
                    this.counter = this.tm2.getLength(token, 0);
                } else {
                    this.lineWidthExtent
                        = Math.max(this.lineWidthExtent, this.counter + this.tm2.getLength(lines.get(0), this.counter));
                    this.counter = this.lineIndent + lines.get(1).getIndent();
                    lines.stream()
                        .skip(1)
                        .forEach(e -> this.lineWidthExtent
                            = Math.max(this.lineWidthExtent, this.counter + this.tm2.getLength(e, this.counter)));
                    this.counter += this.tm2.getLength(lines.get(lines.size() - 1), this.counter);
                }
            } else if (!token.isComment()) {
                this.counter += this.tm2.getLength(token, this.counter);
            } else if (token.tokenType != TokenNameCOMMENT_LINE) {
                this.counter = this.commentWrapper.wrapMultiLineComment(token, this.counter, true, this.isNLSTagInLine);
                this.extraLines += this.commentWrapper.getLinesCount() - 1;
                this.extraLinesPerComment.add(this.commentWrapper.getLinesCount() - 1);
            }

            this.lineWidthExtent = Math.max(this.lineWidthExtent, this.counter);
            if (this.lineWidthExtent > WrapExecutor.this.options.page_width && this.firstPotentialWrap >= 0) {
                return false;
            }

            if (getNext() != null && getNext().isWrappable() && getLineBreaksAfter() > 0) {
                this.isNextLineWrapped = true;
                if (this.firstPotentialWrap < 0)
                    this.firstPotentialWrap = index + 1;
                return false;
            }

            boolean isLineEnd = getLineBreaksAfter() > 0
                || getNext() == null
                || (getNext().isNextLineOnWrap() && this.tm2.get(this.tm2.findFirstTokenInLine(index)).isWrappable());
            return !isLineEnd;
        }

        private boolean isActiveTopPriorityWrap(int index, WrapPolicy wrapPolicy) {
            if (this.activeTopPriorityWrap >= 0)
                return false;

            for (int i = index - 1; i > wrapPolicy.wrapParentIndex(); i--) {
                Token token = this.tm2.get(i);
                if (token.isWrappable()
                    && token.getWrapPolicy().wrapParentIndex() == wrapPolicy.wrapParentIndex()
                    && (token.getLineBreaksBefore() > 0 || this.tm2.get(i - 1).getLineBreaksAfter() > 0)) {
                    return true;
                }
            }
            return false;
        }
    }

    private class WrapsApplier extends TokenTraverser {

        private final TokenManager tm2 = WrapExecutor.this.tm;
        private final ArrayDeque<Token> stack = new ArrayDeque<>();
        private int initialIndent;
        private int currentIndent;
        private int fixedIndentDelta;
        private WrapInfo nextWrap;

        public WrapsApplier() {
            // nothing to do
        }

        @Override
        protected boolean token(Token token, int index) {
            if (index == 0 || getLineBreaksBefore() > 0) {
                newLine(token, index);
            } else if ((this.nextWrap != null && index == this.nextWrap.wrapTokenIndex)
                || checkForceWrap(token, index, this.currentIndent)
                || (token.isNextLineOnWrap() && this.tm2.get(this.tm2.findFirstTokenInLine(index)).isWrappable())) {
                token.breakBefore();
                newLine(token, index);
            } else {
                checkOnColumnAlign(token, index);
                setIndent(token, this.currentIndent);
            }
            return true;
        }

        private void checkOnColumnAlign(Token token, int index) {
            // if some further tokens in a group are wrapped on column,
            // the first one should be aligned on column even if it's not wrapped
            WrapPolicy wrapPolicy = token.getWrapPolicy();
            if (wrapPolicy == null || !wrapPolicy.indentOnColumn() || !wrapPolicy.isFirstInGroup())
                return;
            int positionInLine = this.tm2.getPositionInLine(index);
            if (this.tm2.toIndent(positionInLine, true) == positionInLine)
                return;

            Predicate<Token> aligner = t -> {
                WrapPolicy wp = t.getWrapPolicy();
                if (wp != null && wp.indentOnColumn() && wp.wrapParentIndex() == wrapPolicy.wrapParentIndex()) {
                    this.currentIndent = this.tm2.toIndent(positionInLine, true);
                    token.setAlign(this.currentIndent);
                    this.stack.push(token);
                    return true;
                }
                return false;
            };

            // check all future wraps
            WrapInfo furtherWrap = this.nextWrap;
            while (furtherWrap != null) {
                if (aligner.test(this.tm2.get(furtherWrap.wrapTokenIndex)))
                    return;
                furtherWrap = WrapExecutor.this.wrapSearchResults.get(furtherWrap).nextWrap;
            }
            // check all tokens that are already wrapped
            for (int i = index; i <= wrapPolicy.groupEndIndex(); i++) {
                Token t = this.tm2.get(i);
                if (t.getLineBreaksBefore() > 0 && aligner.test(t))
                    return;
            }
        }

        private void newLine(Token token, int index) {
            while (!this.stack.isEmpty() && index > this.stack.peek().getWrapPolicy().groupEndIndex())
                this.stack.pop();
            if (token.getWrapPolicy() != null) {
                setIndent(token, getWrapIndent(token));
                this.stack.push(token);
            } else if (this.stack.isEmpty()) {
                if (isFixedLineStart(token, index)) {
                    int fixedIndent = this.tm2.findSourcePositionInLine(token.originalStart);
                    this.initialIndent = fixedIndent;
                    this.fixedIndentDelta = fixedIndent - token.getIndent();
                } else {
                    this.initialIndent = Math.max(0, token.getIndent() + this.fixedIndentDelta);
                }
                WrapExecutor.this.wrapSearchResults.clear();
            }

            this.currentIndent = this.stack.isEmpty() ? this.initialIndent : this.stack.peek().getIndent();
            setIndent(token, this.currentIndent);
            this.nextWrap = findWrapsCached(index, this.currentIndent).nextWrap;
        }

        private boolean isFixedLineStart(Token token, int index) {
            if (index > 0 && this.tm2.countLineBreaksBetween(getPrevious(), token) == 0)
                return false;
            if (isWrapInsideFormatRegion(index))
                return false;
            int start = token.originalStart;
            boolean inDisableFormat = this.tm2.getDisableFormatTokenPairs()
                .stream()
                .anyMatch(p -> p[0].originalStart <= start && p[1].originalStart >= start);
            return !inDisableFormat;
        }
    }

    private class NLSTagHandler extends TokenTraverser {
        private final ArrayList<Token> nlsTags = new ArrayList<>();

        public NLSTagHandler() {
            // nothing to do
        }

        @Override
        protected boolean token(final Token token, final int index) {
            if (token.hasNLSTag())
                this.nlsTags.add(token.getNLSTag());

            if (getLineBreaksAfter() > 0 || getNext() == null) {
                // make sure there's a line comment with all necessary NLS tags
                Token lineComment = token;
                if (token.tokenType != TokenNameCOMMENT_LINE) {
                    if (this.nlsTags.isEmpty())
                        return true;
                    lineComment = new Token(token.originalEnd + 1, token.originalEnd + 1, TokenNameCOMMENT_LINE);
                    lineComment.breakAfter();
                    lineComment.spaceBefore();
                    lineComment.setAlign(WrapExecutor.this.tm.getNLSAlign(index));
                    lineComment.setInternalStructure(new ArrayList<>());
                    WrapExecutor.this.tm.insert(index + 1, lineComment);
                    fixWrapPolicyParents(index, 1);
                    structureChanged();
                    return true; // will fill the line comment structure in next step
                }

                List<Token> structure = lineComment.getInternalStructure();
                if (structure == null) {
                    if (this.nlsTags.isEmpty())
                        return true;
                    structure = new ArrayList<>();
                    structure.add(lineComment);
                    lineComment.setInternalStructure(structure);
                }

                boolean isPrefixMissing = false;
                for (int i = 0; i < structure.size(); i++) {
                    Token fragment = structure.get(i);
                    // remove NLS tags that are not associated with this line
                    // (these have been added on wrapped lines earlier)
                    if (fragment.hasNLSTag()) {
                        if (!this.nlsTags.remove(fragment)) {
                            if (i == 0)
                                isPrefixMissing = true;
                            structure.remove(i--);
                        } else {
                            isPrefixMissing = false;
                        }
                    } else if (isPrefixMissing) {
                        // remove trailing whitespace
                        int pos = fragment.originalStart;
                        while (pos <= fragment.originalEnd
                            && ScannerHelper.isWhitespace(WrapExecutor.this.tm.charAt(pos)))
                            pos++;
                        if (pos > fragment.originalEnd) {
                            structure.remove(i--);
                            continue;
                        }
                        if (pos > fragment.originalStart) {
                            fragment = new Token(pos, fragment.originalEnd, TokenNameCOMMENT_LINE);
                            structure.set(i, fragment);
                        }

                        String fragmentString = WrapExecutor.this.tm.toString(fragment);
                        if (!fragmentString.startsWith("//")) { //$NON-NLS-1$
                            // forge a prefix
                            Token prefix = new Token(lineComment.originalStart, lineComment.originalStart + 1,
                                TokenNameCOMMENT_LINE);
                            prefix.spaceBefore();
                            structure.add(i, prefix);
                        }
                        isPrefixMissing = false;
                    }
                }
                // add all remaining tags in this line
                // (these are currently in a future line comment but will be removed)
                structure.addAll(this.nlsTags);

                if (structure.isEmpty()
                    || (structure.size() == 1 && structure.get(0).tokenType == TokenNameWHITESPACE)) {
                    // all the tags have been moved to other lines
                    WrapExecutor.this.tm.remove(index);
                    fixWrapPolicyParents(index, -1);
                    structureChanged();
                }

                this.nlsTags.clear();
            }
            return true;
        }

        private void fixWrapPolicyParents(int changeIndex, int delta) {
            TokenTraverser traverser = new TokenTraverser() {
                final HashMap<WrapPolicy, WrapPolicy> policyCache = new HashMap<>();

                @Override
                protected boolean token(Token token, int index) {
                    WrapPolicy policy = token.getWrapPolicy();
                    if (policy != null && policy.wrapParentIndex() > changeIndex) {
                        WrapPolicy changedWp = this.policyCache.computeIfAbsent(policy,
                            p -> new WrapPolicy(p.wrapMode(), p.wrapParentIndex() + delta,
                                p.groupEndIndex() == -1 ? -1 : p.groupEndIndex() + delta, p.extraIndent(),
                                p.structureDepth(), p.penaltyMultiplier(), p.isFirstInGroup(), p.indentOnColumn()));
                        token.setWrapPolicy(changedWp);
                    }
                    if (token.tokenType == TokenNameCOMMENT_LINE && token.getInternalStructure() != null) {
                        traverse(token.getInternalStructure(), 0);
                        structureChanged();
                    }
                    return true;
                }
            };
            WrapExecutor.this.tm.traverse(changeIndex, traverser);
        }
    }

    private final static int[] EMPTY_ARRAY = { };

    final HashMap<WrapInfo, WrapResult> wrapSearchResults = new HashMap<>();
    private final ArrayDeque<WrapInfo> wrapSearchStack = new ArrayDeque<>();

    private final LineAnalyzer lineAnalyzer;

    final TokenManager tm;
    final DefaultCodeFormatterOptions options;
    final List<Region> regions;

    private final WrapInfo wrapInfoTemp = new WrapInfo();

    public WrapExecutor(TokenManager tokenManager, DefaultCodeFormatterOptions options, List<Region> regions) {
        this.tm = tokenManager;
        this.options = options;
        this.regions = regions;
        this.lineAnalyzer = new LineAnalyzer(tokenManager, options);
    }

    public void executeWraps() {
        this.tm.traverse(0, new WrapsApplier());
        this.tm.traverse(0, new NLSTagHandler());
    }

    WrapResult findWrapsCached(final int startTokenIndex, final int indent) {
        this.wrapInfoTemp.wrapTokenIndex = startTokenIndex;
        this.wrapInfoTemp.indent = indent;
        WrapResult wrapResult = this.wrapSearchResults.get(this.wrapInfoTemp);

        // pre-existing result may be based on different wrapping of earlier tokens and therefore be wrong
        WrapResult wr = wrapResult;
        boolean cacheMissAllowed = true;
        int lookupLimit = 50;
        while (wr != null && wr.nextWrap != null && lookupLimit-- > 0) {
            WrapInfo wi = wr.nextWrap;
            Token token = this.tm.get(wi.wrapTokenIndex);
            if (token.getWrapPolicy().wrapParentIndex() < startTokenIndex && getWrapIndent(token) != wi.indent) {
                wrapResult = null;
                cacheMissAllowed = false;
                break;
            }
            wr = this.wrapSearchResults.get(wi);
        }

        if (wrapResult != null)
            return wrapResult;

        this.wrapSearchStack.push(new WrapInfo(startTokenIndex, indent));
        if (this.wrapSearchStack.size() > 1 && cacheMissAllowed)
            return null; // cache miss, need to find wraps later in main stack processing

        ArrayList<WrapInfo> reverseStackTemp = new ArrayList<>();
        // run main stack processing
        while (true) {
            final WrapInfo item = this.wrapSearchStack.peek();
            Token token = this.tm.get(item.wrapTokenIndex);
            token.setWrapped(true);
            wrapResult = findWraps(item.wrapTokenIndex, item.indent);

            assert (wrapResult == null) == (this.wrapSearchStack.peek() != item);
            if (wrapResult != null) {
                token.setWrapped(false);
                this.wrapSearchStack.pop();
                this.wrapSearchResults.put(item, wrapResult);
                assert wrapResult.nextWrap == null || this.wrapSearchResults.get(wrapResult.nextWrap) != null;
                if (item.wrapTokenIndex == startTokenIndex && item.indent == indent)
                    break;
            } else {
                // reverse order of new items
                while (this.wrapSearchStack.peek() != item)
                    reverseStackTemp.add(this.wrapSearchStack.pop());
                for (WrapInfo item2 : reverseStackTemp)
                    this.wrapSearchStack.push(item2);
                reverseStackTemp.clear();
            }
        }
        return wrapResult;
    }

    /**
     * The main algorithm that looks for optimal places to wrap. Calls itself recursively to get results for wrapped
     * sub-lines.
     */
    private WrapResult findWraps(int wrapTokenIndex, int indent) {
        final int lastIndex = this.lineAnalyzer.analyzeLine(wrapTokenIndex, indent);
        final boolean nextLineWrapped = this.lineAnalyzer.isNextLineWrapped;
        int lineOverflow = Math.max(0, this.lineAnalyzer.lineWidthExtent - this.options.page_width);
        final boolean wrapRequired = lineOverflow > 0 || nextLineWrapped;
        int extraLines = this.lineAnalyzer.extraLines;
        final int firstPotentialWrap = this.lineAnalyzer.firstPotentialWrap;
        final int activeTopPriorityWrap = this.lineAnalyzer.activeTopPriorityWrap;

        final int[] extraLinesPerComment = toArray(this.lineAnalyzer.extraLinesPerComment);
        int commentIndex = extraLinesPerComment.length;

        final int[] topPriorityGroupStarts = toArray(this.lineAnalyzer.topPriorityGroupStarts);
        int topPriorityIndex = topPriorityGroupStarts.length - 1;
        int nearestGroupEnd = topPriorityIndex == -1
            ? 0
            : this.tm.get(topPriorityGroupStarts[topPriorityIndex]).getWrapPolicy().groupEndIndex();

        double bestTotalPenalty = getWrapPenalty(wrapTokenIndex, indent, lastIndex + 1, -1, WrapResult.NO_WRAP_NEEDED);
        int bestExtraPenalty = lineOverflow + extraLines;
        int bestNextWrap = -1;
        int bestIndent = 0;
        boolean cacheMiss = false;

        if (!wrapRequired
            && activeTopPriorityWrap < 0
            && (!this.options.join_wrapped_lines || !this.options.wrap_outer_expressions_when_nested)) {
            return new WrapResult(bestTotalPenalty, bestExtraPenalty, null);
        }

        // optimization: if there's a possible wrap at depth lower than line start, ignore the rest
        int depthLimit = Integer.MAX_VALUE;
        Token token = this.tm.get(wrapTokenIndex);
        if (token.isWrappable() && this.options.wrap_outer_expressions_when_nested && activeTopPriorityWrap < 0) {
            int currentDepth = token.getWrapPolicy().structureDepth();
            if (this.lineAnalyzer.minStructureDepth < currentDepth)
                depthLimit = currentDepth;
        }
        // optimization: turns out there's no point checking multiple wraps with the same policy
        LinkedHashSet<WrapPolicy> policiesTried = new LinkedHashSet<>();

        for (int i = lastIndex; firstPotentialWrap >= 0 && i >= firstPotentialWrap; i--) {
            token = this.tm.get(i);
            if (commentIndex > 0
                && (token.tokenType == TokenNameCOMMENT_BLOCK || token.tokenType == TokenNameCOMMENT_JAVADOC)) {
                extraLines -= extraLinesPerComment[--commentIndex];
                if (extraLinesPerComment[commentIndex] > 0)
                    policiesTried.clear();
            }
            if (topPriorityIndex >= 0 && i <= nearestGroupEnd) {
                if (i > topPriorityGroupStarts[topPriorityIndex])
                    continue;
                assert i == topPriorityGroupStarts[topPriorityIndex];
                topPriorityIndex--;
                nearestGroupEnd = topPriorityIndex == -1
                    ? 0
                    : this.tm.get(topPriorityGroupStarts[topPriorityIndex]).getWrapPolicy().groupEndIndex();
            }

            WrapPolicy wrapPolicy = token.getWrapPolicy();
            if (!token.isWrappable()
                || (activeTopPriorityWrap >= 0 && i != activeTopPriorityWrap)
                || policiesTried.contains(wrapPolicy)
                || wrapPolicy.structureDepth() >= depthLimit
                || !isWrapInsideFormatRegion(i))
                continue;
            policiesTried.add(wrapPolicy);

            int nextWrapIndent = getWrapIndent(token);
            WrapResult nextWrapResult = findWrapsCached(i, nextWrapIndent);
            cacheMiss |= nextWrapResult == null;
            if (cacheMiss)
                continue;

            double totalPenalty = getWrapPenalty(wrapTokenIndex, indent, i, nextWrapIndent, nextWrapResult);
            int totalExtraPenalty = nextWrapResult.extraPenalty + extraLines;
            if (lineOverflow > 0) {
                int position = this.tm.getPositionInLine(i - 1);
                position += this.tm.getLength(this.tm.get(i - 1), position);
                lineOverflow = position - this.options.page_width;
                totalExtraPenalty += Math.max(0, lineOverflow);
            }
            boolean isBetter = totalExtraPenalty < bestExtraPenalty
                || i == activeTopPriorityWrap
                || (bestNextWrap < 0 && wrapRequired);
            if (!isBetter && totalExtraPenalty == bestExtraPenalty)
                isBetter = totalPenalty < bestTotalPenalty || bestTotalPenalty == Double.MAX_VALUE;
            if (isBetter) {
                bestTotalPenalty = totalPenalty;
                bestExtraPenalty = totalExtraPenalty;
                bestNextWrap = i;
                bestIndent = nextWrapIndent;

                if (!this.options.wrap_outer_expressions_when_nested || i == activeTopPriorityWrap || nextLineWrapped)
                    break;
            }
        }
        if (cacheMiss)
            return null;

        return new WrapResult(bestTotalPenalty, bestExtraPenalty,
            bestNextWrap == -1 ? null : new WrapInfo(bestNextWrap, bestIndent));
    }

    private double getWrapPenalty(int lineStartIndex, int lineIndent, int wrapIndex, int wrapIndent,
        WrapResult wrapResult) {
        WrapPolicy wrapPolicy = null;
        Token wrapToken = null;
        if (wrapIndex < this.tm.size()) {
            wrapToken = this.tm.get(wrapIndex);
            wrapPolicy = wrapToken.getWrapPolicy();
            if (wrapIndent < 0)
                wrapIndent = getWrapIndent(this.tm.get(wrapIndex));
        }

        double penalty = wrapToken != null && wrapToken.isWrappable() ? getPenalty(wrapPolicy) : 0;

        // First parameter in method invocation has higher penalty to make wrapping more similar to the old formatter.
        // This can lead to an undesired effect like this (should wrap aaaaaa and bbbbbb, not .bar):
        // foo.foo
        // .bar(aaaaaa,
        // bbbbbbb);
        if (wrapIndent > lineIndent)
            penalty *= 1 + 3.0 / 16;

        // Avoid ugly formations like this (bar2 should be wrapped):
        // foooooo(bar1(aaaaaa,
        // bbb), bar2(aaa,
        // bbbbbb)
        // Assuming lineStartIndex is at bbb, look for unwrapped bar2 and if found,
        // add more penalty than if it was wrapped.
        Token lineStartToken = this.tm.get(lineStartIndex);
        WrapPolicy lineStartWrapPolicy = lineStartToken.getWrapPolicy();
        if (wrapToken != null && wrapToken.isWrappable() && lineStartToken.isWrappable()) {
            for (int i = lineStartIndex + 1; i < wrapIndex; i++) {
                WrapPolicy intermediatePolicy = this.tm.get(i).getWrapPolicy();
                if (intermediatePolicy != null
                    && intermediatePolicy.structureDepth() < lineStartWrapPolicy.structureDepth()
                    && intermediatePolicy.structureDepth() < wrapPolicy.structureDepth()) {
                    penalty += getPenalty(intermediatePolicy) * 1.25;
                }
            }
        }

        // In the previous example, bar1 should be wrapped too, to emphasize that bar1 and bar2 are the same level.
        // Assuming wrapIndex is at bar1, check if there is a higher depth wrap (bbb) followed by
        // a wrap of the same parent (bar2). If so, then bar1 must be wrapped (so give it negative penalty).
        // Update: Actually, every token that is followed by a higher level depth wrap should be also wrapped,
        // as long as this next wrap is not the last in line and the token is not the first in its wrap group.
        WrapInfo nextWrap = wrapResult.nextWrap;
        boolean checkDepth = wrapToken != null
            && wrapToken.isWrappable()
            && (lineStartWrapPolicy == null || wrapPolicy.structureDepth() >= lineStartWrapPolicy.structureDepth());
        double penaltyDiff = 0;
        while (checkDepth && nextWrap != null) {
            WrapPolicy nextPolicy = this.tm.get(nextWrap.wrapTokenIndex).getWrapPolicy();
            if (nextPolicy.wrapParentIndex() == wrapPolicy.wrapParentIndex()
                || (penaltyDiff != 0 && !wrapPolicy.isFirstInGroup())) {
                penalty -= penaltyDiff * (1 + 1.0 / 64);
                break;
            }
            if (nextPolicy.structureDepth() <= wrapPolicy.structureDepth())
                break;
            penaltyDiff = Math.max(penaltyDiff, getPenalty(nextPolicy));
            nextWrap = this.wrapSearchResults.get(nextWrap).nextWrap;
        }

        return penalty + wrapResult.penalty;
    }

    private double getPenalty(WrapPolicy policy) {
        return Math.exp(policy.structureDepth()) * policy.penaltyMultiplier();
    }

    boolean checkForceWrap(Token token, int index, int currentIndent) {
        // A token that will have smaller indent when wrapped than the current line indent,
        // should be wrapped because it's a low depth token following some complex wraps of higher depth.
        // This rule could not be implemented in getWrapPenalty() because a token's wrap indent may depend
        // on wraps in previous lines, which are not determined yet when the token's penalty is calculated.
        if (!token.isWrappable()
            || !this.options.wrap_outer_expressions_when_nested
            || getWrapIndent(token) >= currentIndent)
            return false;
        WrapPolicy lineStartPolicy = this.tm.get(this.tm.findFirstTokenInLine(index, false, true)).getWrapPolicy();
        return lineStartPolicy != null && lineStartPolicy.wrapMode() != WrapMode.BLOCK_INDENT;
    }

    private int[] toArray(List<Integer> list) {
        if (list.isEmpty())
            return EMPTY_ARRAY;
        int[] result = new int[list.size()];
        int i = 0;
        for (int item : list) {
            result[i++] = item;
        }
        return result;
    }

    boolean isWrapInsideFormatRegion(int tokenIndex) {
        int pos1 = tokenIndex == 0 ? 0 : this.tm.get(tokenIndex - 1).originalEnd;
        int pos2 = this.tm.get(tokenIndex).originalStart;
        return this.regions.stream()
            .anyMatch(r -> (pos1 >= r.getOffset() && pos1 < r.getOffset() + r.getLength())
                || (pos2 >= r.getOffset() && pos2 < r.getOffset() + r.getLength()));
    }

    int getWrapIndent(Token token) {
        WrapPolicy policy = token.getWrapPolicy();
        if (policy == null)
            return token.getIndent();

        Token wrapParent = this.tm.get(policy.wrapParentIndex());
        int wrapIndent = wrapParent.getIndent();
        if (policy.indentOnColumn()) {
            wrapIndent = this.tm.getPositionInLine(policy.wrapParentIndex());
            wrapIndent += this.tm.getLength(wrapParent, wrapIndent);
            Token next = this.tm.get(policy.wrapParentIndex() + 1);
            if (wrapParent.isSpaceAfter() || (next.isSpaceBefore() && !next.isComment()))
                wrapIndent++;
        }
        wrapIndent += policy.extraIndent();
        return this.tm.toIndent(wrapIndent, true);
    }

    void setIndent(Token token, int indent) {
        token.setIndent(indent);

        List<Token> structure = token.getInternalStructure();
        if (token.tokenType == TokenNameTextBlock && structure != null) {
            int lineIndent;
            int indentOption = this.options.text_block_indentation;
            if (indentOption == 4) {
                lineIndent = this.options.indentation_size;
            } else if (indentOption == 0) {
                lineIndent = this.options.continuation_indentation * this.options.indentation_size;
            } else if (indentOption == 2) {
                lineIndent = this.tm.toIndent(this.tm.getPositionInLine(this.tm.indexOf(token)), true) - indent;
            } else {
                lineIndent = 0;
            }
            structure.stream().skip(1).forEach(t -> t.setIndent(lineIndent));
        }
    }
}
