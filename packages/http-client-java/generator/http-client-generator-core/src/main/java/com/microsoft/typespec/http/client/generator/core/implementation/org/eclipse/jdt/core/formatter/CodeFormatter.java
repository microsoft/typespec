// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
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
 *     Jesper Steen Moller - Contributions for
 *								bug 404146 - [1.7][compiler] nested try-catch-finally-blocks leads to unrunnable Java byte code
 *     Harry Terkelsen (het@google.com) - Bug 449262 - Allow the use of third-party Java formatters
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Formatter does not format Java code correctly, especially when max line width is set - https://bugs.eclipse.org/303519
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] follow up bug for comments - https://bugs.eclipse.org/458208
 *     Lars Vogel <Lars.Vogel@vogella.com> - Contributions for
 *     						Bug 473178
 *******************************************************************************/

/*******************************************************************************
 * Copyright (c) 2000, 2021 IBM Corporation and others.
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
 *     Harry Terkelsen (het@google.com) - Bug 449262 - Allow the use of third-party Java formatters
 *******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameCOMMENT_BLOCK;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameCOMMENT_JAVADOC;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameCOMMENT_LINE;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameEOF;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameNotAToken;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.ASTParser;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.Comment;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.CompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.Javadoc;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.TypeDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.CommentsPreparator;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.DefaultCodeFormatterOptions;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.LineBreaksPreparator;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.OneLineEnforcer;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.SpacePreparator;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.TextBlockReplacePreparator;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.TextEditsBuilder;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.Token;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.TokenManager;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.TokenTextBlock;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.linewrap.CommentWrapExecutor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.linewrap.WrapPreparator;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.IRegion;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jface.text.Region;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.text.edits.MultiTextEdit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.text.edits.TextEdit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Specification for a generic source code formatter.
 *
 * @since 3.0
 */
public class CodeFormatter {

    /**
     * Kind used to format a compilation unit <p> <u>Note:</u> <b>since 3.14</b>, if the formatted compilation unit is a
     * module description (i.e. it's named module-info.java), the {@link #K_MODULE_INFO} kind must be used instead.
     * </p><p> <b>Since 3.4</b>, if the corresponding comment option is set to <code>true</code> then it is also
     * possible to format the comments on the fly by adding the {@link #F_INCLUDE_COMMENTS} flag to this kind of format.
     * </p>
     */
    public static final int K_COMPILATION_UNIT = 0x08;

    /**
     * Kind used to format a module description (a module-info.java file). <p> If the corresponding comment option is
     * set to <code>true</code> then it is also possible to format the comments on the fly by adding the
     * {@link #F_INCLUDE_COMMENTS} flag to this kind of format. </p>
     *
     * @since 3.14
     */
    public static final int K_MODULE_INFO = 0x80;

    /**
     * Flag used to include the comments during the formatting of the code snippet. <p> This flag can be combined with
     * the following kinds: <ul> <li>{@link #K_COMPILATION_UNIT}</li> <li><code>0</code> (unknown)</li>
     * <li><code>4</code> (class body declarations) <i>(since 3.6)</i></li> <li><code>1</code> (expression)
     * <i>(since 3.6)</i></li> <li><code>2</code> (statements) <i>(since 3.6)</i></li> <li>{@link #K_MODULE_INFO}
     * <i>(since 3.14)</i></li> </ul> <p> Note also that it has an effect only when one or several format comments
     * options for javadoc, block or line are set to true while calling {@link #format(int, String, int)} or
     * {@link #format(int, String, IRegion[])} </p><p> For example, with the Eclipse default
     * formatter options, the formatting of the following code snippet using {@link #K_COMPILATION_UNIT}:
     *
     * <pre>
     * public class X {
     *     &#047;&#042;&#042;
     *      * This is just a simple example to show that comments will be formatted while processing a compilation unit
     *      * only if the constant flag <code>F_INCLUDE_COMMENT</code> flag is set.
     *      *
     *      * &#064;param str The input string
     *     &#042;&#047;
     *     void foo(String str) {
     *     }
     * }
     * </pre>
     *
     * will produce the following output:
     *
     * <pre>
     * public class X {
     *     &#047;&#042;&#042;
     *      * This is just a simple example to show that comments will be formatted while processing a compilation unit
     *      * only if the constant flag <code>F_INCLUDE_COMMENT</code> flag is set.
     *      *
     *      * &#064;param str The input string
     *     &#042;&#047;
     *     void foo(String str) {
     *     }
     * }
     * </pre>
     *
     * Adding this flavor to the kind given while formatting the same source (e.g. {@link #K_COMPILATION_UNIT} |
     * {@link #F_INCLUDE_COMMENTS}) will produce the following output instead:
     *
     * <pre>
     * public class X {
     *     &#047;&#042;&#042;
     *      * This is just a simple example to show that comments will be formatted while processing a compilation unit
     *      * only if the constant flag <code>F_INCLUDE_COMMENT</code> flag is set.
     *      *
     *      * &#064;param str The input string
     *     &#042;&#047;
     *     void foo(String str) {
     *     }
     * }
     * </pre>
     *
     * <p> <i><u>Note</u>: Although we're convinced that the formatter should always include the comments while
     * processing a {@link #K_COMPILATION_UNIT kind of compilation unit}, we have decided to add a specific flag to fix
     * this formatter incorrect behavior. This will prevent all existing clients (e.g. 3.3 and previous versions) using
     * the {@link #K_COMPILATION_UNIT} kind to be broken while formatting.</i> </p>
     *
     * @since 3.4
     */
    public static final int F_INCLUDE_COMMENTS = 0x1000;

