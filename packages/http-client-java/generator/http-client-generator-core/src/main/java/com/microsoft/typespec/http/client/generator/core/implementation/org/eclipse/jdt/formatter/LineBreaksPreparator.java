// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2014, 2025 Mateusz Matela and others.
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
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] follow up bug for comments - https://bugs.eclipse.org/458208
 *     IBM Corporation - DOM AST changes for JEP 354
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.*;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter.Token.WrapMode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter.Token.WrapPolicy;
import java.util.ArrayList;
import java.util.List;

public class LineBreaksPreparator extends ASTVisitor {
    final private TokenManager tm;
    final private DefaultCodeFormatterOptions options;

    public LineBreaksPreparator(TokenManager tokenManager, DefaultCodeFormatterOptions options) {
        this.tm = tokenManager;
        this.options = options;
    }

    @Override
    public boolean preVisit2(ASTNode node) {
        return (node.getFlags() & 1) == 0;
    }

    @Override
    public boolean visit(CompilationUnit node) {
        List<ImportDeclaration> imports = node.imports();
        if (!imports.isEmpty()
            && this.tm.firstIndexIn(imports.get(0),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
                > 0)
            putBlankLinesBefore(imports.get(0), this.options.blank_lines_before_imports);

        for (int i = 1; i < imports.size(); i++) {
            int from = this.tm.lastIndexIn(imports.get(i - 1),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
            int to = this.tm.firstIndexIn(imports.get(i),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
            for (int j = from; j < to; j++) {
                Token token1 = this.tm.get(j);
                Token token2 = this.tm.get(j + 1);
                if (this.tm.countLineBreaksBetween(token1, token2) > 1)
                    putBlankLinesAfter(token1, this.options.blank_lines_between_import_groups);
            }
        }

        List<AnnotationTypeDeclaration> types = node.types();
        if (!types.isEmpty()) {
            if (!imports.isEmpty())
                putBlankLinesBefore(types.get(0), this.options.blank_lines_after_imports);
            for (int i = 1; i < types.size(); i++)
                putBlankLinesBefore(types.get(i), this.options.blank_lines_between_type_declarations);
        }
        return true;
    }

    @Override
    public boolean visit(PackageDeclaration node) {
        if (node.getJavadoc() == null) {
            putBlankLinesBefore(node, this.options.blank_lines_before_package);
        } else {
            putBlankLinesAfter(this.tm.lastTokenIn(node.getJavadoc(),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid),
                this.options.blank_lines_before_package);
        }

        handleAnnotations(node.annotations(), this.options.insert_new_line_after_annotation_on_package);
        putBlankLinesAfter(this.tm.lastTokenIn(node,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid),
            this.options.blank_lines_after_package);
        return true;
    }

    @Override
    public boolean visit(ImportDeclaration node) {
        breakLineBefore(node);
        return true;
    }

    @Override
    public boolean visit(TypeDeclaration node) {
        handleBodyDeclarations(node.bodyDeclarations());

        if (this.tm.isFake(node))
            return true;

        breakLineBefore(node);
        handleAnnotations(node.modifiers(), this.options.insert_new_line_after_annotation_on_type);
        handleBracedCode(node, node.getName(), this.options.brace_position_for_type_declaration,
            this.options.indent_body_declarations_compare_to_type_header);
        return true;
    }

    private void handleBodyDeclarations(List<BodyDeclaration> bodyDeclarations) {
        BodyDeclaration previous = null;
        for (BodyDeclaration bodyDeclaration : bodyDeclarations) {
            int blankLines = 0;
            if (previous == null) {
                blankLines = this.options.blank_lines_before_first_class_body_declaration;
            } else if (!sameChunk(previous, bodyDeclaration)) {
                blankLines = this.options.blank_lines_before_new_chunk;
            } else if (bodyDeclaration instanceof FieldDeclaration) {
                blankLines = this.options.blank_lines_before_field;
            } else if (bodyDeclaration instanceof AbstractTypeDeclaration) {
                blankLines = this.options.blank_lines_before_member_type;
            } else if (bodyDeclaration instanceof MethodDeclaration) {
                blankLines = ((MethodDeclaration) bodyDeclaration).getBody() == null
                    && ((MethodDeclaration) previous).getBody() == null
                        ? this.options.blank_lines_before_abstract_method
                        : this.options.blank_lines_before_method;
            } else if (bodyDeclaration instanceof AnnotationTypeMemberDeclaration) {
                blankLines = this.options.blank_lines_before_method;
            }
            putBlankLinesBefore(bodyDeclaration, blankLines);
            previous = bodyDeclaration;
        }
        if (previous != null) {
            ASTNode parent = previous.getParent();
            if (!(parent instanceof TypeDeclaration && this.tm.isFake((TypeDeclaration) parent)
                || parent instanceof ImplicitTypeDeclaration)) {
                Token lastToken = this.tm.lastTokenIn(parent,
                    com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
                putBlankLinesBefore(lastToken, this.options.blank_lines_after_last_class_body_declaration);
            }
        }
    }

    private boolean sameChunk(BodyDeclaration bd1, BodyDeclaration bd2) {
        if (bd1.getClass().equals(bd2.getClass()))
            return true;
        if (bd1 instanceof AbstractTypeDeclaration && bd2 instanceof AbstractTypeDeclaration)
            return true;
        return (bd1 instanceof FieldDeclaration || bd1 instanceof Initializer)
            && (bd2 instanceof FieldDeclaration || bd2 instanceof Initializer); // special case: initializers are often
                                                                                // related to fields, don't separate
    }

    @Override
    public boolean visit(EnumDeclaration node) {
        handleAnnotations(node.modifiers(), this.options.insert_new_line_after_annotation_on_type);
        handleBracedCode(node, node.getName(), this.options.brace_position_for_enum_declaration,
            this.options.indent_body_declarations_compare_to_enum_declaration_header);

        List<BodyDeclaration> declarations = node.bodyDeclarations();
        List<EnumConstantDeclaration> enumConstants = node.enumConstants();
        if (!declarations.isEmpty()) {
            if (!enumConstants.isEmpty()) {
                declarations = new ArrayList<>(declarations);
                declarations.add(0, enumConstants.get(0));
            }
            handleBodyDeclarations(declarations);
        }

        for (int i = 0; i < enumConstants.size(); i++) {
            EnumConstantDeclaration declaration = enumConstants.get(i);
            if (declaration.getJavadoc() != null)
                this.tm.firstTokenIn(declaration.getJavadoc(),
                    com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
                    .breakBefore();
            if (declaration.getAnonymousClassDeclaration() != null && i < enumConstants.size() - 1)
                this.tm.firstTokenAfter(declaration, TokenNameCOMMA).breakAfter();
        }

        // put breaks after semicolons
        int index = enumConstants.isEmpty()
            ? this.tm.firstIndexAfter(node.getName(), TokenNameLBRACE) + 1
            : this.tm.firstIndexAfter(enumConstants.get(enumConstants.size() - 1),
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
        for (;; index++) {
            Token token = this.tm.get(index);
            if (token.isComment())
                continue;
            if (token.tokenType == TokenNameSEMICOLON)
                token.breakAfter();
            else
                break;
        }
        return true;
    }

    @Override
    public boolean visit(AnnotationTypeDeclaration node) {
        handleAnnotations(node.modifiers(), this.options.insert_new_line_after_annotation_on_type);
        handleBracedCode(node, node.getName(), this.options.brace_position_for_annotation_type_declaration,
            this.options.indent_body_declarations_compare_to_annotation_declaration_header);

        handleBodyDeclarations(node.bodyDeclarations());
        if (node.getModifiers() == 0)
            this.tm.firstTokenBefore(node.getName(), TokenNameAT).breakBefore();
        return true;
    }

    @Override
    public boolean visit(AnonymousClassDeclaration node) {
        if (node.getParent() instanceof EnumConstantDeclaration) {
            handleBracedCode(node, null, this.options.brace_position_for_enum_constant,
                this.options.indent_body_declarations_compare_to_enum_constant_header);
        } else {
            handleBracedCode(node, null, this.options.brace_position_for_anonymous_type_declaration,
                this.options.indent_body_declarations_compare_to_type_header);
        }
        handleBodyDeclarations(node.bodyDeclarations());
        return true;
    }

    @Override
    public boolean visit(MethodDeclaration node) {
        handleAnnotations(node.modifiers(), this.options.insert_new_line_after_annotation_on_method);
        if (node.getBody() == null)
            return true;

        String bracePosition = node.isCompactConstructor()
            ? this.options.brace_position_for_record_constructor
            : node.isConstructor()
                ? this.options.brace_position_for_constructor_declaration
                : this.options.brace_position_for_method_declaration;
        handleBracedCode(node.getBody(), null, bracePosition, this.options.indent_statements_compare_to_body,
            this.options.blank_lines_at_beginning_of_method_body, this.options.blank_lines_at_end_of_method_body);

        return true;
    }

    @Override
    public boolean visit(Block node) {
        List<Statement> statements = node.statements();
        for (Statement statement : statements) {
            if (this.options.put_empty_statement_on_new_line || !(statement instanceof EmptyStatement))
                breakLineBefore(statement);
        }
        ASTNode parent = node.getParent();
        if (parent.getLength() == 0)
            return true; // this is a fake block created by parsing in statements mode
        if (parent instanceof MethodDeclaration)
            return true; // braces have been handled in #visit(MethodDeclaration)

        String bracePosition = this.options.brace_position_for_block;
        if (parent instanceof SwitchStatement sw) {
            bracePosition = getBracePositionInSwitch(node, sw.statements());
        } else if (parent instanceof SwitchExpression se) {
            bracePosition = getBracePositionInSwitch(node, se.statements());
        } else if (parent instanceof LambdaExpression) {
            bracePosition = this.options.brace_position_for_lambda_body;
        }
        handleBracedCode(node, null, bracePosition, this.options.indent_statements_compare_to_block,
            this.options.blank_lines_at_beginning_of_code_block, this.options.blank_lines_at_end_of_code_block);

        if (parent instanceof Block) {
            blankLinesAroundBlock(node, ((Block) parent).statements());
        } else if (parent instanceof Statement && parent.getParent() instanceof Block) {
            blankLinesAroundBlock(parent, ((Block) parent.getParent()).statements());
        }

        return true;
    }

    private String getBracePositionInSwitch(Block node, List<Statement> siblings) {
        int blockPosition = siblings.indexOf(node);
        if (blockPosition > 0 && siblings.get(blockPosition - 1)instanceof SwitchCase switchCase) {
            return switchCase.isSwitchLabeledRule() ? "end_of_line" : this.options.brace_position_for_block_in_case;
        }
        return this.options.brace_position_for_block;
    }

    private void blankLinesAroundBlock(ASTNode blockStatement, List<ASTNode> siblings) {
        putBlankLinesBefore(blockStatement, this.options.blank_lines_before_code_block);
        if (!this.options.put_empty_statement_on_new_line) {
            int blockIndex = siblings.indexOf(blockStatement);
            if (blockIndex + 1 < siblings.size() && siblings.get(blockIndex + 1) instanceof EmptyStatement)
                return;
        }
        putBlankLinesAfter(this.tm.lastTokenIn(blockStatement,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid),
            this.options.blank_lines_after_code_block);
    }

    @Override
    public boolean visit(SwitchStatement node) {
        handleBracedCode(node, node.getExpression(), this.options.brace_position_for_switch,
            this.options.indent_switchstatements_compare_to_switch, this.options.blank_lines_at_beginning_of_code_block,
            this.options.blank_lines_at_end_of_code_block);

        List<Statement> statements = node.statements();
        doSwitchStatementsIndentation(node, statements);
        doSwitchStatementsLineBreaks(statements);

        if (node.getParent() instanceof Block)
            blankLinesAroundBlock(node, ((Block) node.getParent()).statements());

        return true;
    }

    @Override
    public boolean visit(SwitchExpression node) {
        handleBracedCode(node, node.getExpression(), this.options.brace_position_for_switch,
            this.options.indent_switchstatements_compare_to_switch, this.options.blank_lines_at_beginning_of_code_block,
            this.options.blank_lines_at_end_of_code_block);

        List<Statement> statements = node.statements();
        doSwitchStatementsIndentation(node, statements);
        doSwitchStatementsLineBreaks(statements);

        return true;
    }

    private void doSwitchStatementsIndentation(ASTNode switchNode, List<Statement> statements) {
        if (this.options.indent_switchstatements_compare_to_cases) {
            int nonBreakStatementEnd = -1;
            for (Statement statement : statements) {
                boolean isBreaking = isSwitchBreakingStatement(statement);
                if (isBreaking && !(statement instanceof Block))
                    adjustEmptyLineAfter(this.tm.lastIndexIn(statement,
                        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid),
                        -1);
                if (statement instanceof SwitchCase) {
                    if (nonBreakStatementEnd >= 0) {
                        // indent only comments between previous and current statement
                        this.tm.get(nonBreakStatementEnd + 1).indent();
                        this.tm.firstTokenIn(statement,
                            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
                            .unindent();
                    }
                } else if (!(statement instanceof BreakStatement
                    || statement instanceof YieldStatement
                    || statement instanceof Block)) {
                    indent(statement);
                }
                nonBreakStatementEnd = isBreaking
                    ? -1
                    : this.tm.lastIndexIn(statement,
                        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
            }
            if (nonBreakStatementEnd >= 0) {
                // indent comments between last statement and closing brace
                this.tm.get(nonBreakStatementEnd + 1).indent();
                this.tm.lastTokenIn(switchNode, TokenNameRBRACE).unindent();
            }
        }
        if (this.options.indent_breaks_compare_to_cases) {
            for (Statement statement : statements) {
                if (statement instanceof BreakStatement || statement instanceof YieldStatement)
                    indent(statement);
            }
        }
    }

    private void doSwitchStatementsLineBreaks(List<Statement> statements) {
        boolean arrowMode
            = statements.stream().anyMatch(s -> s instanceof SwitchCase && ((SwitchCase) s).isSwitchLabeledRule());
        Statement previous = null;
        for (Statement statement : statements) {
            boolean skip = statement instanceof Block // will add break in visit(Block) if necessary
                || (arrowMode && !(statement instanceof SwitchCase))
                || (statement instanceof EmptyStatement && !this.options.put_empty_statement_on_new_line);
            if (!skip) {
                boolean newGroup = !arrowMode && statement instanceof SwitchCase && isSwitchBreakingStatement(previous);
                int blankLines = newGroup ? this.options.blank_lines_between_statement_groups_in_switch : 0;
                putBlankLinesBefore(statement, blankLines);
            }
            previous = statement;
        }
    }

    private boolean isSwitchBreakingStatement(Statement statement) {
        return statement instanceof BreakStatement
            || statement instanceof ReturnStatement
            || statement instanceof ContinueStatement
            || statement instanceof ThrowStatement
            || statement instanceof YieldStatement
            || statement instanceof Block;
    }

    @Override
    public boolean visit(DoStatement node) {
        Statement body = node.getBody();
        boolean sameLine = this.options.keep_simple_do_while_body_on_same_line;
        if (!sameLine)
            handleLoopBody(body);
        if (this.options.insert_new_line_before_while_in_do_statement
            || (!(body instanceof Block) && !(body instanceof EmptyStatement) && !sameLine)) {
            Token whileToken = this.tm.firstTokenBefore(node.getExpression(), TokenNamewhile);
            whileToken.breakBefore();
        }
        return true;
    }

    @Override
    public boolean visit(LabeledStatement node) {
        if (this.options.insert_new_line_after_label)
            this.tm.firstTokenIn(node, TokenNameCOLON).breakAfter();
        return true;
    }

    @Override
    public boolean visit(ArrayInitializer node) {
        int openBraceIndex = this.tm.firstIndexIn(node, TokenNameLBRACE);
        int closeBraceIndex = this.tm.lastIndexIn(node, TokenNameRBRACE);

        boolean isEmpty = openBraceIndex + 1 == closeBraceIndex;
        if (isEmpty) {
            adjustEmptyLineAfter(openBraceIndex, this.options.continuation_indentation_for_array_initializer);
            closeBraceIndex = this.tm.lastIndexIn(node, TokenNameRBRACE);
        }

        Token openBraceToken = this.tm.get(openBraceIndex);
        Token closeBraceToken = this.tm.get(closeBraceIndex);

        if (!(node.getParent() instanceof ArrayInitializer)) {
            Token afterOpenBraceToken = this.tm.get(openBraceIndex + 1);
            for (int i = 0; i < this.options.continuation_indentation_for_array_initializer; i++) {
                afterOpenBraceToken.indent();
                closeBraceToken.unindent();
            }
        }

        if (!isEmpty || !this.options.keep_empty_array_initializer_on_one_line)
            handleBracePosition(openBraceToken, closeBraceIndex, this.options.brace_position_for_array_initializer);

        if (!isEmpty) {
            if (this.options.insert_new_line_after_opening_brace_in_array_initializer)
                openBraceToken.breakAfter();
            if (this.options.insert_new_line_before_closing_brace_in_array_initializer)
                closeBraceToken.breakBefore();
        }
        return true;
    }

    @Override
    public boolean visit(VariableDeclarationStatement node) {
        handleAnnotations(node.modifiers(), this.options.insert_new_line_after_annotation_on_local_variable);
        return true;
    }

    @Override
    public boolean visit(SingleVariableDeclaration node) {
        boolean parameterConfigValue;
        boolean shouldAddNewLine = node.getParent() instanceof MethodDeclaration;
        if (node.getParent() instanceof EnhancedForStatement) {
            parameterConfigValue = this.options.insert_new_line_after_annotation_on_local_variable;
        } else {
            parameterConfigValue = this.options.insert_new_line_after_annotation_on_parameter;
        }
        handleAnnotations(node.modifiers(), parameterConfigValue, shouldAddNewLine);

        return true;
    }

    @Override
    public boolean visit(VariableDeclarationExpression node) {
        handleAnnotations(node.modifiers(), this.options.insert_new_line_after_annotation_on_local_variable);
        return true;
    }

    @Override
    public boolean visit(FieldDeclaration node) {
        handleAnnotations(node.modifiers(), this.options.insert_new_line_after_annotation_on_field);
        return true;
    }

    @Override
    public boolean visit(AnnotationTypeMemberDeclaration node) {
        handleAnnotations(node.modifiers(), this.options.insert_new_line_after_annotation_on_method);
        return true;
    }

    @Override
    public boolean visit(EnumConstantDeclaration node) {
        handleAnnotations(node.modifiers(), this.options.insert_new_line_after_annotation_on_enum_constant);
        return true;
    }

    private void handleAnnotations(List<? extends IExtendedModifier> modifiers, boolean breakAfter) {
        handleAnnotations(modifiers, breakAfter, false);
    }

    private void handleAnnotations(List<? extends IExtendedModifier> modifiers, boolean breakAfter,
        boolean shouldAddNewLines) {
        Annotation last = null;
        int i;
        for (i = 0; i < modifiers.size(); i++) {
            if (modifiers.get(i).isModifier())
                break;
            last = (Annotation) modifiers.get(i);
            if (last != null && breakAfter && shouldAddNewLines) {
                breakLineBefore(last);
                if (i == modifiers.size() - 1)
                    this.tm.lastTokenIn(last,
                        com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
                        .breakAfter();
            }
        }

        if (last != null && breakAfter) {
            this.tm.lastTokenIn(last,
                com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
                .breakAfter();
        }

        if (i < modifiers.size()) {
            // any annotations following other modifiers will be associated with declaration type
            handleAnnotations(modifiers.subList(i + 1, modifiers.size()),
                this.options.insert_new_line_after_type_annotation);
        }
    }

    @Override
    public boolean visit(WhileStatement node) {
        if (!this.options.keep_simple_while_body_on_same_line)
            handleLoopBody(node.getBody());
        return true;
    }

    @Override
    public boolean visit(ForStatement node) {
        if (!this.options.keep_simple_for_body_on_same_line)
            handleLoopBody(node.getBody());
        return true;
    }

    @Override
    public boolean visit(EnhancedForStatement node) {
        if (!this.options.keep_simple_for_body_on_same_line)
            handleLoopBody(node.getBody());
        return true;
    }

    private void handleLoopBody(Statement body) {
        if (body instanceof Block)
            return;
        if (body instanceof EmptyStatement
            && !this.options.put_empty_statement_on_new_line
            && !(body.getParent() instanceof IfStatement))
            return;
        breakLineBefore(body);
        adjustEmptyLineAfter(this.tm.lastIndexIn(body,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid),
            -1);
        indent(body);
    }

    @Override
    public boolean visit(IfStatement node) {
        Statement elseNode = node.getElseStatement();
        Statement thenNode = node.getThenStatement();
        if (elseNode != null) {
            if (this.options.insert_new_line_before_else_in_if_statement || !(thenNode instanceof Block))
                this.tm.firstTokenBefore(elseNode, TokenNameelse).breakBefore();

            boolean keepElseOnSameLine = (this.options.keep_else_statement_on_same_line)
                || (this.options.compact_else_if && (elseNode instanceof IfStatement));
            if (!keepElseOnSameLine)
                handleLoopBody(elseNode);
        }

        boolean keepThenOnSameLine = this.options.keep_then_statement_on_same_line
            || (this.options.keep_simple_if_on_one_line && elseNode == null);
        if (!keepThenOnSameLine)
            handleLoopBody(thenNode);

        return true;
    }

    @Override
    public boolean visit(TryStatement node) {
        if (node.getFinally() != null && this.options.insert_new_line_before_finally_in_try_statement) {
            this.tm.firstTokenBefore(node.getFinally(), TokenNamefinally).breakBefore();
        }
        return true;
    }

    @Override
    public boolean visit(CatchClause node) {
        if (this.options.insert_new_line_before_catch_in_try_statement)
            breakLineBefore(node);
        return true;
    }

    @Override
    public boolean visit(ModuleDeclaration node) {
        // using settings for type declaration and fields for now, add new settings if necessary
        breakLineBefore(node);
        List<ModuleDirective> statements = node.moduleStatements();
        handleBracedCode(node, node.getName(), this.options.brace_position_for_type_declaration,
            this.options.indent_body_declarations_compare_to_type_header,
            statements.isEmpty() ? 0 : this.options.blank_lines_before_first_class_body_declaration,
            statements.isEmpty() ? 0 : this.options.blank_lines_after_last_class_body_declaration);

        ModuleDirective previous = null;
        for (ModuleDirective statement : statements) {
            if (previous != null) {
                boolean cameChunk = previous.getClass().equals(statement.getClass());
                putBlankLinesBefore(statement,
                    cameChunk ? this.options.blank_lines_before_field : this.options.blank_lines_before_new_chunk);
            }
            previous = statement;
        }
        return true;
    }

    @Override
    public boolean visit(TextBlock node) {
        int indentOption = this.options.text_block_indentation;
        if (indentOption == 8)
            return true;
        Token block = this.tm.firstTokenIn(node, TokenNameTextBlock);
        int incidentalWhitespace = Integer.MAX_VALUE;
        ArrayList<Token> lines = new ArrayList<>();
        Token newLine = new Token(block.originalStart, block.originalStart + 2, TokenNameNotAToken); // first line; """
        lines.add(newLine); // first line; """
        int blankLines = -1; // will go to 0 on line break after first line
        int i = block.originalStart + 3;
        while (i <= block.originalEnd) {
            int lineStart = i;
            int firstNonBlank = -1;
            int lastNonBlank = -1;
            while (i <= block.originalEnd) {
                char c = this.tm.charAt(i++);
                if (c == '\r' || c == '\n') {
                    char c2 = this.tm.charAt(i);
                    if ((c2 == '\r' || c2 == '\n') && c2 != c)
                        i++;
                    break;
                }
                if (c != ' ' && c != '\t') {
                    if (firstNonBlank == -1)
                        firstNonBlank = i - 1;
                    lastNonBlank = i - 1;
                }
            }
            if (firstNonBlank != -1) {
                Token line = new Token(lineStart, lastNonBlank, TokenNameNotAToken);
                line.putLineBreaksBefore(blankLines + 1);
                blankLines = 0;
                lines.add(line);
                incidentalWhitespace = Math.min(incidentalWhitespace, firstNonBlank - lineStart);
            } else {
                blankLines++;
            }
        }
        WrapPolicy wrapPolicy = new WrapPolicy(WrapMode.DISABLED, 0, -1, 0, 0, 1, false, false);
        for (i = 1; i < lines.size(); i++) {
            Token t = lines.get(i);
            Token line = new Token(t, t.originalStart + incidentalWhitespace, t.originalEnd, TokenNameTextBlock);
            line.setWrapPolicy(wrapPolicy);
            lines.set(i, line);
            block.setInternalStructure(lines);
        }
        return true;
    }

    private void breakLineBefore(ASTNode node) {
        this.tm.firstTokenIn(node,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid)
            .breakBefore();
    }

    private void putBlankLinesBefore(ASTNode node, int linesCount) {
        int index = this.tm.firstIndexIn(node,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
        while (index > 0 && this.tm.get(index - 1).tokenType == TokenNameCOMMENT_JAVADOC)
            index--;
        putBlankLinesBefore(this.tm.get(index), linesCount);
    }

    private void putBlankLinesBefore(Token token, int linesCount) {
        if (linesCount >= 0) {
            token.putLineBreaksBefore(linesCount + 1);
        } else {
            token.putLineBreaksBefore(~linesCount + 1);
            token.setPreserveLineBreaksBefore(false);
        }
    }

    private void putBlankLinesAfter(Token token, int linesCount) {
        if (linesCount >= 0) {
            token.putLineBreaksAfter(linesCount + 1);
        } else {
            token.putLineBreaksAfter(~linesCount + 1);
            token.setPreserveLineBreaksAfter(false);
        }
    }

    private void handleBracedCode(ASTNode node, ASTNode nodeBeforeOpenBrace, String bracePosition, boolean indentBody) {
        handleBracedCode(node, nodeBeforeOpenBrace, bracePosition, indentBody, 0, 0);
    }

    private void handleBracedCode(ASTNode node, ASTNode nodeBeforeOpenBrace, String bracePosition, boolean indentBody,
        int blankLinesAfterOpeningBrace, int blankLinesBeforeClosingBrace) {
        int openBraceIndex = nodeBeforeOpenBrace == null
            ? this.tm.firstIndexIn(node, TokenNameLBRACE)
            : this.tm.firstIndexAfter(nodeBeforeOpenBrace, TokenNameLBRACE);
        int closeBraceIndex = this.tm.lastIndexIn(node, TokenNameRBRACE);
        Token openBraceToken = this.tm.get(openBraceIndex);
        Token closeBraceToken = this.tm.get(closeBraceIndex);
        handleBracePosition(openBraceToken, closeBraceIndex, bracePosition);

        putBlankLinesAfter(openBraceToken, blankLinesAfterOpeningBrace);
        putBlankLinesBefore(closeBraceToken, blankLinesBeforeClosingBrace);

        if (indentBody) {
            adjustEmptyLineAfter(openBraceIndex, 1);
            this.tm.get(openBraceIndex + 1).indent();
            closeBraceToken.unindent();
        }
    }

    private void handleBracePosition(Token openBraceToken, int closeBraceIndex, String bracePosition) {
        switch (bracePosition) {
            case "next_line" -> openBraceToken.breakBefore();
            case "next_line_shifted" -> {
                openBraceToken.breakBefore();
                openBraceToken.indent();
                if (closeBraceIndex + 1 < this.tm.size())
                    this.tm.get(closeBraceIndex + 1).unindent();
            }
            case "next_line_on_wrap" -> openBraceToken.setNextLineOnWrap();
        }
    }

    private void adjustEmptyLineAfter(int tokenIndex, int indentationAdjustment) {
        if (tokenIndex + 1 >= this.tm.size())
            return;
        Token token = this.tm.get(tokenIndex);
        Token next = this.tm.get(tokenIndex + 1);
        if (this.tm.countLineBreaksBetween(token, next) < 2 || !this.options.indent_empty_lines)
            return;

        next.setEmptyLineIndentAdjustment(indentationAdjustment * this.options.indentation_size);
    }

    private void indent(ASTNode node) {
        int startIndex = this.tm.firstIndexIn(node,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
        while (startIndex > 0 && this.tm.get(startIndex - 1).isComment())
            startIndex--;
        this.tm.get(startIndex).indent();
        int lastIndex = this.tm.lastIndexIn(node,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid);
        if (lastIndex + 1 < this.tm.size())
            this.tm.get(lastIndex + 1).unindent();
    }

    public void finishUp() {
        // the visits only noted where indents increase and decrease,
        // now prepare actual indent values
        int currentIndent = 0;
        for (Token token : this.tm) {
            currentIndent += token.getIndent();
            token.setIndent(currentIndent * this.options.indentation_size);
        }
    }

    @Override
    public boolean visit(ImplicitTypeDeclaration node) {
        handleBodyDeclarations(node.bodyDeclarations());
        return true;
    }
}
