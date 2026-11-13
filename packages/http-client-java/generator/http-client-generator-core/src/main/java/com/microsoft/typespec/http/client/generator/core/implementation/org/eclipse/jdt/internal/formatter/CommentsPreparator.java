// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2014, 2026 Mateusz Matela and others.
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
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] IndexOutOfBoundsException in TokenManager - https://bugs.eclipse.org/462945
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Bad line breaking in Eclipse javadoc comments - https://bugs.eclipse.org/348338
 *     Lars Vogel <Lars.Vogel@vogella.com> - Contributions for
 *     						Bug 473178
 *     IBM Corporation - Markdown support
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameCOMMENT_BLOCK;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameCOMMENT_JAVADOC;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameCOMMENT_LINE;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameCOMMENT_MARKDOWN;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameNotAToken;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameStringLiteral;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameTextBlock;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameWHITESPACE;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNamepackage;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.BlockComment;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.Javadoc;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.LineComment;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.MemberRef;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.MethodRef;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.QualifiedName;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.TagElement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.TextElement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.formatter.CodeFormatter;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.ScannerHelper;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.Token.WrapMode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.Token.WrapPolicy;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class CommentsPreparator extends ASTVisitor {

    private final static Pattern NLS_TAG_PATTERN = Pattern.compile("//\\$NON-NLS-([0-9]+)\\$"); //$NON-NLS-1$
    private final static Pattern STRING_LITERAL_PATTERN = Pattern.compile("\".*?(\\\\(\\\\\\\\)*\".*?)*\""); //$NON-NLS-1$
    private final static Pattern HTML_TAG_PATTERN;
    private final static Pattern HTML_ATTRIBUTE_PATTERN;
    static {
        // whitespace or line break with optional //$NON-NLS-1$
        // asterisk
        HTML_TAG_PATTERN = Pattern.compile("<(/)?+(?:" //$NON-NLS-1$
            + "(pre)" + '|' + "(nl|table|tr)" + '|' + "(dd|dt|li|td|th|h1|h2|h3|h4|h5|h6|q)" + '|' + "(br)" + '|'
            + "(code|tt)" + '|' + "(p|dl|ul|ol|hr|dir)" + '|' + "([\\S&&[^<>]]++)" + ')' + "(" //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
            + "(?>(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)+[\\S&&[^=]]+(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)*(=)(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)*(?>(?>\"[^\"]*\")|(?>'[^']*')|[\\S&&[^/>\"']]++))"
            + "*)" + "(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)" + "*/?>", Pattern.CASE_INSENSITIVE);
        HTML_ATTRIBUTE_PATTERN = Pattern.compile(
            "(?>(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)+[\\S&&[^=]]+(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)*(=)(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)*(?>(?>\"[^\"]*\")|(?>'[^']*')|[\\S&&[^/>\"']]++))");
    }

    private final static Pattern HTML_ENTITY_PATTERN
        = Pattern.compile("&(#x[0-9a-fA-F]+)?(#[0-9]+)?(lt)?(gt)?(nbsp)?(amp)?(circ)?(tilde)?(quot)?;"); //$NON-NLS-1$

    private final static Pattern SNIPPET_ATTRIBUTE_PATTERN;
    private final static Pattern SNIPPET_ATTRIBUTES_PATTERN;
    private final static Pattern SNIPPET_MARKUP_TAG_PATTERN;
    private final static Pattern SNIPPET_MARKUP_TAG_ARGUMENT_PATTERN;
    static {
        // whitespace or line break with optional //$NON-NLS-1$
        // asterisk
        SNIPPET_ATTRIBUTE_PATTERN = Pattern.compile(
            "(?>(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)*(class|file|id|lang|region)(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)*(=)(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)*((?>\"[^\"]*\")|(?>'[^']*')|[\\S&&[^\"':]]++))");
        SNIPPET_ATTRIBUTES_PATTERN = Pattern.compile(
            "(?>(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)*(class|file|id|lang|region)(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)*(=)(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)*((?>\"[^\"]*\")|(?>'[^']*')|[\\S&&[^\"':]]++))" //$NON-NLS-1$
                + "*" + "(?>[ \\t]++|[\\r\\n]++[ \\t]*+\\*?)" + "*(?<colon>:?)");  //$NON-NLS-1$
        SNIPPET_MARKUP_TAG_ARGUMENT_PATTERN
            = Pattern.compile("(?>[ \\t]*\\w+(?>[ \\t]*(=)[ \\t]*((?>\"[^\"]*\")|(?>'[^']*')|[\\S&&[^\"':]]++))?)");
        SNIPPET_MARKUP_TAG_PATTERN = Pattern.compile("(@start|@end|@highlight|@replace|@link)" //$NON-NLS-1$
            + "(?>[ \\t]*\\w+(?>[ \\t]*(=)[ \\t]*((?>\"[^\"]*\")|(?>'[^']*')|[\\S&&[^\"':]]++))?)" + "*");
    }

    private final static Pattern MARKDOWN_LEADING_SPACES_PATTERN = Pattern.compile("(?m)^[ \\t]*///( *)[^ ]"); //$NON-NLS-1$
    private final static Pattern MARKDOWN_HEADINGS_PATTERN_1
        = Pattern.compile("(?:(?<=^)|(?<=///[ \\t]*))(#{1,6})([ \\t]+)([^\\r\\n]*)"); //$NON-NLS-1$
    private final static Pattern MARKDOWN_HEADINGS_PATTERN_2
        = Pattern.compile("(?:^|(?<=///[ \\t]+))[ \\t]*([=-])\\1*[ \\t]*(?=\\r?\\n|$)"); //$NON-NLS-1$
    private final static Pattern MARKDOWN_FENCE_PATTERN = Pattern.compile("(`{3,}|~{3,})(.*)"); //$NON-NLS-1$
    private final static Pattern MARKDOWN_TABLE_START = Pattern.compile("(?m)(?<=^[ \\t]*)\\|"); //$NON-NLS-1$
    private final static Pattern MARKDOWN_TABLE_END = Pattern.compile("(?m)\\|(?!.*\\|)"); //$NON-NLS-1$

    // Param tags list copied from the legacy formatter for compatibility.
    // There were the following comments:
    // TODO (frederic) should have another name than 'param' for the following tags
    // TODO (frederic) investigate how and why this list was created
    private final static List<String> PARAM_TAGS = Arrays.asList("@param", "@exception", "@serialField", "@throws");

    private final static List<String> IMMUTABLE_TAGS = Arrays.asList("@code", "@literal");

    private final TokenManager tm;
    private final DefaultCodeFormatterOptions options;
    private final String sourceLevel;
    private final String formatDisableTag;
    private final String formatEnableTag;

    private Token lastLineComment;
    private int lastLineCommentPosition;

    private Token lastFormatOffComment;

    private TokenManager ctm;
    private List<Token> commentStructure;
    private int commentIndent;
    /** Index: position within current comment; Value: whether wrapping on special characters is allowed */
    private boolean[] allowSubstituteWrapping;

    private int noFormatOpenTagStartIndex = -1;
    private int formatCodeOpenTagEndIndex = -1;
    private int lastFormatCodeClosingTagIndex = -1;
    private final ArrayList<Integer> commonAttributeAnnotations = new ArrayList<>();
    private CodeFormatter preTagCodeFormatter;
    private CodeFormatter snippetCodeFormatter;

    public CommentsPreparator(TokenManager tm, DefaultCodeFormatterOptions options, String sourceLevel) {
        this.tm = tm;
        this.options = options;
        this.sourceLevel = sourceLevel;
        this.formatDisableTag = options.disabling_tag != null ? new String(options.disabling_tag) : null;
        this.formatEnableTag = options.enabling_tag != null ? new String(options.enabling_tag) : null;
    }

    @Override
    public boolean preVisit2(ASTNode node) {
        boolean isMalformed = (node.getFlags() & 1) != 0;
        return !isMalformed;
    }

    @Override
    public boolean visit(LineComment node) {
        int commentIndex = this.tm.firstIndexIn(node, TokenNameCOMMENT_LINE);
        handleLineComment(commentIndex);
        return true;
    }

    public void handleLineComment(int commentIndex) {
        Token commentToken = this.tm.get(commentIndex);

        boolean isOnFirstColumn = handleWhitespaceAround(commentIndex);

        if (handleFormatOnOffTags(commentToken))
            return;

        if (isOnFirstColumn) {
            if (this.options.comment_format_line_comment
                && !this.options.comment_format_line_comment_starting_on_first_column) {
                this.lastLineComment = null;
                commentToken.setIndent(0);
                commentToken.setWrapPolicy(WrapPolicy.FORCE_FIRST_COLUMN);
                return;
            }
            if (this.options.never_indent_line_comments_on_first_column) {
                commentToken.setIndent(0);
                commentToken.setWrapPolicy(WrapPolicy.FORCE_FIRST_COLUMN);
            }
        }

        handleNLSTags(commentToken, commentIndex);

        int positionInLine = this.tm.findSourcePositionInLine(commentToken.originalStart);
        boolean isContinuation = commentIndex > 0
            && this.tm.get(commentIndex - 1) == this.lastLineComment
            && (positionInLine >= this.lastLineCommentPosition - this.options.indentation_size + 1)
            && this.tm.countLineBreaksBetween(this.lastLineComment, commentToken) == 1;

        boolean isHeader = this.tm.isInHeader(commentIndex);
        boolean formattingEnabled
            = (isHeader ? this.options.comment_format_header : this.options.comment_format_line_comment);
        if (!formattingEnabled) {
            preserveWhitespace(commentToken, commentIndex);
            if (isContinuation) {
                WrapPolicy policy = this.lastLineComment.getWrapPolicy();
                if (policy == null) {
                    int lineStart = this.tm.getPositionInLine(this.tm.findFirstTokenInLine(commentIndex - 1));
                    int commentStart = this.tm.getPositionInLine(commentIndex - 1);
                    policy = new WrapPolicy(WrapMode.WHERE_NECESSARY, commentIndex - 1, commentStart - lineStart);
                }
                commentToken.setWrapPolicy(policy);
                this.lastLineComment = commentToken;
            } else if (commentToken.getLineBreaksBefore() == 0) {
                this.lastLineComment = commentToken;
                this.lastLineCommentPosition = positionInLine;
            }
            return;
        }

        List<Token> structure = tokenizeLineComment(commentToken);
        if (isContinuation) {
            if (this.options.join_line_comments) {
                structure.remove(0);
            } else {
                Token first = structure.get(0);
                first.breakBefore();
                first.setWrapPolicy(
                    new WrapPolicy(WrapMode.WHERE_NECESSARY, commentIndex - 1, this.lastLineCommentPosition));
            }

            // merge previous and current line comment
            Token previous = this.lastLineComment;
            Token merged = new Token(previous, previous.originalStart, commentToken.originalEnd, previous.tokenType);
            merged.putLineBreaksAfter(commentToken.getLineBreaksAfter());
            merged.setPreserveLineBreaksAfter(commentToken.isPreserveLineBreaksAfter());
            this.tm.remove(commentIndex - 1);
            this.tm.insert(commentIndex - 1, merged);
            this.tm.remove(commentIndex);
            List<Token> lastStructure = this.lastLineComment.getInternalStructure();
            lastStructure.addAll(structure);
            merged.setInternalStructure(lastStructure);
            this.lastLineComment = merged;
        } else {
            commentToken.setInternalStructure(structure);
            handleCompilerTags(commentToken, commentIndex);
            handleSnippetMarkupTags(commentToken);
            preserveWhitespace(commentToken, commentIndex);
            this.lastLineComment = commentToken;
            this.lastLineCommentPosition = positionInLine;
        }
    }

    private void preserveWhitespace(Token commentToken, int commentIndex) {
        if (this.options.comment_preserve_white_space_between_code_and_line_comments
            && commentToken.getLineBreaksBefore() == 0
            && commentIndex > 0) {
            commentToken.clearSpaceBefore();
            List<Token> structure = commentToken.getInternalStructure();
            if (structure != null && !structure.isEmpty())
                structure.get(0).clearSpaceBefore();

            Token previous = this.tm.get(commentIndex - 1);
            previous.clearSpaceAfter();
            if (previous.originalEnd + 1 >= commentToken.originalStart)
                return;
            if (structure == null || structure.isEmpty()) {
                structure = new ArrayList<>();
                structure.add(new Token(previous.originalEnd + 1, commentToken.originalEnd, TokenNameCOMMENT_LINE));
                commentToken.setInternalStructure(structure);
            } else {
                structure.add(0,
                    new Token(previous.originalEnd + 1, commentToken.originalStart - 1, TokenNameWHITESPACE));
            }
        }
    }

    /**
     * @return true if the comment contains on/off tag and should not be formatted
     */
    private boolean handleFormatOnOffTags(Token commentToken) {
        if (!this.options.use_tags)
            return false;
        String commentString = this.tm.toString(commentToken);
        int offIndex = this.formatDisableTag != null ? commentString.lastIndexOf(this.formatDisableTag) : -1;
        int onIndex = this.formatEnableTag != null ? commentString.lastIndexOf(this.formatEnableTag) : -1;
        if (this.lastFormatOffComment == null) {
            if (offIndex > onIndex)
                this.lastFormatOffComment = commentToken;
        } else {
            if (onIndex > offIndex) {
                this.tm.addDisableFormatTokenPair(this.lastFormatOffComment, commentToken);
                this.lastFormatOffComment = null;
            }
        }
        return offIndex >= 0 || onIndex >= 0;
    }

    private void handleNLSTags(Token comment, int commentIndex) {
        List<Token> stringLiterals = findStringLiteralsInLine(commentIndex);
        if (stringLiterals.isEmpty())
            return;

        List<Token> commentFragments = new ArrayList<>();
        Matcher matcher = NLS_TAG_PATTERN.matcher(this.tm.toString(comment));
        int previousMatcherEnd = 0;
        boolean nlsFound = false;
        while (matcher.find()) {
            int nlsNumber = Integer.parseInt(matcher.group(1));
            if (nlsNumber > 0 && nlsNumber <= stringLiterals.size()) {
                if (matcher.start() > previousMatcherEnd) {
                    Token fragment = new Token(comment.originalStart + previousMatcherEnd,
                        comment.originalStart + matcher.start() - 1, TokenNameCOMMENT_LINE);
                    commentFragments.add(fragment);
                }
                Token nlsTag = new Token(comment.originalStart + matcher.start(),
                    comment.originalStart + matcher.end() - 1, TokenNameCOMMENT_LINE);
                stringLiterals.get(nlsNumber - 1).setNLSTag(nlsTag);
                nlsTag.setNLSTag(stringLiterals.get(nlsNumber - 1));
                commentFragments.add(nlsTag);
                nlsFound = true;
                previousMatcherEnd = matcher.end();
            }
        }
        if (nlsFound) {
            comment.setInternalStructure(commentFragments);
            if (comment.originalStart + previousMatcherEnd <= comment.originalEnd) {
                Token fragment
                    = new Token(comment.originalStart + previousMatcherEnd, comment.originalEnd, TokenNameCOMMENT_LINE);
                commentFragments.add(fragment);
            }
        }
    }

    private void handleCompilerTags(Token commentToken, int commentIndex) {
        final String commentText = this.tm.toString(commentToken);
        final List<Token> structure = commentToken.getInternalStructure();
        if (commentText.startsWith("//$FALL-THROUGH$") //$NON-NLS-1$
            || commentText.startsWith("//$IDENTITY-COMPARISON$")) { //$NON-NLS-1$
            structure.get(1).clearSpaceBefore();
        }
        if (commentText.contains("//$IDENTITY-COMPARISON$")) { //$NON-NLS-1$
            // make sure the whole line is not broken
            Token token = commentToken;
            for (int i = commentIndex; i > 0; i--) {
                Token left = this.tm.get(i - 1);
                if (this.tm.countLineBreaksBetween(left, token) > 0)
                    break;
                token.clearLineBreaksBefore();
                left.clearLineBreaksAfter();
                token.setWrapPolicy(WrapPolicy.DISABLE_WRAP);
                token = left;
            }
        }
    }

    private void handleSnippetMarkupTags(Token commentToken) {
        String commentText = this.tm.toString(commentToken);

        Matcher m = SNIPPET_MARKUP_TAG_PATTERN.matcher(commentText);
        while (m.find()) {
            Matcher m2 = SNIPPET_MARKUP_TAG_ARGUMENT_PATTERN.matcher(m.group());
            if (!m2.find())
                continue;
            this.commentStructure = commentToken.getInternalStructure();
            this.ctm = new TokenManager(this.commentStructure, this.tm);
            if (commentToken.tokenType != TokenNameCOMMENT_LINE)
                continue;
            do {
                handleFoundAssignment(m2, 1, commentToken.originalStart + m.start());
                handleFoundStringLiteral(m2, 2, commentToken.originalStart + m.start());
            } while (m2.find());
        }
    }

    private List<Token> findStringLiteralsInLine(int lastTokenIndex) {
        List<Token> stringLiterals = new ArrayList<>();
        Token previous = this.tm.get(lastTokenIndex);
        for (int i = lastTokenIndex - 1; i >= 0; i--) {
            Token token = this.tm.get(i);
            if (this.tm.countLineBreaksBetween(token, previous) > 0)
                break;
            if (token.tokenType == TokenNameStringLiteral || token.tokenType == TokenNameTextBlock)
                stringLiterals.add(token);
            previous = token;
        }
        Collections.reverse(stringLiterals);
        return stringLiterals;
    }

    private List<Token> tokenizeLineComment(Token commentToken) {
        List<Token> fragments = commentToken.getInternalStructure();
        if (fragments == null) {
            fragments = Arrays.asList(commentToken);
        }
        ArrayList<Token> result = new ArrayList<>();
        for (Token token : fragments) {
            if (token.hasNLSTag()) {
                if (ScannerHelper.isWhitespace(this.tm.charAt(token.originalStart - 1)))
                    token.spaceBefore();
                result.add(token);
                continue;
            }
            int sourcePosition = token.originalStart;
            if (sourcePosition == commentToken.originalStart) {
                // separate starting slashes
                while (sourcePosition <= token.originalEnd && this.tm.charAt(sourcePosition) == '/')
                    sourcePosition++;
                result.add(new Token(commentToken.originalStart, sourcePosition - 1, TokenNameCOMMENT_LINE));
            }
            int tokenStart = sourcePosition;
            while (sourcePosition <= token.originalEnd + 1) {
                if (sourcePosition == token.originalEnd + 1
                    || ScannerHelper.isWhitespace(this.tm.charAt(sourcePosition))) {
                    if (tokenStart < sourcePosition) {
                        Token outputToken = new Token(tokenStart, sourcePosition - 1, TokenNameCOMMENT_LINE);
                        outputToken.spaceBefore();
                        result.add(outputToken);
                    }
                    tokenStart = sourcePosition + 1;
                }
                sourcePosition++;
            }
        }
        return result;
    }

    @Override
    public boolean visit(BlockComment node) {
        int commentIndex = this.tm.firstIndexIn(node, TokenNameCOMMENT_BLOCK);
        handleBlockComment(commentIndex);

        return true;
    }

    public void handleBlockComment(int commentIndex) {
        Token commentToken = this.tm.get(commentIndex);
        boolean isFirstColumn = handleWhitespaceAround(commentIndex);

        if (handleFormatOnOffTags(commentToken))
            return;

        boolean isHeader = this.tm.isInHeader(commentIndex);
        boolean formattingEnabled
            = (isHeader ? this.options.comment_format_header : this.options.comment_format_block_comment);
        if (this.tm.charAt(commentToken.originalStart + 2) == '-') {
            if (commentToken.getLineBreaksBefore() > 0
                || commentIndex == 0
                || this.tm.get(commentIndex - 1).getLineBreaksAfter() > 0) {
                formattingEnabled = false;
            } else {
                return;
            }
        }
        if (formattingEnabled && tokenizeMultilineComment(commentToken)) {
            this.commentStructure = commentToken.getInternalStructure();
            this.ctm = new TokenManager(this.commentStructure, this.tm);
            handleStringLiterals(this.tm.toString(commentToken), commentToken.originalStart);
            addSubstituteWraps();
        } else {
            commentToken.setInternalStructure(commentToLines(commentToken, -1));
        }

        if (this.options.never_indent_block_comments_on_first_column && isFirstColumn) {
            commentToken.setIndent(0);
            commentToken.setWrapPolicy(WrapPolicy.FORCE_FIRST_COLUMN);
        }
    }

    private boolean handleWhitespaceAround(int commentIndex) {
        Token commentToken = this.tm.get(commentIndex);
        char charBefore = commentToken.originalStart > 0 ? this.tm.charAt(commentToken.originalStart - 1) : 0;
        if (charBefore == ' ' || charBefore == '\t')
            commentToken.spaceBefore();

        if (commentToken.originalEnd < this.tm.getSourceLength() - 1) {
            char charAfter = this.tm.charAt(commentToken.originalEnd + 1);
            if (charAfter == ' ' || charAfter == '\t')
                commentToken.spaceAfter();
        }

        Token previous = null, next = null;
        int existingBreaksBefore = 2, existingBreaksAfter = 2;
        if (commentIndex > 0) {
            previous = this.tm.get(commentIndex - 1);
            existingBreaksBefore = this.tm.countLineBreaksBetween(previous, commentToken);
            if (existingBreaksBefore > 0) {
                commentToken.breakBefore();
                commentToken.clearSpaceBefore();
            }
        }
        if (commentIndex < this.tm.size() - 1) {
            next = this.tm.get(commentIndex + 1);
            existingBreaksAfter = this.tm.countLineBreaksBetween(commentToken, next);
            if (existingBreaksAfter > 0)
                commentToken.breakAfter();
        }

        if (existingBreaksBefore <= 1
            && (previous.tokenType == TokenNameCOMMENT_LINE || previous.tokenType == TokenNameCOMMENT_BLOCK)) {
            if (previous.getWrapPolicy() != WrapPolicy.FORCE_FIRST_COLUMN)
                commentToken.setWrapPolicy(previous.getWrapPolicy());
        } else {
            int i = commentIndex + 2;
            while (existingBreaksAfter <= 1
                && i < this.tm.size()
                && (next.tokenType == TokenNameCOMMENT_LINE || next.tokenType == TokenNameCOMMENT_BLOCK)) {
                Token next2 = this.tm.get(i++);
                existingBreaksAfter = this.tm.countLineBreaksBetween(next, next2);
                next = next2;
            }

            if (existingBreaksBefore < existingBreaksAfter && previous != null) {
                if (previous.isPreserveLineBreaksAfter()
                    || previous.getLineBreaksAfter() >= 2
                    || existingBreaksAfter < 2) {
                    commentToken.putLineBreaksAfter(previous.getLineBreaksAfter());
                    commentToken.setPreserveLineBreaksAfter(previous.isPreserveLineBreaksAfter());
                    previous.clearLineBreaksAfter();
                    previous.setPreserveLineBreaksAfter(true);
                }
            } else if (existingBreaksAfter < 2
                && next != null
                && next.tokenType != TokenNamepackage /* doesn't apply to a comment before the package declaration */) {
                if (next.isPreserveLineBreaksBefore() || next.getLineBreaksBefore() >= 2 || existingBreaksBefore < 2) {
                    commentToken.putLineBreaksBefore(next.getLineBreaksBefore());
                    commentToken.setPreserveLineBreaksBefore(next.isPreserveLineBreaksBefore());
                    next.clearLineBreaksBefore();
                    next.setPreserveLineBreaksBefore(true);
                }
            }
        }

        return (charBefore == '\r' || charBefore == '\n' || commentToken.originalStart == 0);
    }

    private List<Token> commentToLines(Token commentToken, int commentStartPositionInLine) {
        List<Token> lines = new ArrayList<>();

        int tab = this.options.tab_size;
        String commentText = this.tm.toString(commentToken);
        int commentStartPosition = commentStartPositionInLine;
        if (commentStartPosition < 0)
            commentStartPosition = this.tm.findSourcePositionInLine(commentToken.originalStart);
        int positionInLine = commentStartPosition;
        int lineStart = 0;
        int breaksBeforeFirstLine = 0;
        boolean firstLine = true; // all lines except first will be NotAToken to disable asterisk adding
        boolean emptyLine = true;

        for (int i = 0; i < commentText.length(); i++) {
            char c = commentText.charAt(i);
            switch (c) {
                case ' ':
                    if ((lineStart == i && positionInLine < commentStartPosition)
                        || (emptyLine && positionInLine == commentToken.getIndent() - 1))
                        lineStart = i + 1;
                    positionInLine++;
                    break;

                case '\t':
                    if ((lineStart == i && positionInLine < commentStartPosition)
                        || (emptyLine && positionInLine == commentToken.getIndent() - 1))
                        lineStart = i + 1;
                    if (tab > 0)
                        positionInLine += tab - positionInLine % tab;
                    break;

                case '\r':
                case '\n':
                    if (lineStart < i) {
                        Token line
                            = new Token(commentToken.originalStart + lineStart, commentToken.originalStart + i - 1,
                                firstLine ? commentToken.tokenType : TokenNameNotAToken);
                        line.breakAfter();
                        if (lines.isEmpty())
                            line.putLineBreaksBefore(breaksBeforeFirstLine);
                        lines.add(line);
                    } else if (!lines.isEmpty()) {
                        Token previousLine = lines.get(lines.size() - 1);
                        previousLine.putLineBreaksAfter(previousLine.getLineBreaksAfter() + 1);
                    } else {
                        breaksBeforeFirstLine++;
                    }
                    if (i + 1 < commentText.length() && commentText.charAt(i + 1) == (c == '\r' ? '\n' : '\r'))
                        i++;
                    lineStart = i + 1;
                    positionInLine = 0;
                    firstLine = false;
                    emptyLine = true;
                    break;

                default:
                    positionInLine++;
                    emptyLine = false;
            }
        }
        if (lineStart < commentText.length()) {
            Token line = new Token(commentToken.originalStart + lineStart, commentToken.originalEnd,
                firstLine ? commentToken.tokenType : TokenNameNotAToken);
            line.setWrapPolicy(WrapPolicy.DISABLE_WRAP);
            lines.add(line);
        }
        return lines;
    }

    @Override
    public boolean visit(Javadoc node) {
        this.noFormatOpenTagStartIndex = -1;
        this.formatCodeOpenTagEndIndex = -1;
        this.lastFormatCodeClosingTagIndex = -1;
        this.commonAttributeAnnotations.clear();
        this.ctm = null;

        int commentIndex
            = this.tm.firstIndexIn(node, node.isMarkdown() ? TokenNameCOMMENT_MARKDOWN : TokenNameCOMMENT_JAVADOC);
        Token commentToken = this.tm.get(commentIndex);

        if (node.getParent() == null) {
            // not a proper javadoc, treat as block comment
            handleWhitespaceAround(commentIndex);
        }
        if (commentIndex < this.tm.size() - 1)
            commentToken.breakAfter();

        if (handleFormatOnOffTags(commentToken))
            return false;

        boolean isHeader = this.tm.isInHeader(commentIndex);
        boolean formattingEnabled = isHeader
            ? this.options.comment_format_header
            : node.isMarkdown()
                ? this.options.comment_format_markdown_comment
                : this.options.comment_format_javadoc_comment;
        if (!formattingEnabled || !tokenizeMultilineComment(commentToken)) {
            commentToken.setInternalStructure(commentToLines(commentToken, -1));
            return false;
        }
        this.commentStructure = commentToken.getInternalStructure();
        this.commentIndent = this.tm.toIndent(commentToken.getIndent(), true);
        this.ctm = new TokenManager(commentToken.getInternalStructure(), this.tm);

        handleJavadocTagAlignment(node);
        handleJavadocBlankLines(node);

        return true;
    }

    @Override
    public void endVisit(Javadoc node) {
        if (this.ctm == null)
            return;
        addSubstituteWraps();
    }

    @Override
    public boolean visit(TagElement node) {
        String tagName = node.getTagName();
        if (tagName == null || tagName.length() <= 1 || !node.tagProperties().isEmpty() /* snippet markup tags */)
            return true;

        int startIndex = tokenStartingAt(node.getStartPosition());
        if (this.ctm.size() > startIndex + 1) {
            this.ctm.get(startIndex + 1).setWrapPolicy(WrapPolicy.DISABLE_WRAP);
        }
        if (node.getParent() instanceof Javadoc) {
            assert this.ctm.toString(startIndex).startsWith(tagName);

            if (startIndex > 1) {
                this.ctm.get(startIndex).breakBefore();
            }
            handleMarkdown(node);
            handleHtml(node);
            this.ctm.get(tokenStartingAt(node.getStartPosition())).setToEscape(false);
        } else if (node.isNested() && (IMMUTABLE_TAGS.contains(tagName) || "@snippet".equals(tagName))) {
            int endPos = node.getStartPosition() + node.getLength() - 1;
            int endIndex = this.ctm.findIndex(endPos,
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
                false);
            if (this.ctm.get(endIndex).originalEnd > endPos)
                endIndex = tokenEndingAt(endPos);
            if ("@snippet".equals(tagName)) {
                handleSnippet(node, startIndex, endIndex);
            } else {
                disableFormatting(startIndex, endIndex, false);
            }
        }
        return true;
    }

    @Override
    public void endVisit(TagElement node) {
        String tagName = node.getTagName();
        if (tagName == null || tagName.length() <= 1) {
            handleMarkdown(node);
            handleHtml(node);
        } else if ("@see".equals(tagName)) {
            handleStringLiterals(this.tm.toString(node), node.getStartPosition());
        }
    }

    private void handleJavadocTagAlignment(Javadoc node) {
        // Lists of tag tokens: index 0 for tag name, index 1 for param name (or throws etc) (may be null),
        // the rest for description
        List<List<Token>> javadocRootTags = new ArrayList<>();
        List<TagElement> tagElements = node.tags();
        for (TagElement tagElement : tagElements) {
            String tagName = tagElement.getTagName();
            if (tagName == null || tagName.length() <= 1)
                continue;
            int startIndex = tokenStartingAt(tagElement.getStartPosition());
            int nodeEnd = tagElement.getStartPosition() + tagElement.getLength() - 1;
            while (ScannerHelper.isWhitespace(this.ctm.charAt(nodeEnd)))
                nodeEnd--;
            int endIndex = tokenEndingAt(nodeEnd);

            List<Token> tagTokens = new ArrayList<>();
            tagTokens.add(this.ctm.get(startIndex));
            if (!PARAM_TAGS.contains(tagName) || startIndex == endIndex) {
                tagTokens.add(null);
            }
            for (int i = startIndex + 1; i <= endIndex; i++) {
                tagTokens.add(this.ctm.get(i));
            }
            javadocRootTags.add(tagTokens);
        }

        if (this.options.comment_align_tags_names_descriptions) {
            int maxTagNameLength = 0;
            int maxParamNameLength = 0;
            for (List<Token> tagTokens : javadocRootTags) {
                Token tagName = tagTokens.get(0);
                Token paramName = tagTokens.get(1);
                maxTagNameLength = Math.max(maxTagNameLength, this.tm.getLength(tagName, 0));
                if (paramName != null)
                    maxParamNameLength = Math.max(maxParamNameLength, this.tm.getLength(paramName, 0));
            }
            int paramNameAlign = maxTagNameLength + 1;
            int descriptionAlign = paramNameAlign;
            if (maxParamNameLength > 0)
                descriptionAlign += maxParamNameLength + 1;
            for (List<Token> tagTokens : javadocRootTags) {
                alignJavadocTag(tagTokens, paramNameAlign, descriptionAlign);
            }
        } else if (this.options.comment_align_tags_descriptions_grouped) {
            int groupStart = 0;
            String groupTagName = null;
            int descriptionAlign = 0;
            for (int i = 0; i < javadocRootTags.size(); i++) {
                List<Token> tagTokens = javadocRootTags.get(i);
                String tagName = this.ctm.toString(tagTokens.get(0));
                if (!tagName.equals(groupTagName)) {
                    for (int j = groupStart; j < i; j++) {
                        alignJavadocTag(javadocRootTags.get(j), 0, descriptionAlign);
                    }
                    groupStart = i;
                    groupTagName = tagName;
                    descriptionAlign = 0;
                }
                int indent = tagName.length() + 1;
                if (tagTokens.get(1) != null)
                    indent += 1 + this.ctm.getLength(tagTokens.get(1), 0);
                descriptionAlign = Math.max(descriptionAlign, indent);
            }
            for (int j = groupStart; j < javadocRootTags.size(); j++) {
                alignJavadocTag(javadocRootTags.get(j), 0, descriptionAlign);
            }
        } else {
            for (List<Token> tagTokens : javadocRootTags) {
                int tagNameLength = this.ctm.getLength(tagTokens.get(0), 0);
                int align = this.options.comment_indent_root_tags ? tagNameLength + 1 : 0;
                alignJavadocTag(tagTokens, 0, align);
            }
        }
    }

    private void handleJavadocBlankLines(Javadoc node) {
        List<TagElement> tagElements = node.tags();
        List<Integer> tagIndexes = tagElements.stream()
            .filter(t -> !t.isNested() && t.getTagName() != null && t.getTagName().length() > 1)
            .map(t -> tokenStartingAt(t.getStartPosition()))
            .collect(Collectors.toList());
        tagIndexes.addAll(this.commonAttributeAnnotations);
        Collections.sort(tagIndexes);

        String previousName = null;
        if (!tagIndexes.isEmpty()) {
            int firstIndex = tagIndexes.get(0);
            previousName = this.ctm.toString(firstIndex);
            if (this.options.comment_insert_empty_line_before_root_tags && firstIndex > 1)
                this.ctm.get(firstIndex).putLineBreaksBefore(2);
        }
        if (this.options.comment_insert_empty_line_between_different_tags) {
            for (int i = 1; i < tagIndexes.size(); i++) {
                Token tagToken = this.ctm.get(tagIndexes.get(i));
                String thisName = this.tm.toString(tagToken);
                boolean sameType = previousName.equals(thisName)
                    || (isCommonsAttributeAnnotation(previousName) && isCommonsAttributeAnnotation(thisName));
                if (!sameType)
                    tagToken.putLineBreaksBefore(2);
                previousName = thisName;
            }
        }
    }

    private void alignJavadocTag(List<Token> tagTokens, int paramNameAlign, int descriptionAlign) {
        Token paramName = tagTokens.get(1);
        if (paramName != null) {
            paramName.setAlign(paramNameAlign);
            if (this.options.comment_insert_new_line_for_parameter && tagTokens.size() > 2) {
                tagTokens.get(2).breakBefore();
            }
        }

        boolean extraIndent = (paramName != null
            ? this.options.comment_indent_parameter_description
            : this.options.comment_indent_tag_description);
        for (int i = 2; i < tagTokens.size(); i++) {
            Token token = tagTokens.get(i);
            token.setAlign(descriptionAlign);
            token.setIndent(extraIndent ? this.options.indentation_size : 0);
        }
    }

    private void handleMarkdown(TagElement node) {
        if (!(node.getParent()instanceof Javadoc javaDoc)
            || !javaDoc.isMarkdown()
            || !this.options.comment_format_markdown_comment) {
            return;
        }

        String text = this.tm.toString(node);

        Matcher matcher = MARKDOWN_HEADINGS_PATTERN_1.matcher(text); // Check for MarkDown headings #h1 - #h6
        while (matcher.find()) {
            int startPos = matcher.start() + node.getStartPosition();
            int tokenIndex = tokenStartingAt(startPos);
            Token headingToken = this.ctm.get(tokenIndex);
            if (tokenIndex != 1) {
                headingToken.putLineBreaksBefore(2);
            }
            int endPos = matcher.end() + node.getStartPosition();
            int endIndex = tokenEndingAt(endPos - 1);
            Token endingToken = this.ctm.get(endIndex);
            endingToken.breakAfter();
            headingToken.spaceBefore();
        }

        matcher = MARKDOWN_HEADINGS_PATTERN_2.matcher(text); // Check for MarkDown headings with styles '-- & ==='
        while (matcher.find()) {
            int startPos = matcher.start() + node.getStartPosition();
            int tokenIndex = tokenStartingAt(startPos);
            Token headingToken = this.ctm.get(tokenIndex);
            if (tokenIndex != 1) {
                headingToken.breakBefore();
            }
            headingToken.breakAfter();
        }

        int leadingSpaces = Integer.MAX_VALUE;
        Matcher m = MARKDOWN_LEADING_SPACES_PATTERN.matcher(this.tm.toString(node));
        while (m.find())
            leadingSpaces = Math.min(leadingSpaces, m.group(1).length());
        leadingSpaces = leadingSpaces == Integer.MAX_VALUE ? 0 : leadingSpaces;
        List<ASTNode> fragments = node.fragments();
        ArrayDeque<ASTNode> fragmentsDeque = new ArrayDeque<>(fragments);
        handleMarkdownList(fragmentsDeque, leadingSpaces, 0, null, 4000 - leadingSpaces);
        handleMarkdownTable(fragments);
    }

    private Character handleMarkdownList(ArrayDeque<ASTNode> fragments, int srcIndent, int indentToSet,
        Character itemType, int tabStartShift) {
        Character prevRecursionItemType = null;
        while (!fragments.isEmpty()) {
            if (handleMarkdownIndentedCodeBlock(fragments, srcIndent, false, tabStartShift)) {
                continue;
            }
            ASTNode fragment = fragments.peekFirst();
            int firstTokenIndex = this.ctm.findIndex(fragment.getStartPosition(),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
                true);
            Token firstToken = this.ctm.get(firstTokenIndex);

            String firstString = this.ctm.toString(firstToken);
            Character thisItemType = null;
            boolean isBullet = false;
            if (fragment instanceof TextElement
                && (firstTokenIndex < 2
                    || this.ctm.countLineBreaksBetween(this.ctm.get(firstTokenIndex - 1), firstToken) > 0)) {
                isBullet = firstString.matches("[-+*]"); //$NON-NLS-1$
                if (isBullet) {
                    thisItemType = firstString.charAt(0);
                } else if (firstString.matches("\\d+[.)]")) { //$NON-NLS-1$
                    thisItemType = firstString.charAt(firstString.length() - 1);
                }
            }

            int slashPos = this.ctm.getSource().lastIndexOf('/', firstToken.originalStart);
            int fragmentIndent = this.ctm.getLength(slashPos + 1, firstToken.originalStart - 1, tabStartShift, 4);
            int indentDiff = fragmentIndent - srcIndent;
            if (thisItemType != null) {
                Token secondToken = this.ctm.get(firstTokenIndex + 1);
                int textIndent = this.ctm.getLength(slashPos + 1, secondToken.originalStart - 1, tabStartShift, 4);
                indentDiff = textIndent - srcIndent;
                boolean isFirst = isBullet || (firstString.length() == 2 && firstString.charAt(0) == '1');
                boolean isNextLevel = (indentDiff > 1 && fragmentIndent >= srcIndent) || itemType == null;
                if (fragmentIndent - srcIndent >= 4) {
                    thisItemType = null;
                    indentDiff = fragmentIndent - srcIndent;
                } else if (isNextLevel) {
                    if (isFirst || thisItemType.equals(prevRecursionItemType)) {
                        prevRecursionItemType = handleMarkdownList(fragments, textIndent,
                            indentToSet + this.ctm.getLength(firstToken, 0) + 1, thisItemType, tabStartShift);
                        continue;
                    } else {
                        thisItemType = null;
                        indentDiff = fragmentIndent - srcIndent;
                    }
                } else {
                    if (thisItemType.equals(itemType)) {
                        srcIndent = textIndent;
                    } else if (isFirst) {
                        firstToken.putLineBreaksBefore(2);
                    }
                }
            }

            if (indentDiff < 0 && itemType != null && (thisItemType != null || firstToken.getLineBreaksBefore() > 1)) {
                return thisItemType;
            }

            if (itemType == null) {
                fragments.removeFirst();
                continue;
            }
            int lastTokenIndex = this.ctm.findIndex(fragment.getStartPosition() + fragment.getLength() - 1,
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
                false);
            for (int i = firstTokenIndex; i <= lastTokenIndex; i++)
                this.ctm.get(i).setAlign(indentToSet);
            if (thisItemType != null) {
                if (firstTokenIndex > 1)
                    firstToken.breakBefore();
                firstToken.setAlign(indentToSet - (isBullet ? 2 : 3));
                if (handleMarkdownIndentedCodeBlock(fragments, srcIndent, true, tabStartShift)) {
                    continue;
                }
            }
            fragments.removeFirst();
        }
        return null;
    }

    private boolean handleMarkdownIndentedCodeBlock(ArrayDeque<ASTNode> fragments, int srcIndent, boolean isListItem,
        int tabStartShift) {
        int codeBlockStartIndex = -1;
        int codeBlockEndIndex = -1;
        String openingFence = null;
        boolean canAssumeJava = false;
        while (!fragments.isEmpty()) {
            ASTNode fragment = fragments.peekFirst();
            int firstTokenIndex = this.ctm.findIndex(fragment.getStartPosition(),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
                true);
            int lastTokenIndex = this.ctm.findIndex(fragment.getStartPosition() + fragment.getLength() - 1,
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
                false);
            Token firstToken = this.ctm.get(firstTokenIndex);
            int slashPos = this.ctm.getSource().lastIndexOf('/', firstToken.originalStart);
            int fragmentIndent = this.ctm.getLength(slashPos + 1, firstToken.originalStart - 1, tabStartShift, 4);
            int indentDiff = fragmentIndent - srcIndent;
            Matcher fenceMatcher = MARKDOWN_FENCE_PATTERN.matcher(this.ctm.toString(fragment).trim());

            if (codeBlockStartIndex == -1) {
                if (isListItem) {
                    srcIndent = this.ctm.getLength(slashPos + 1, firstToken.originalEnd, tabStartShift);
                    firstTokenIndex++;
                    firstToken = this.ctm.get(firstTokenIndex);
                    fragmentIndent = this.ctm.getLength(slashPos + 1, firstToken.originalStart - 1, tabStartShift, 4);
                    indentDiff = fragmentIndent - srcIndent - 1; // somehow indent threshold is 1 higher in lists
                    fenceMatcher = MARKDOWN_FENCE_PATTERN.matcher(this.ctm.getSource()
                        .substring(firstToken.originalStart, fragment.getStartPosition() + fragment.getLength()));
                }

                if (indentDiff >= 4 && (firstToken.getLineBreaksBefore() > 1 || isListItem)) {
                    codeBlockStartIndex = firstTokenIndex;
                    firstToken.setAlign(fragmentIndent - 1);
                } else {
                    boolean isLineStart = isListItem
                        || firstTokenIndex <= 1
                        || this.ctm.countLineBreaksBetween(this.ctm.get(firstTokenIndex - 1), firstToken) > 0;
                    if (isLineStart && fenceMatcher.matches()) {
                        codeBlockStartIndex = lastTokenIndex;
                        openingFence = fenceMatcher.group(1);
                        String infoString = fenceMatcher.group(2).trim().toLowerCase();
                        canAssumeJava = infoString.isEmpty() || infoString.equals("java"); //$NON-NLS-1$
                        if (firstTokenIndex > 1 && !isListItem)
                            firstToken.breakBefore();
                        if (codeBlockStartIndex < this.ctm.size() - 1)
                            this.ctm.get(codeBlockStartIndex).breakAfter();
                    } else {
                        return false;
                    }
                }
            } else if (indentDiff <= 4) {
                if (openingFence != null) {
                    if (fenceMatcher.matches()
                        && openingFence.equals(fenceMatcher.group(1))
                        && fenceMatcher.group(2).trim().isEmpty()) {
                        codeBlockEndIndex = firstTokenIndex - 1;
                        firstToken.breakBefore();
                        if (firstTokenIndex < this.tm.size())
                            firstToken.breakAfter();
                        firstToken.setAlign(fragmentIndent - 1);
                        fragments.removeFirst();
                        break;
                    } else if (indentDiff < 0) {
                        codeBlockEndIndex = firstTokenIndex - 1;
                        break;
                    }
                } else {
                    firstToken.putLineBreaksBefore(2);
                    break;
                }
            }
            codeBlockEndIndex = lastTokenIndex;
            fragments.removeFirst();
        }

        if (canAssumeJava
            && codeBlockStartIndex < codeBlockEndIndex
            && formatCode(codeBlockStartIndex, codeBlockEndIndex + 1, false, true)) {
            // code formatting successful
        } else if (openingFence != null && codeBlockStartIndex < codeBlockEndIndex) {
            disableFormattingExclusively(codeBlockStartIndex, codeBlockEndIndex + 1, false);
        } else if (codeBlockStartIndex != -1) {
            disableFormatting(codeBlockStartIndex, codeBlockEndIndex, true);
        }
        return codeBlockStartIndex != -1;
    }

    private void handleMarkdownTable(List<ASTNode> fragments) {
        int tableStartIndex = -1;
        int tableLastIndex = -1;
        boolean columnUnderlineFound = false;
        Matcher matcher;
        for (Object fragment : fragments) {
            if (fragment instanceof TextElement textElement) {
                String textContent = textElement.getText();
                matcher = MARKDOWN_TABLE_START.matcher(textContent);
                if (matcher.find()) {
                    if (tableStartIndex == -1) {
                        int startPos = matcher.start() + textElement.getStartPosition();
                        tableStartIndex = tokenStartingAt(startPos);
                    } else if (!columnUnderlineFound) {
                        boolean foundStart = textContent.contains("|-"); //$NON-NLS-1$
                        boolean foundEnd = textContent.contains("-|"); //$NON-NLS-1$
                        if (foundStart && foundEnd) {
                            columnUnderlineFound = true;
                        }
                    } else {
                        matcher = MARKDOWN_TABLE_END.matcher(textContent);
                        matcher.find(); // find the last one
                        int startPos = matcher.start() + textElement.getStartPosition();
                        tableLastIndex = tokenStartingAt(startPos);
                    }
                } else {
                    tableStartIndex = -1;
                    tableLastIndex = -1;
                    columnUnderlineFound = false;
                }
            }
            if (tableStartIndex != -1 && tableLastIndex != -1) {
                // TODO fix column alignment and format cells
                disableFormattingExclusively(tableStartIndex, tableLastIndex, false);
            }
        }
    }

    private void handleHtml(TagElement node) {
        if (!this.options.comment_format_html && !this.options.comment_format_source)
            return;
        String text = this.tm.toString(node);
        Matcher matcher = HTML_TAG_PATTERN.matcher(text);
        while (matcher.find()) {
            int startPos = matcher.start() + node.getStartPosition();
            int endPos = matcher.end() - 1 + node.getStartPosition();
            boolean isOpeningTag = (matcher.start(1) == matcher.end(1));

            if (this.options.comment_format_html) {
                // make sure tokens inside the tag are wrapped only as a substitute
                int firstTokenIndex = tokenStartingAt(startPos), lastTokenIndex = tokenEndingAt(endPos);
                for (int i = firstTokenIndex + 1; i <= lastTokenIndex; i++) {
                    Token token = this.ctm.get(i);
                    if (token.getWrapPolicy() == null)
                        token.setWrapPolicy(WrapPolicy.SUBSTITUTE_ONLY);
                }

                // allow wraps around equals sign in attributes
                String attributesText = matcher.group(9);
                Matcher attrMatcher = HTML_ATTRIBUTE_PATTERN.matcher(attributesText);
                final int commentStart = this.ctm.get(0).originalStart;
                while (attrMatcher.find()) {
                    int equalPos = node.getStartPosition() + matcher.start(9) + attrMatcher.start(1);
                    assert this.tm.charAt(equalPos) == '=';
                    this.allowSubstituteWrapping[equalPos - commentStart] = true;
                }
            }

            int matchedGroups = 0;
            for (int i = 2; i <= 7; i++)
                if (matcher.start(i) < matcher.end(i))
                    matchedGroups++;
            if (matchedGroups != 1)
                continue;

            if (matcher.start(2) < matcher.end(2)) {
                handleFormatCodeTag(node, startPos, endPos, isOpeningTag);
            }
            if (this.options.comment_format_html) {
                if ("@param".equals(node.getTagName())
                    && this.ctm.findIndex(startPos,
                        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
                        false)
                        == 1 + this.ctm.firstIndexIn(node,
                            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid)) {
                    continue; // it's a generic class parameter name, not an HTML tag
                }

                if (matcher.start(3) < matcher.end(3)) {
                    handleSeparateLineTag(startPos, endPos);
                } else if (matcher.start(4) < matcher.end(4)) {
                    handleBreakBeforeTag(startPos, endPos, isOpeningTag);
                    if (this.options.comment_javadoc_do_not_separate_block_tags) {
                        if (!isOpeningTag) {
                            handleBreakAfterTag(endPos);
                        }
                    }
                } else if (matcher.start(5) < matcher.end(5)) {
                    handleBreakAfterTag(endPos);
                } else if (matcher.start(6) < matcher.end(6)) {
                    handleNoFormatTag(startPos, endPos, isOpeningTag);
                } else if (matcher.start(7) < matcher.end(7)) {
                    if (this.options.comment_javadoc_do_not_separate_block_tags) {
                        handleBreakBeforeTag(startPos, endPos, isOpeningTag);
                        if (!isOpeningTag) {
                            handleBreakAfterTag(endPos);
                        }
                    } else {
                        handleSeparateLineTag(startPos, endPos);
                    }
                }
            }
        }
    }

    @Override
    public boolean visit(MethodRef node) {
        handleReference(node);
        return true;
    }

    @Override
    public boolean visit(MemberRef node) {
        handleReference(node);
        return true;
    }

    @Override
    public boolean visit(QualifiedName node) {
        handleReference(node);
        return false;
    }

    private void handleReference(ASTNode node) {
        ASTNode parent = node.getParent();
        if ((parent instanceof TagElement) && ((TagElement) parent).isNested()) {
            int firstIndex = tokenStartingAt(node.getStartPosition());
            int lastIndex = tokenEndingAt(node.getStartPosition() + node.getLength() - 1);
            if (this.ctm.charAt(this.ctm.get(lastIndex + 1).originalStart) == '}')
                lastIndex++;
            for (int i = firstIndex; i <= lastIndex; i++) {
                Token token = this.ctm.get(i);
                token.setWrapPolicy(WrapPolicy.DISABLE_WRAP);
            }
        }
    }

    private void handleStringLiterals(String text, int textStartPosition) {
        Matcher matcher = STRING_LITERAL_PATTERN.matcher(text);
        while (matcher.find()) {
            handleFoundStringLiteral(matcher, 0, textStartPosition);
        }
    }

    private void handleFoundStringLiteral(Matcher matcher, int group, int textStartPosition) {
        if (matcher.start(group) == matcher.end(group))
            return;
        int startPosition = textStartPosition + matcher.start(group);
        int startIndex = this.ctm.findIndex(startPosition,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
            false);
        int endPosition = textStartPosition + matcher.end(group) - 1;
        int endIndex = this.ctm.findIndex(endPosition,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
            false);
        if (startIndex != endIndex) {
            startIndex = tokenStartingAt(startPosition);
            endIndex = tokenEndingAt(endPosition);
            disableFormatting(startIndex, endIndex, false);
        }
        if (this.ctm.get(0).tokenType != TokenNameCOMMENT_LINE)
            noSubstituteWrapping(startPosition, endPosition);
    }

    private void handleFoundAssignment(Matcher matcher, int group, int textStartPosition) {
        if (matcher.start(group) == matcher.end(group))
            return;
        int equalsPosition = textStartPosition + matcher.start(group);
        int equalsIndex = tokenStartingAt(equalsPosition);
        equalsIndex = tokenEndingAt(equalsPosition);
        assert this.ctm.toString(equalsIndex).equals("="); //$NON-NLS-1$
        if (this.options.insert_space_before_assignment_operator) {
            this.ctm.get(equalsIndex).spaceBefore();
        } else {
            this.ctm.get(equalsIndex).clearSpaceBefore();
        }
        if (this.options.insert_space_after_assignment_operator) {
            this.ctm.get(equalsIndex + 1).spaceBefore();
        } else {
            this.ctm.get(equalsIndex + 1).clearSpaceBefore();
        }
    }

    private void handleSeparateLineTag(int startPos, int endPos) {
        int openingTagIndex = tokenStartingAt(startPos);
        if (openingTagIndex > 1 && this.lastFormatCodeClosingTagIndex == openingTagIndex - 1) {
            Token token = this.ctm.get(openingTagIndex - 1);
            assert token.getLineBreaksAfter() == 2;
            token.clearLineBreaksAfter();
            token.breakAfter();
        }

        handleBreakBeforeTag(startPos, endPos, true);
        handleBreakAfterTag(endPos);
    }

    private void handleBreakBeforeTag(int start, int end, boolean isOpeningTag) {
        int firstPartIndex = tokenStartingAt(start);
        int lastPartIndex = tokenEndingAt(end);
        Token firstPartToken = this.ctm.get(firstPartIndex);
        firstPartToken.setWrapPolicy(null);
        if (isOpeningTag) {
            firstPartToken.breakBefore();
            this.ctm.get(lastPartIndex + 1).clearSpaceBefore();
        } else {
            firstPartToken.clearSpaceBefore();
        }
    }

    private void handleBreakAfterTag(int end) {
        int tokenIndex = tokenEndingAt(end);
        this.ctm.get(tokenIndex).breakAfter();
    }

    private void handleNoFormatTag(int start, int end, boolean isOpeningTag) {
        if (isOpeningTag) {
            if (this.noFormatOpenTagStartIndex < 0)
                this.noFormatOpenTagStartIndex = tokenStartingAt(start);
        } else if (this.noFormatOpenTagStartIndex >= 0) {
            int closingTagIndex = tokenEndingAt(end);
            if (this.noFormatOpenTagStartIndex < closingTagIndex) {
                disableFormatting(this.noFormatOpenTagStartIndex, closingTagIndex, true);
            }
            this.noFormatOpenTagStartIndex = -1;
        }
    }

    private void handleFormatCodeTag(TagElement tagElement, int startPos, int endPos, boolean isOpeningTag) {
        if (!this.options.comment_format_source) {
            handleNoFormatTag(startPos, endPos, isOpeningTag);
            return;
        }

        // add empty lines before opening and after closing token
        handleSeparateLineTag(startPos, endPos);

        int startIndex = tokenStartingAt(startPos);
        int endTagIndex = tokenEndingAt(endPos);
        if (isOpeningTag) {
            if (startIndex > 1)
                this.ctm.get(startIndex).putLineBreaksBefore(2);

            if (this.formatCodeOpenTagEndIndex < 0)
                this.formatCodeOpenTagEndIndex = endTagIndex;
        } else if (this.formatCodeOpenTagEndIndex >= 0) {
            if (endTagIndex < this.ctm.size() - 2)
                this.ctm.get(endTagIndex).putLineBreaksAfter(2);

            List<ASTNode> tags = new ArrayList<ASTNode>(tagElement.fragments());
            tags.removeIf(f -> !(f instanceof TagElement) || !((TagElement) f).isNested());
            tags.removeIf(f -> f.getStartPosition() > endPos
                || f.getStartPosition() + f.getLength() < this.ctm.get(this.formatCodeOpenTagEndIndex).originalStart);
            if (!tags.isEmpty()) {
                disableFormatting(this.formatCodeOpenTagEndIndex, startIndex, true);

                String src = this.ctm.getSource();
                tags.removeIf(f -> !((TagElement) f).getTagName().equals("@code"));
                for (ASTNode tagNode : tags) {
                    TagElement tag = (TagElement) tagNode;
                    if (tag.getTagName().equals("@code")) {
                        int nameEndPos = src.indexOf("@code", tag.getStartPosition()) + "@code".length() - 1;
                        // int closingBracePos = src.lastIndexOf('}', tag.getStartPosition() + tag.getLength());
                        // TODO bug 570137 workaround
                        int closingBracePos = tag.getStartPosition() + 1;
                        int lastPos = this.ctm.get(this.ctm.size() - 2).originalEnd;
                        for (int braces = 1; braces > 0 && closingBracePos < lastPos; closingBracePos++) {
                            if (src.charAt(closingBracePos) == '{')
                                braces++;
                            if (src.charAt(closingBracePos) == '}')
                                braces--;
                        }
                        closingBracePos--;

                        if (formatCode(tokenEndingAt(nameEndPos), tokenStartingAt(closingBracePos), false, false)) {
                            int closingIndex = tokenStartingAt(closingBracePos);
                            Token t = this.ctm.get(closingIndex);
                            this.commentStructure.set(closingIndex,
                                new Token(t, t.originalStart, t.originalEnd, TokenNameCOMMENT_JAVADOC));
                            boolean allowAnnotationAtLineStart = CompilerOptions.versionToJdkLevel(this.sourceLevel)
                                > CompilerOptions.versionToJdkLevel("14");
                            for (int i = tokenEndingAt(nameEndPos) + 1; i < closingIndex; i++) {
                                t = this.ctm.get(i);
                                if (this.ctm.charAt(t.originalStart) == '@') {
                                    if (allowAnnotationAtLineStart) {
                                        t.setToEscape(false);
                                    } else {
                                        t.clearLineBreaksBefore();
                                        t.spaceBefore();
                                        this.ctm.get(i - 1).clearLineBreaksAfter();
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (this.formatCodeOpenTagEndIndex >= startIndex - 1
                || !formatCode(this.formatCodeOpenTagEndIndex, startIndex, false, false)) {
                disableFormattingExclusively(this.formatCodeOpenTagEndIndex, startIndex, false);
            }
            this.formatCodeOpenTagEndIndex = -1;
            this.lastFormatCodeClosingTagIndex = this.ctm.findIndex(startPos,
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
                true);
        }
    }

    private void handleSnippet(TagElement node, int startIndex, int endIndex) {
        Token startToken = this.ctm.get(startIndex), endToken = this.ctm.get(endIndex);
        startToken.breakBefore();
        endToken.breakAfter();

        String lang = null;
        boolean isInline = false;
        int snippetTextStartPos = startToken.originalEnd + 1;
        String snippetText = this.ctm.getSource().substring(snippetTextStartPos, endToken.originalEnd + 1);
        Matcher m = SNIPPET_ATTRIBUTES_PATTERN.matcher(snippetText);
        if (m.find() && m.start() == 0) {
            isInline = !m.group("colon").isEmpty(); //$NON-NLS-1$
            Matcher m2 = SNIPPET_ATTRIBUTE_PATTERN.matcher(snippetText);
            while (m2.find()) {
                handleFoundAssignment(m2, 2, snippetTextStartPos);
                handleFoundStringLiteral(m2, 3, snippetTextStartPos);
                if (m2.group(1).equals("lang")) //$NON-NLS-1$
                    lang = m2.group(3);
            }
        }

        List<ASTNode> fragments = node.fragments();
        if (isInline && !fragments.isEmpty()) {
            int openingIndex = this.ctm.firstIndexBefore(fragments.get(0),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid);
            int closingIndex = tokenStartingAt(endToken.originalEnd);
            this.ctm.get(closingIndex).breakBefore();
            boolean formatted = (lang == null || lang.matches("['\"]?java['\"]?")) //$NON-NLS-1$
                && formatCode(openingIndex, closingIndex, true, false);
            if (!formatted)
                disableFormattingExclusively(openingIndex, closingIndex, true);
        }
    }

    private void fixJavadocTagAlign(Token baseToken, int fixFirstIndex) {
        for (int i = fixFirstIndex; i < this.ctm.size() - 1; i++) {
            Token token = this.ctm.get(i);
            if (token.getAlign() == 0 && token.getIndent() == 0)
                break;
            token.setAlign(baseToken.getAlign());
            token.setIndent(baseToken.getIndent());
        }
    }

    private void disableFormatting(int startIndex, int endIndex, boolean isHtml) {
        Token startToken = this.ctm.get(startIndex), endToken = this.ctm.get(endIndex);

        Token noFormatToken = new Token(startToken.originalStart, endToken.originalEnd, TokenNameCOMMENT_JAVADOC);
        List<Token> lines = commentToLines(noFormatToken, findCommentLineIndent(startIndex));
        for (Token line : lines)
            line.setToEscape(isHtml);
        Token first = lines.get(0);
        if (startToken.isSpaceBefore())
            first.spaceBefore();
        first.setAlign(startToken.getAlign());
        first.setIndent(startToken.getIndent());
        first.putLineBreaksBefore(startToken.getLineBreaksBefore());
        first.setWrapPolicy(startToken.getWrapPolicy());
        Token last = lines.get(lines.size() - 1);
        last.putLineBreaksAfter(endToken.getLineBreaksAfter());

        fixJavadocTagAlign(startToken, endIndex + 1);

        List<Token> tokensToReplace = this.commentStructure.subList(startIndex, endIndex + 1);
        tokensToReplace.clear();
        tokensToReplace.addAll(lines);
    }

    private void disableFormattingExclusively(int openingTagIndex, int closingTagIndex, boolean isSnippet) {
        Token openingTag = this.ctm.get(openingTagIndex);
        int noFormatStart = openingTag.originalEnd + 1;
        int noFormatEnd = this.ctm.get(closingTagIndex - 1).originalEnd;
        if (noFormatStart <= noFormatEnd) {
            Token noFormatToken = new Token(noFormatStart, noFormatEnd, TokenNameCOMMENT_JAVADOC);
            List<Token> lines = commentToLines(noFormatToken, findCommentLineIndent(openingTagIndex));
            for (Token line : lines) {
                if (!isSnippet) {
                    line.setToEscape(true);
                }
            }
            fixJavadocTagAlign(openingTag, closingTagIndex);
            List<Token> tokensToReplace = this.commentStructure.subList(openingTagIndex + 1, closingTagIndex);
            tokensToReplace.clear();
            tokensToReplace.addAll(lines);
        } else {
            this.commentStructure.subList(openingTagIndex + 1, closingTagIndex).clear();
            Token closingTag = this.ctm.get(closingTagIndex);
            if (this.ctm.countLineBreaksBetween(openingTag, closingTag) == 0) {
                openingTag.clearLineBreaksAfter();
                closingTag.clearLineBreaksBefore();
            }
        }
    }

    private int findCommentLineIndent(int commentFragmentIndex) {
        int position = this.ctm.get(commentFragmentIndex).originalStart;
        int lastNonWhitespace = position;
        while (--position > 0) {
            char c = this.ctm.charAt(position);
            if (c == '\r' || c == '\n')
                break;
            if (!ScannerHelper.isWhitespace(c))
                lastNonWhitespace = position;
        }
        if (this.ctm.get(commentFragmentIndex).tokenType != TokenNameCOMMENT_MARKDOWN
            && lastNonWhitespace > 0
            && this.ctm.charAt(lastNonWhitespace - 1) == ' ')
            lastNonWhitespace--;
        return this.ctm.getLength(position, lastNonWhitespace - 1, 0);
    }

    private int tokenStartingAt(int start) {
        int tokenIndex = this.ctm.findIndex(start,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
            false);
        Token token = this.ctm.get(tokenIndex);
        if (token.originalStart == start)
            return tokenIndex;

        assert start > token.originalStart && start <= token.originalEnd;
        splitToken(token, tokenIndex, start);
        return tokenIndex + 1;
    }

    private int tokenEndingAt(int end) {
        int tokenIndex = this.ctm.findIndex(end,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid,
            true);
        Token token = this.ctm.get(tokenIndex);
        if (token.originalEnd == end)
            return tokenIndex;

        assert end < token.originalEnd && end >= token.originalStart;
        splitToken(token, tokenIndex, end + 1);
        return tokenIndex;
    }

    private void splitToken(Token token, int tokenIndex, int splitPosition) {
        assert splitPosition > token.originalStart && splitPosition <= token.originalEnd;

        Token part1 = new Token(token.originalStart, splitPosition - 1, token.tokenType);
        Token part2 = new Token(splitPosition, token.originalEnd, token.tokenType);
        if (token.isSpaceBefore())
            part1.spaceBefore();
        part1.putLineBreaksBefore(token.getLineBreaksBefore());
        part2.putLineBreaksAfter(token.getLineBreaksAfter());
        part1.setIndent(token.getIndent());
        part2.setIndent(token.getIndent());
        part1.setAlign(token.getAlign());
        part2.setAlign(token.getAlign());
        part1.setWrapPolicy(token.getWrapPolicy());
        this.commentStructure.set(tokenIndex, part1);
        this.commentStructure.add(tokenIndex + 1, part2);
    }

    private boolean tokenizeMultilineComment(Token commentToken) {
        if (this.allowSubstituteWrapping == null || this.allowSubstituteWrapping.length < commentToken.countChars()) {
            this.allowSubstituteWrapping = new boolean[commentToken.countChars()];
        }
        boolean isMarkdown = commentToken.tokenType == TokenNameCOMMENT_MARKDOWN;
        boolean isJavadoc = commentToken.tokenType == TokenNameCOMMENT_JAVADOC;
        Arrays.fill(this.allowSubstituteWrapping, 0, commentToken.countChars(), !isMarkdown && !isJavadoc);

        final boolean cleanBlankLines = isJavadoc
            ? this.options.comment_clear_blank_lines_in_javadoc_comment
            : this.options.comment_clear_blank_lines_in_block_comment;

        List<Token> structure = new ArrayList<>();

        int firstTokenEnd = commentToken.originalStart + 1;
        char markerChar = isMarkdown ? '/' : '*';
        while (firstTokenEnd < commentToken.originalEnd - 1 && this.tm.charAt(firstTokenEnd + 1) == markerChar)
            firstTokenEnd++;
        Token first = new Token(commentToken.originalStart, firstTokenEnd, commentToken.tokenType);
        first.spaceAfter();
        structure.add(first);

        int positionLimit = isMarkdown ? commentToken.originalEnd + 1 : commentToken.originalEnd - 1;
        while (positionLimit - 1 > firstTokenEnd && this.tm.charAt(positionLimit - 1) == markerChar)
            positionLimit--;

        int position = firstTokenEnd + 1;
        int lineBreaks = 0;
        while (position <= commentToken.originalEnd) {
            // find line start
            for (int i = position; i < positionLimit; i++) {
                char c = this.tm.charAt(i);
                if (c == '\r' || c == '\n') {
                    lineBreaks++;
                    char c2 = this.tm.charAt(i + 1);
                    if ((c2 == '\r' || c2 == '\n') && c2 != c)
                        i++;
                    position = i + 1;
                } else if (!ScannerHelper.isWhitespace(c)) {
                    int markerCharCount = 0;
                    while (this.tm.charAt(i) == markerChar && lineBreaks > 0 && (markerCharCount < 3 || !isMarkdown)) {
                        markerCharCount++;
                        i++;
                    }
                    position = i;
                    break;
                }
            }

            int tokenStart = position;
            while (position <= commentToken.originalEnd + 1 && (!isMarkdown || position <= positionLimit)) {
                char c = 0;
                if (position == commentToken.originalEnd + 1
                    || position == positionLimit
                    || ScannerHelper.isWhitespace(c = this.tm.charAt(position))) {
                    if (tokenStart < position) {
                        Token outputToken = new Token(tokenStart, position - 1, commentToken.tokenType);
                        outputToken.spaceBefore();
                        if (lineBreaks > 0) {
                            if (cleanBlankLines && !isMarkdown)
                                lineBreaks = 1;
                            if (lineBreaks > 1 || !this.options.join_lines_in_comments)
                                outputToken.putLineBreaksBefore(lineBreaks);
                        }
                        if (this.tm.charAt(tokenStart) == '@') {
                            outputToken.setWrapPolicy(WrapPolicy.DISABLE_WRAP);
                            if (lineBreaks == 1 && structure.size() > 1) {
                                if (commentToken.tokenType == TokenNameCOMMENT_BLOCK) {
                                    outputToken.putLineBreaksBefore(cleanBlankLines ? 1 : 2);
                                }
                                if (isMarkdown) {
                                    outputToken.breakBefore();
                                }
                            }
                            if (lineBreaks > 0 && isCommonsAttributeAnnotation(this.tm.toString(outputToken))) {
                                outputToken.breakBefore();
                                this.commonAttributeAnnotations.add(structure.size());
                            }
                        }
                        structure.add(outputToken);
                        lineBreaks = 0;
                    }
                    if (c == '\r' || c == '\n')
                        break;
                    tokenStart = position == positionLimit ? position : position + 1;
                }
                position++;
            }
            if (isMarkdown && position > positionLimit)
                break;
        }

        Token last = structure.get(structure.size() - 1);
        if (isMarkdown) {
            last.putLineBreaksAfter(lineBreaks);
        } else {
            boolean newLinesAtBoundries = commentToken.tokenType == TokenNameCOMMENT_JAVADOC
                ? this.options.comment_new_lines_at_javadoc_boundaries
                : this.options.comment_new_lines_at_block_boundaries;
            if (!newLinesAtBoundries) {
                structure.get(1).clearLineBreaksBefore();
                last.clearLineBreaksBefore();
            } else if (this.tm.countLineBreaksBetween(first, last) > 0) {
                first.breakAfter();
                last.breakBefore();
            }
            last.setAlign(1);
        }
        if (structure.size() == 2)
            return false;
        commentToken.setInternalStructure(structure);
        return true;
    }

    private boolean isCommonsAttributeAnnotation(String tokenContent) {
        return tokenContent.startsWith("@@"); //$NON-NLS-1$
    }

    private void noSubstituteWrapping(int from, int to) {
        int commentStart = this.ctm.get(0).originalStart;
        assert commentStart <= from && from <= to && to <= this.ctm.get(this.ctm.size() - 1).originalEnd;
        Arrays.fill(this.allowSubstituteWrapping, from - commentStart, to - commentStart + 1, false);
    }

    private void addSubstituteWraps() {
        Token previous = this.ctm.get(0);
        int commentStart = previous.originalStart;
        for (int i = 1; i < this.ctm.size() - 1; i++) {
            Token token = this.ctm.get(i);
            boolean touchesPrevious = token.originalStart == this.ctm.get(i - 1).originalEnd + 1;
            if (touchesPrevious
                && token.getLineBreaksBefore() == 0
                && previous.getLineBreaksAfter() == 0
                && token.getWrapPolicy() == null) {
                boolean allowWrap = this.allowSubstituteWrapping[token.originalStart - commentStart];
                token.setWrapPolicy(allowWrap ? WrapPolicy.SUBSTITUTE_ONLY : WrapPolicy.DISABLE_WRAP);
            }
            for (int pos = token.originalStart + 1; pos < token.originalEnd; pos++) {
                if (!this.allowSubstituteWrapping[pos - commentStart])
                    continue;
                char c = this.ctm.charAt(pos);
                if (!ScannerHelper.isJavaIdentifierPart(c)) {
                    this.ctm.get(tokenStartingAt(pos)).setWrapPolicy(WrapPolicy.SUBSTITUTE_ONLY);
                    this.ctm.get(tokenStartingAt(pos + 1)).setWrapPolicy(WrapPolicy.SUBSTITUTE_ONLY);
                }
            }
            previous = token;
        }
    }

    private boolean formatCode(int openingIndex, int closingIndex, boolean snippetTag, boolean isMarkdown) {
        int codeStartPosition = this.ctm.get(openingIndex).originalEnd + 1;
        int codeEndPosition = closingIndex < this.ctm.size()
            ? this.ctm.get(closingIndex).originalStart - 1
            : this.ctm.get(this.ctm.size() - 1).originalEnd;
        StringBuilder codeBuilder = new StringBuilder(codeEndPosition - codeStartPosition + 1);
        int[] positionMapping = new int[codeEndPosition - codeStartPosition + 1];
        // ^ index: original source position (minus startPosition), value: position in code string
        getCodeToFormat(codeStartPosition, codeEndPosition, codeBuilder, positionMapping, isMarkdown);

        CodeFormatter formatter = snippetTag ? getSnippetCodeFormatter() : getPreTagCodeFormatter();
        List<Token> formattedTokens = formatter.prepareFormattedCode(codeBuilder.toString());

        if (formattedTokens == null) {
            return false;
        }

        formattedTokens
            = translateFormattedTokens(codeStartPosition, formattedTokens, positionMapping, null, snippetTag);

        Token openingToken = this.ctm.get(openingIndex);
        for (Token token : formattedTokens)
            token.setAlign(token.getAlign() + openingToken.getAlign() + openingToken.getIndent());
        fixJavadocTagAlign(openingToken, closingIndex);

        // there are too few linebreaks at the start and end
        Token start = formattedTokens.get(0);
        start.putLineBreaksBefore(start.getLineBreaksBefore() + 1);
        if (!isMarkdown) {
            Token end = formattedTokens.get(formattedTokens.size() - 1);
            end.putLineBreaksAfter(end.getLineBreaksAfter() + 1);
            // and there may be too many line breaks before closing tag
            this.ctm.get(closingIndex).clearLineBreaksBefore();
        }
        List<Token> tokensToReplace = this.commentStructure.subList(openingIndex + 1, closingIndex);
        tokensToReplace.clear();
        tokensToReplace.addAll(formattedTokens);
        return true;
    }

    private CodeFormatter getPreTagCodeFormatter() {
        if (this.preTagCodeFormatter == null) {
            Map<String, String> options2 = this.options.getMap();
            options2.put("org.eclipse.jdt.core.formatter.comment.line_length",
                String.valueOf(this.options.comment_line_length - this.commentIndent - 3));

            options2.put("org.eclipse.jdt.core.formatter.lineSplit",
                String.valueOf(this.options.page_width - this.commentIndent - 3));
            options2.put("org.eclipse.jdt.core.compiler.source", this.sourceLevel);
            this.preTagCodeFormatter = new CodeFormatter(options2);
        }
        return this.preTagCodeFormatter;
    }

    private CodeFormatter getSnippetCodeFormatter() {
        if (this.snippetCodeFormatter == null) {
            Map<String, String> options2 = this.options.getMap();
            options2.put("org.eclipse.jdt.core.formatter.comment.preserve_white_space_between_code_and_line_comments",
                "true");
            options2.put("org.eclipse.jdt.core.formatter.comment.line_length", String.valueOf(10000));

            options2.put("org.eclipse.jdt.core.formatter.lineSplit",
                String.valueOf(this.options.page_width - this.commentIndent - 3));
            options2.put("org.eclipse.jdt.core.compiler.source", this.sourceLevel);
            this.snippetCodeFormatter = new CodeFormatter(options2);
        }
        return this.snippetCodeFormatter;
    }

    private void getCodeToFormat(int startPos, int endPos, StringBuilder sb, int[] posMapping, boolean isMarkdown) {
        int position = 0; // original source position (minus startPos)

        // skip excessive line break at the beginning
        char c, c2;
        if ((c = this.ctm.charAt(position + startPos)) == '\r' || c == '\n') {
            posMapping[position++] = sb.length() - 1;
            if (((c2 = this.ctm.charAt(position + startPos)) == '\r' || c2 == '\n') && c2 != c)
                posMapping[position++] = sb.length() - 1;
        }

        while (position + startPos <= endPos) {
            int lineStart = position + startPos;
            for (int i = lineStart;; i++) {
                c = this.ctm.charAt(i);
                if (c == '\r' || c == '\n') {
                    sb.append(c);
                    lineStart = i + 1;
                } else if (!ScannerHelper.isWhitespace(c)) {
                    if (c == '*')
                        lineStart = (this.ctm.charAt(i + 1) == ' ') ? i + 2 : i + 1;
                    if (c == '/' && isMarkdown)
                        lineStart = ((this.ctm.charAt(i + 1) == '/') && (this.ctm.charAt(i + 2) == '/'))
                            ? (this.ctm.charAt(i + 3) == ' ' ? i + 4 : i + 3)
                            : i + 1;
                    break;
                }
            }
            int lineEnd = endPos + 1;
            for (int i = lineStart; i <= endPos; i++) {
                c = this.ctm.charAt(i);
                if (c == '\r' || c == '\n') {
                    lineEnd = i;
                    break;
                }
            }

            while (position + startPos < lineStart && position < posMapping.length) {
                posMapping[position++] = sb.length() - 1;
            }

            int htmlEntityStart = -1;
            for (int i = lineStart; i < lineEnd; i++) {
                c = this.ctm.charAt(i);
                sb.append(c);
                posMapping[position++] = sb.length() - 1;

                if (c == '&') {
                    htmlEntityStart = i;
                } else if (c == ';' && htmlEntityStart >= 0) {
                    char replacementChar = getHtmlEntityChar(this.ctm.getSource().substring(htmlEntityStart, i + 1));
                    if (replacementChar != 0) {
                        sb.setLength(sb.length() - (i + 1 - htmlEntityStart));
                        sb.append(replacementChar);
                        for (int k = position - (i + 1 - htmlEntityStart); k < position; k++)
                            posMapping[k] = sb.length() - 1;
                    }
                    htmlEntityStart = -1;
                }
            }
        }

        // remove last line if empty
        while (!sb.isEmpty() && ((c = sb.charAt(sb.length() - 1)) == ' ' || c == '\t'))
            sb.deleteCharAt(sb.length() - 1);
        if (!sb.isEmpty() && ((c = sb.charAt(sb.length() - 1)) == '\r' || c == '\n')) {
            sb.deleteCharAt(sb.length() - 1);
            if (!sb.isEmpty() && ((c2 = sb.charAt(sb.length() - 1)) == '\r' || c2 == '\n') && c2 != c)
                sb.deleteCharAt(sb.length() - 1);
        }
    }

    private char getHtmlEntityChar(String entity) {
        Matcher matcher = HTML_ENTITY_PATTERN.matcher(entity);
        if (matcher.find()) {
            char replaceChar = 0;
            for (int i = 1; i < "   <> &^~\"".length(); i++) {
                int start = matcher.start(i);
                int end = matcher.end(i);
                if (start == end)
                    continue; // group not matched
                if (replaceChar != 0)
                    return 0; // more than one group matched
                replaceChar = switch (i) {
                    case 1 -> (char) Integer.parseInt(entity.substring(start + 2, end), 16);
                    case 2 -> (char) Integer.parseInt(entity.substring(start + 1, end), 10);
                    default -> "   <> &^~\"".charAt(i);
                };
            }
            return replaceChar;
        }
        return 0;
    }

    private List<Token> translateFormattedTokens(int startPosition, List<Token> formattedTokens, int[] positionMapping,
        HashMap<Token, Token> translationMap, boolean isSnippet) {
        int previousLineBreaks = 0;
        List<Token> result = new ArrayList<>();
        for (Token token : formattedTokens) {
            int newStart = Arrays.binarySearch(positionMapping, token.originalStart);
            while (newStart > 0 && positionMapping[newStart - 1] == token.originalStart)
                newStart--;
            int newEnd = Arrays.binarySearch(positionMapping, token.originalEnd);
            while (newEnd + 1 < positionMapping.length && positionMapping[newEnd + 1] == token.originalEnd)
                newEnd++;
            Token translated = new Token(token, newStart + startPosition, newEnd + startPosition, token.tokenType);
            if (translated.getWrapPolicy() == null)
                translated.setWrapPolicy(WrapPolicy.DISABLE_WRAP);

            if (token.hasNLSTag()) {
                if (translationMap == null)
                    translationMap = new HashMap<>();
                Token translatedNLS = translationMap.get(token.getNLSTag());
                if (translatedNLS != null) {
                    translatedNLS.setNLSTag(translated);
                    translated.setNLSTag(translatedNLS);
                } else {
                    translationMap.put(token, translated);
                }
            }

            int lineBreaks = Math.max(previousLineBreaks, token.getLineBreaksBefore());
            List<Token> structure = token.getInternalStructure();
            if (structure != null && !structure.isEmpty()) {
                translated.setInternalStructure(
                    translateFormattedTokens(startPosition, structure, positionMapping, translationMap, isSnippet));
            }
            translated.putLineBreaksBefore(lineBreaks);
            translated.setToEscape(!isSnippet);
            result.add(translated);
            previousLineBreaks = token.getLineBreaksAfter();
        }
        result.get(result.size() - 1).putLineBreaksAfter(previousLineBreaks);

        return result;
    }

    public void finishUp() {
        if (this.lastFormatOffComment != null)
            this.tm.addDisableFormatTokenPair(this.lastFormatOffComment, this.tm.get(this.tm.size() - 1));
    }
}