    private static final Map<Integer, Integer> FORMAT_TO_PARSER_KIND = new HashMap<>();
    static {
        FORMAT_TO_PARSER_KIND.put(8, 8);
        FORMAT_TO_PARSER_KIND.put(128, 8);
        FORMAT_TO_PARSER_KIND.put(4, 4);
        FORMAT_TO_PARSER_KIND.put(2, 2);
        FORMAT_TO_PARSER_KIND.put(1, 1);
    }

    private DefaultCodeFormatterOptions originalOptions;
    private DefaultCodeFormatterOptions workingOptions;

    private Object oldCommentFormatOption;
    private String sourceLevel;
    public boolean previewEnabled;

    private String sourceString;
    char[] sourceArray;
    private List<IRegion> formatRegions;

    private ASTNode astRoot;
    private final List<Token> tokens = new ArrayList<>();
    private TokenManager tokenManager;

    public CodeFormatter(Map<String, String> options) {
        initOptions(options);
    }

    private void initOptions(Map<String, String> options) {
        if (options != null) {
            this.originalOptions = new DefaultCodeFormatterOptions(options);
            this.workingOptions = new DefaultCodeFormatterOptions(options);
            this.oldCommentFormatOption = getOldCommentFormatOption(options);
            String compilerSource = options.get("org.eclipse.jdt.core.compiler.source");
            this.sourceLevel = compilerSource != null ? compilerSource : "26";
            this.previewEnabled
                = "enabled".equals(options.get("org.eclipse.jdt.core.compiler.problem.enablePreviewFeatures"));
        } else {
            Map<String, String> settings = DefaultCodeFormatterConstants.getJavaConventionsSettings();
            this.originalOptions = new DefaultCodeFormatterOptions(settings);
            this.workingOptions = new DefaultCodeFormatterOptions(settings);
            this.oldCommentFormatOption = "true";
            this.sourceLevel = "26";
        }

    }

    @Deprecated
    private Object getOldCommentFormatOption(Map<String, String> options) {
        return options.get("org.eclipse.jdt.core.formatter.comment.format_comments");
    }

    /**
     * Format <code>source</code>, and returns a text edit that correspond to the difference between the given string
     * and the formatted string. <p> It returns null if the given string cannot be formatted. </p><p> If the offset
     * position is matching a whitespace, the result can include whitespaces. It would be up to the caller to get rid of
     * preceding whitespaces. </p>
     *
     * @param kind Use to specify the kind of the code snippet to format. It can be any of these: <ul>
     * <li><code>1</code> (expression)</li> <li><code>2</code> (statements)</li> <li><code>4</code> (class body
     * declarations)</li> <li>{@link #K_COMPILATION_UNIT}</li> <li>{@link #K_MODULE_INFO}</li> <li><code>0</code>
     * (unknown)</li> <li><code>16</code> (single-line comment)</li> <li><code>32</code> (multi-line comment)</li>
     * <li><code>64</code> (Javadoc)</li> </ul>
     * <b>Since 3.4</b> for {@link #K_COMPILATION_UNIT} and <b>since 3.6</b> for other kinds unrelated to comments, the
     * {@link #F_INCLUDE_COMMENTS} flag can be used to format comments on the fly (see the flag documentation for more
     * detailed explanation).
     * @param source the source to format
     * @param length the given length to stop recording the edits (exclusive).
     * @return the text edit
     * @throws IllegalArgumentException if length is lower than 0 or length is greater than source length.
     */
    public TextEdit format(int kind, String source, int length) {

        return format(kind, source, new IRegion[] { new Region(0, length) });
    }

