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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameEOF;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameNotAToken;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ASTParser;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.Comment;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.CompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.TypeDeclaration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Formats Java compilation units and module descriptions using Eclipse JDT formatter options.
 *
 * @since 3.0
 */
public class CodeFormatter {

    /**
     * Kind used to format a compilation unit. If the formatted compilation unit is a module description (i.e. it's
     * named module-info.java), the {@link #K_MODULE_INFO} kind must be used instead.
     */
    public static final int K_COMPILATION_UNIT = 0x08;

    /**
     * Kind used to format a module description (a module-info.java file).
     *
     * @since 3.14
     */
    public static final int K_MODULE_INFO = 0x80;

    private final DefaultCodeFormatterOptions options;

    private String sourceString;
    char[] sourceArray;
    private List<Region> formatRegions;

    private ASTNode astRoot;
    private final List<Token> tokens = new ArrayList<>();
    private TokenManager tokenManager;

    /**
     * Creates a formatter that uses the given formatter options. The formatter always parses Java 11 source, and
     * comments that start in the first column are formatted and indented like other comments.
     *
     * @param options the formatter options, keyed by the standard Eclipse JDT formatter option names
     */
    public CodeFormatter(Map<String, String> options) {
        this(new DefaultCodeFormatterOptions(options));
    }

    /**
     * Creates a formatter that uses the given options, which it does not copy.
     *
     * @param options the formatter options
     */
    public CodeFormatter(DefaultCodeFormatterOptions options) {
        this.options = options;
    }

    /**
     * Formats <code>source</code>, including its comments when the corresponding comment options are enabled.
     *
     * @param kind {@link #K_COMPILATION_UNIT} or {@link #K_MODULE_INFO}
     * @param source the source to format
     * @return the formatted source; a source without any tokens is returned unchanged
     */
    public String format(int kind, String source) {
        this.formatRegions = List.of(new Region(0, source.length()));

        if (prepareFormattedCode(source, kind) == null)
            return source;

        TextEditsBuilder resultBuilder
            = new TextEditsBuilder(this.sourceString, this.formatRegions, this.tokenManager, this.options);
        this.tokenManager.traverse(0, resultBuilder);
        return resultBuilder.applyEdits();
    }

    private boolean init(String source, int kind) {

        this.sourceString = source;
        this.sourceArray = source.toCharArray();
        this.tokens.clear();
        this.tokenManager = new TokenManager(this.tokens, source, this.options);

        tokenizeSource(kind);
        return !this.tokens.isEmpty();
    }

    public List<Token> prepareFormattedCode(String source) {
        this.formatRegions = List.of(new Region(0, source.length()));
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

    private ASTNode parseSourceCode(int kind) {
        if (kind != 0)
            return ASTParser.createAST(kind, this.sourceArray);

        int[] kindsToTry = { 8, 1, 4, 2, 128 };
        for (int kindToTry : kindsToTry) {
            ASTNode astNode = ASTParser.createAST(kindToTry, this.sourceArray);
            if (!hasErrors(astNode)) {
                if (kindToTry == 128)
                    tokenizeSource(kindToTry); // run scanner again to get module specific tokens
                return astNode;
            }
        }
        return null;
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
        Scanner scanner = new Scanner(true /* comment */, 3604480L /* Java 11 */, null/* taskTags */,
            null/* taskPriorities */, false/* taskCaseSensitive */, false);
        scanner.setSource(this.sourceArray);
        scanner.fakeInModule = (kind & 128) != 0;
        while (true) {
            try {
                TerminalToken tokenType = scanner.getNextToken();
                if (tokenType == TokenNameEOF)
                    break;
                Token token = Token.fromCurrent(scanner, tokenType);
                this.tokens.add(token);
            } catch (InvalidInputException e) {
                Token token = Token.fromCurrent(scanner, TokenNameNotAToken);
                this.tokens.add(token);
            }
        }
    }

    private void prepareSpaces() {
        SpacePreparator spacePreparator = new SpacePreparator(this.tokenManager, this.options);
        this.astRoot.accept(spacePreparator);
        spacePreparator.finishUp();
    }

    private void prepareLineBreaks() {
        LineBreaksPreparator breaksPreparator = new LineBreaksPreparator(this.tokenManager, this.options);
        this.astRoot.accept(breaksPreparator);
        breaksPreparator.finishUp();
        this.astRoot.accept(new OneLineEnforcer(this.tokenManager, this.options));
    }

    private void prepareComments() {
        CommentsPreparator commentsPreparator = new CommentsPreparator(this.tokenManager, this.options);
        List<Comment> comments = ((CompilationUnit) this.astRoot.getRoot()).getCommentList();
        for (Comment comment : comments) {
            comment.accept(commentsPreparator);
        }
        commentsPreparator.finishUp();
    }

    private void prepareWraps(int kind) {
        WrapPreparator wrapPreparator = new WrapPreparator(this.tokenManager, this.options, kind);
        this.astRoot.accept(wrapPreparator);
        applyFormatOff();
        wrapPreparator.finishUp(this.astRoot, this.formatRegions);
    }

    private void applyFormatOff() {
        for (Token[] offPair : this.tokenManager.getDisableFormatTokenPairs()) {
            final int offStart = offPair[0].originalStart;
            final int offEnd = offPair[1].originalEnd;

            offPair[0].setWrapPolicy(null);
            offPair[0]
                .setIndent(Math.min(offPair[0].getIndent(), this.tokenManager.findSourcePositionInLine(offStart)));

            final List<Region> result = new ArrayList<>();
            for (Region region : this.formatRegions) {
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

}