    public TextEdit format(int kind, String source, IRegion[] regions) {

        assertRegionPreconditions(regions, source.length());
        this.formatRegions = Arrays.asList(regions);

        updateWorkingOptions(kind);

        if ((kind & 112) != 0)
            return formatComments(source, kind & 112);

        if (prepareFormattedCode(source, kind) == null)
            return this.tokens.isEmpty() ? new MultiTextEdit() : null;

        MultiTextEdit result = new MultiTextEdit();
        TextEditsBuilder resultBuilder
            = new TextEditsBuilder(this.sourceString, this.formatRegions, this.tokenManager, this.workingOptions);
        this.tokenManager.traverse(0, resultBuilder);
        for (TextEdit edit : resultBuilder.getEdits()) {
            result.addChild(edit);
        }
        return result;
    }

    private boolean init(String source, int kind) {

        // this is convenient for debugging (see Token.toString())
        // Token.source = source;

        this.sourceString = source;
        this.sourceArray = source.toCharArray();
        this.tokens.clear();
        this.tokenManager = new TokenManager(this.tokens, source, this.workingOptions);

        tokenizeSource(kind);
        return !this.tokens.isEmpty();
    }

    public List<Token> prepareFormattedCode(String source) {
        this.formatRegions = Arrays.asList(new Region(0, source.length()));
        return prepareFormattedCode(source, 0);
    }

    private List<Token> prepareFormattedCode(String source, int kind) {
        if (!init(source, kind))
            return null;

        this.astRoot = parseSourceCode(kind);
        if (this.astRoot == null)
            return null;

        if (kind != 0)
            findHeader();

        prepareSpaces();
        prepareReplaceTextBlocks();
        prepareLineBreaks();
        prepareComments();
        prepareWraps(kind);

        return this.tokens;
    }

    private void findHeader() {
        if (this.astRoot instanceof CompilationUnit unit) {
            List<TypeDeclaration> types = unit.types();
            ASTNode firstElement
                = !types.isEmpty() ? types.get(0) : unit.getModule() != null ? unit.getModule() : unit.getPackage();
            if (firstElement != null) {
                int headerEndIndex = this.tokenManager.firstIndexIn(firstElement, TerminalToken.TokenNameInvalid);
                this.tokenManager.setHeaderEndIndex(headerEndIndex);
            }
        }
    }

    private TextEdit formatComments(String source, int kind) {
        MultiTextEdit result = new MultiTextEdit();
        if (!init(source, kind))
            return result;

        CommentsPreparator commentsPreparator
            = new CommentsPreparator(this.tokenManager, this.workingOptions, this.sourceLevel);
        CommentWrapExecutor commentWrapper = new CommentWrapExecutor(this.tokenManager, this.workingOptions);
        switch (kind) {
            case 64:
                for (Token token : this.tokens) {
                    if (token.tokenType == TokenNameCOMMENT_JAVADOC) {
                        CompilationUnit cu = (CompilationUnit) parseSourceCode(8);
                        Javadoc javadoc = (Javadoc) cu.getCommentList().get(0);
                        javadoc.accept(commentsPreparator);
                        int startPosition = this.tokenManager.findSourcePositionInLine(token.originalStart);
                        commentWrapper.wrapMultiLineComment(token, startPosition, false, false);
                    }
                }
                break;

            case 32:
                for (int i = 0; i < this.tokens.size(); i++) {
                    Token token = this.tokens.get(i);
                    if (token.tokenType == TokenNameCOMMENT_BLOCK) {
                        commentsPreparator.handleBlockComment(i);
                        int startPosition = this.tokenManager.findSourcePositionInLine(token.originalStart);
                        commentWrapper.wrapMultiLineComment(token, startPosition, false, false);
                    }
                }
                break;

            case 16:
                for (int i = 0; i < this.tokens.size(); i++) {
                    Token token = this.tokens.get(i);
                    if (token.tokenType == TokenNameCOMMENT_LINE) {
                        commentsPreparator.handleLineComment(i);
                        if (i >= this.tokens.size() || this.tokens.get(i) != token) {
                            // current token has been removed and merged with previous one
                            i--;
                            token = this.tokens.get(i);
                        }
                        int startPosition = this.tokenManager.findSourcePositionInLine(token.originalStart);
                        commentWrapper.wrapLineComment(token, startPosition);
                    }
                }
                break;

            default:
                throw new AssertionError(String.valueOf(kind));
        }

        applyFormatOff();

        TextEditsBuilder resultBuilder
            = new TextEditsBuilder(source, this.formatRegions, this.tokenManager, this.workingOptions);
        resultBuilder.setAlignChar();
        for (Token token : this.tokens) {
            List<Token> structure = token.getInternalStructure();
            if (token.isComment() && structure != null && !structure.isEmpty())
                resultBuilder.processComment(token);
        }

        for (TextEdit edit : resultBuilder.getEdits()) {
            result.addChild(edit);
        }
        return result;
    }

    private ASTNode parseSourceCode(int kind) {
        kind = kind & 255;
        if (kind != 0) {
            ASTNode astNode = createParser(kind).createAST();
            if (kind == 8 || kind == 128)
                return astNode;
            return hasErrors(astNode) ? null : astNode;
        }

        int[] kindsToTry = { 8, 1, 4, 2, 128 };
        for (int kindToTry : kindsToTry) {
            ASTNode astNode = createParser(kindToTry).createAST();
            if (!hasErrors(astNode)) {
                if (kindToTry == 128)
                    tokenizeSource(kindToTry); // run scanner again to get module specific tokens
                return astNode;
            }
        }
        return null;
    }

    private ASTParser createParser(int kind) {
        ASTParser parser = ASTParser.newParser();

        parser.setSource(this.sourceArray, kind == 128 ? "module-info.java" : "");
        parser.setKind(FORMAT_TO_PARSER_KIND.get(kind));

        Map<String, String> parserOptions = CompilerOptions.getJavaCoreDefaultOptions();
        parserOptions.put("org.eclipse.jdt.core.compiler.source", this.sourceLevel);
        parserOptions.put("org.eclipse.jdt.core.compiler.doc.comment.support", "enabled");
        parserOptions.put("org.eclipse.jdt.core.compiler.problem.enablePreviewFeatures", "enabled"); // TODO
        parserOptions.put("org.eclipse.jdt.core.compiler.problem.reportPreviewFeatures", "ignore");
        parser.setCompilerOptions(parserOptions);
        return parser;
    }

    private boolean hasErrors(ASTNode astNode) {
        CompilationUnit root = (CompilationUnit) astNode.getRoot();
        for (IProblem problem : root.getProblems()) {
            if (problem.isError())
                return true;
        }
        return false;
    }

    private void tokenizeSource(int kind) {
        this.tokens.clear();
        Scanner scanner = new Scanner(true, false/* nls */, CompilerOptions.versionToJdkLevel(this.sourceLevel),
            null/* taskTags */, null/* taskPriorities */, false/* taskCaseSensitive */, this.previewEnabled);
        scanner.setSource(this.sourceArray);
        scanner.fakeInModule = (kind & 128) != 0;
        while (true) {
            try {
                TerminalToken tokenType = scanner.getNextToken();
                if (tokenType == TokenNameEOF)
                    break;
                Token token = Token.fromCurrent(scanner, tokenType);
                if (this.workingOptions.put_text_block_quotes_on_new_line
                    && token.tokenType == TerminalToken.TokenNameTextBlock) {
                    for (IRegion region : this.formatRegions) {
                        if (region.getOffset() <= token.originalStart
                            && region.getOffset() + region.getLength() >= token.originalEnd) {
                            token = new TokenTextBlock(token.originalStart, token.originalEnd);
                            break;
                        }
                    }
                }
                this.tokens.add(token);
            } catch (InvalidInputException e) {
                Token token = Token.fromCurrent(scanner, TokenNameNotAToken);
                this.tokens.add(token);
            }
        }
    }

    private void prepareSpaces() {
        SpacePreparator spacePreparator = new SpacePreparator(this.tokenManager, this.workingOptions);
        this.astRoot.accept(spacePreparator);
        spacePreparator.finishUp();
    }

    private void prepareLineBreaks() {
        LineBreaksPreparator breaksPreparator = new LineBreaksPreparator(this.tokenManager, this.workingOptions);
        this.astRoot.accept(breaksPreparator);
        breaksPreparator.finishUp();
        this.astRoot.accept(new OneLineEnforcer(this.tokenManager, this.workingOptions));
    }

    private void prepareComments() {
        CommentsPreparator commentsPreparator
            = new CommentsPreparator(this.tokenManager, this.workingOptions, this.sourceLevel);
        List<Comment> comments = ((CompilationUnit) this.astRoot.getRoot()).getCommentList();
        for (Comment comment : comments) {
            comment.accept(commentsPreparator);
        }
        commentsPreparator.finishUp();
    }

    private void prepareWraps(int kind) {
        WrapPreparator wrapPreparator = new WrapPreparator(this.tokenManager, this.workingOptions, kind);
        this.astRoot.accept(wrapPreparator);
        applyFormatOff();
        wrapPreparator.finishUp(this.astRoot, this.formatRegions);
    }

    private void prepareReplaceTextBlocks() {
        TextBlockReplacePreparator tbrPreparator
            = new TextBlockReplacePreparator(this.tokenManager, this.originalOptions);
        this.astRoot.accept(tbrPreparator);
    }

    private void applyFormatOff() {
        for (Token[] offPair : this.tokenManager.getDisableFormatTokenPairs()) {
            final int offStart = offPair[0].originalStart;
            final int offEnd = offPair[1].originalEnd;

            offPair[0].setWrapPolicy(null);
            offPair[0]
                .setIndent(Math.min(offPair[0].getIndent(), this.tokenManager.findSourcePositionInLine(offStart)));

            final List<IRegion> result = new ArrayList<>();
            for (IRegion region : this.formatRegions) {
                final int start = region.getOffset(), end = region.getOffset() + region.getLength() - 1;
                if (offEnd < start || end < offStart) {
                    result.add(region);
                } else if (offStart <= start && end <= offEnd) {
                    // whole region off
                } else {
                    if (start < offStart)
                        result.add(new Region(start, offStart - start));
                    if (offEnd < end)
                        result.add(new Region(offEnd + 1, end - offEnd));
                }
            }
            this.formatRegions = result;
        }
    }

    /**
     * Passes if <li>1. All regions are within maxLength <li>2. regions are sorted <li>3. regions are not overlapping
     */
    private void assertRegionPreconditions(IRegion[] regions, int maxLength) {
        int regionsLength = regions == null ? 0 : regions.length;
        if (regionsLength == 0) {
            throw new IllegalArgumentException("no regions"); //$NON-NLS-1$
        }

        IRegion first = regions[0];
        if (first.getOffset() < 0 || first.getLength() < 0 || first.getOffset() + first.getLength() > maxLength) {
            throw new IllegalArgumentException("range exceeded:" + maxLength //$NON-NLS-1$
                + Arrays.asList(regions)
                    .stream()
                    .map(r -> "[off:" + r.getOffset() + "length:" + r.getLength() + "]") //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
                    .collect(Collectors.joining(", ")));   //$NON-NLS-1$
        }

        int lastOffset = first.getOffset() + first.getLength() - 1;
        for (int i = 1; i < regionsLength; i++) {
            IRegion current = regions[i];
            if (lastOffset > current.getOffset()) {
                throw new IllegalArgumentException("regions not sorted:" + Arrays.asList(regions) //$NON-NLS-1$
                    .stream()
                    .map(r -> "[off:" + r.getOffset() + "length:" + r.getLength() + "]") //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
                    .collect(Collectors.joining(", ")));   //$NON-NLS-1$
            }

            if (current.getOffset() < 0
                || current.getLength() < 0
                || current.getOffset() + current.getLength() > maxLength) {
                throw new IllegalArgumentException("range exceeded:" + maxLength //$NON-NLS-1$
                    + Arrays.asList(regions)
                        .stream()
                        .map(r -> "[off:" + r.getOffset() + "length:" + r.getLength() + "]") //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
                        .collect(Collectors.joining(", ")));   //$NON-NLS-1$
            }

            lastOffset = current.getOffset() + current.getLength() - 1;
        }
    }

    private void updateWorkingOptions(int kind) {

        this.workingOptions.line_separator = "\n";
        if (this.workingOptions.line_separator == null)
            this.workingOptions.line_separator = Util.LINE_SEPARATOR;

        this.workingOptions.initial_indentation_level = 0;

        this.workingOptions.comment_format_javadoc_comment
            = this.originalOptions.comment_format_javadoc_comment && canFormatComment(kind, 64);
        this.workingOptions.comment_format_block_comment
            = this.originalOptions.comment_format_block_comment && canFormatComment(kind, 32);
        this.workingOptions.comment_format_line_comment
            = this.originalOptions.comment_format_line_comment && canFormatComment(kind, 16);
    }

    private boolean canFormatComment(int kind, int commentKind) {
        if ((kind & 4096) != 0)
            return true;
        if ("false".equals(this.oldCommentFormatOption))
            return false;
        if ((kind & 255) == commentKind)
            return true;
        if (kind == 0 && "true".equals(this.oldCommentFormatOption))
            return true;
        return false;
    }
}
