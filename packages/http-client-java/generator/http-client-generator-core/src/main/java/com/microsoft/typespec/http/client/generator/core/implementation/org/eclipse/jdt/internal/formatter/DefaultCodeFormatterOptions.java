// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2023 IBM Corporation and others.
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
 *     Brock Janiczak - Contribution for bug 150741
 *     Ray V. (voidstar@gmail.com) - Contribution for bug 282988
 *     Jesper S Moller - Contribution for bug 402173
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Formatter does not format Java code correctly, especially when max line width is set - https://bugs.eclipse.org/303519
 *     Lars Vogel <Lars.Vogel@vogella.com> - Contributions for
 *     						Bug 473178
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.function.IntConsumer;

/**
 * This is still subject to changes before 3.0.
 *
 * @since 3.0
 */
public class DefaultCodeFormatterOptions {

    public static DefaultCodeFormatterOptions getJavaConventionsSettings() {
        DefaultCodeFormatterOptions options = new DefaultCodeFormatterOptions();
        options.setJavaConventionsSettings();
        return options;
    }

    public int alignment_for_annotations_on_type;
    public int alignment_for_type_annotations;
    public int alignment_for_annotations_on_enum_constant;
    public int alignment_for_annotations_on_field;
    public int alignment_for_annotations_on_method;
    public int alignment_for_annotations_on_package;
    public int alignment_for_annotations_on_parameter;
    public int alignment_for_annotations_on_local_variable;
    public int alignment_for_arguments_in_allocation_expression;
    public int alignment_for_arguments_in_annotation;
    public int alignment_for_arguments_in_enum_constant;
    public int alignment_for_arguments_in_explicit_constructor_call;
    public int alignment_for_arguments_in_method_invocation;
    public int alignment_for_arguments_in_qualified_allocation_expression;
    public int alignment_for_assertion_message;
    public int alignment_for_assignment;
    public int alignment_for_multiplicative_operator;
    public int alignment_for_additive_operator;
    public int alignment_for_string_concatenation;
    public int alignment_for_shift_operator;
    public int alignment_for_relational_operator;
    public int alignment_for_bitwise_operator;
    public int alignment_for_logical_operator;
    public int alignment_for_compact_if;
    public int alignment_for_compact_loop;
    public int alignment_for_conditional_expression;
    public int alignment_for_conditional_expression_chain;
    public int alignment_for_enum_constants;
    public int alignment_for_expressions_in_array_initializer;
    public int alignment_for_expressions_in_for_loop_header;
    public int alignment_for_expressions_in_switch_case_with_arrow;
    public int alignment_for_expressions_in_switch_case_with_colon;
    public int alignment_for_method_declaration;
    public int alignment_for_module_statements;
    // TODO following option cannot be set in preferences dialog (but it's used by old.CodeFormatter)
    public int alignment_for_multiple_fields;
    public int alignment_for_parameterized_type_references;
    public int alignment_for_parameters_in_constructor_declaration;
    public int alignment_for_parameters_in_method_declaration;
    public int alignment_for_permitted_types_in_type_declaration;
    public int alignment_for_record_components;
    public int alignment_for_selector_in_method_invocation;
    public int alignment_for_superclass_in_type_declaration;
    public int alignment_for_superinterfaces_in_enum_declaration;
    public int alignment_for_superinterfaces_in_record_declaration;
    public int alignment_for_superinterfaces_in_type_declaration;
    public int alignment_for_switch_case_with_arrow;
    public int alignment_for_throws_clause_in_constructor_declaration;
    public int alignment_for_throws_clause_in_method_declaration;
    public int alignment_for_type_arguments;
    public int alignment_for_type_parameters;
    public int alignment_for_resources_in_try;
    public int alignment_for_union_type_in_multicatch;
    public boolean align_selector_in_method_invocation_on_expression_first_line;

    public boolean align_type_members_on_columns;
    public boolean align_variable_declarations_on_columns;
    public boolean align_assignment_statements_on_columns;
    public boolean align_arrows_in_switch_on_columns;
    public boolean align_with_spaces;
    public int align_fields_grouping_blank_lines;

    public String brace_position_for_annotation_type_declaration;
    public String brace_position_for_anonymous_type_declaration;
    public String brace_position_for_array_initializer;
    public String brace_position_for_block;
    public String brace_position_for_block_in_case;
    public String brace_position_for_block_in_case_after_arrow;
    public String brace_position_for_constructor_declaration;
    public String brace_position_for_enum_constant;
    public String brace_position_for_enum_declaration;
    public String brace_position_for_lambda_body;
    public String brace_position_for_method_declaration;
    public String brace_position_for_type_declaration;
    public String brace_position_for_record_constructor;
    public String brace_position_for_record_declaration;
    public String brace_position_for_switch;

    public String parenthesis_positions_in_method_declaration;
    public String parenthesis_positions_in_method_invocation;
    public String parenthesis_positions_in_enum_constant_declaration;
    public String parenthesis_positions_in_record_declaration;
    public String parenthesis_positions_in_if_while_statement;
    public String parenthesis_positions_in_for_statement;
    public String parenthesis_positions_in_switch_statement;
    public String parenthesis_positions_in_try_clause;
    public String parenthesis_positions_in_catch_clause;
    public String parenthesis_positions_in_annotation;
    public String parenthesis_positions_in_lambda_declaration;

    public int continuation_indentation;
    public int continuation_indentation_for_array_initializer;

    public int blank_lines_after_imports;
    public int blank_lines_after_package;
    public int blank_lines_before_field;
    public int blank_lines_before_first_class_body_declaration;
    public int blank_lines_after_last_class_body_declaration;
    public int blank_lines_before_imports;
    public int blank_lines_before_member_type;
    public int blank_lines_before_abstract_method;
    public int blank_lines_before_method;
    public int blank_lines_before_new_chunk;
    public int blank_lines_before_package;
    public int blank_lines_between_import_groups;
    public int blank_lines_between_type_declarations;
    public int blank_lines_at_beginning_of_method_body;
    public int blank_lines_at_end_of_method_body;
    public int blank_lines_at_beginning_of_code_block;
    public int blank_lines_at_end_of_code_block;
    public int blank_lines_before_code_block;
    public int blank_lines_after_code_block;
    public int blank_lines_between_statement_groups_in_switch;

    public boolean comment_clear_blank_lines_in_javadoc_comment;
    public boolean comment_clear_blank_lines_in_block_comment;
    public boolean comment_new_lines_at_block_boundaries;
    public boolean comment_new_lines_at_javadoc_boundaries;
    public boolean comment_javadoc_do_not_separate_block_tags;
    public boolean comment_format_javadoc_comment;
    public boolean comment_format_markdown_comment;
    public boolean comment_format_line_comment;
    public boolean comment_format_line_comment_starting_on_first_column;
    public boolean comment_format_block_comment;
    public boolean comment_format_header;
    public boolean comment_format_html;
    public boolean comment_format_source;
    public boolean comment_indent_parameter_description;
    public boolean comment_indent_tag_description;
    public boolean comment_indent_root_tags;
    public boolean comment_align_tags_names_descriptions;
    public boolean comment_align_tags_descriptions_grouped;
    public boolean comment_insert_empty_line_before_root_tags;
    public boolean comment_insert_empty_line_between_different_tags;
    public boolean comment_insert_new_line_for_parameter;
    public boolean comment_preserve_white_space_between_code_and_line_comments;
    public int comment_line_length;
    public boolean comment_count_line_length_from_starting_position;

    public boolean use_tags;
    public char[] disabling_tag;
    public char[] enabling_tag;
    private final static char[] DEFAULT_DISABLING_TAG = "@formatter:off".toCharArray(); //$NON-NLS-1$
    private final static char[] DEFAULT_ENABLING_TAG = "@formatter:on".toCharArray(); //$NON-NLS-1$

    public boolean indent_statements_compare_to_block;
    public boolean indent_statements_compare_to_body;
    public boolean indent_body_declarations_compare_to_annotation_declaration_header;
    public boolean indent_body_declarations_compare_to_enum_constant_header;
    public boolean indent_body_declarations_compare_to_enum_declaration_header;
    public boolean indent_body_declarations_compare_to_record_header;
    public boolean indent_body_declarations_compare_to_type_header;
    public boolean indent_breaks_compare_to_cases;
    public boolean indent_empty_lines;
    public boolean indent_switchstatements_compare_to_cases;
    public boolean indent_switchstatements_compare_to_switch;
    public int indentation_size;

    public boolean insert_new_line_after_annotation_on_type;
    public boolean insert_new_line_after_type_annotation;
    public boolean insert_new_line_after_annotation_on_enum_constant;
    public boolean insert_new_line_after_annotation_on_field;
    public boolean insert_new_line_after_annotation_on_method;
    public boolean insert_new_line_after_annotation_on_package;
    public boolean insert_new_line_after_annotation_on_parameter;
    public boolean insert_new_line_after_annotation_on_record_parameter;
    public boolean insert_new_line_after_annotation_on_local_variable;
    public boolean insert_new_line_after_label;
    public boolean insert_new_line_after_opening_brace_in_array_initializer;
    public boolean insert_new_line_at_end_of_file_if_missing;
    public boolean insert_new_line_before_catch_in_try_statement;
    public boolean insert_new_line_before_closing_brace_in_array_initializer;
    public boolean insert_new_line_before_else_in_if_statement;
    public boolean insert_new_line_before_finally_in_try_statement;
    public boolean insert_new_line_before_while_in_do_statement;

    public String keep_loop_body_block_on_one_line;
    public String keep_if_then_body_block_on_one_line;
    public String keep_switch_body_block_on_one_line;
    public String keep_switch_case_with_arrow_on_one_line;
    public String keep_code_block_on_one_line;
    public String keep_lambda_body_block_on_one_line;
    public String keep_method_body_on_one_line;
    public String keep_type_declaration_on_one_line;
    public String keep_anonymous_type_declaration_on_one_line;
    public String keep_enum_declaration_on_one_line;
    public String keep_enum_constant_declaration_on_one_line;
    public String keep_annotation_declaration_on_one_line;
    public String keep_record_declaration_on_one_line;
    public String keep_record_constructor_on_one_line;
    public boolean keep_simple_getter_setter_on_one_line;

    public boolean insert_space_after_and_in_type_parameter;
    public boolean insert_space_after_arrow_in_switch_case;
    public boolean insert_space_after_arrow_in_switch_default;
    public boolean insert_space_after_assignment_operator;
    public boolean insert_space_after_at_in_annotation;
    public boolean insert_space_after_at_in_annotation_type_declaration;
    public boolean insert_space_after_multiplicative_operator;
    public boolean insert_space_after_additive_operator;
    public boolean insert_space_after_string_concatenation;
    public boolean insert_space_after_shift_operator;
    public boolean insert_space_after_relational_operator;
    public boolean insert_space_after_bitwise_operator;
    public boolean insert_space_after_logical_operator;
    public boolean insert_space_after_closing_angle_bracket_in_type_arguments;
    public boolean insert_space_after_closing_angle_bracket_in_type_parameters;
    public boolean insert_space_after_closing_paren_in_cast;
    public boolean insert_space_after_closing_brace_in_block;
    public boolean insert_space_after_colon_in_assert;
    // TODO field is never used
    public boolean insert_space_after_colon_in_case;
    public boolean insert_space_after_colon_in_conditional;
    public boolean insert_space_after_colon_in_for;
    public boolean insert_space_after_colon_in_labeled_statement;
    public boolean insert_space_after_comma_in_allocation_expression;
    public boolean insert_space_after_comma_in_annotation;
    public boolean insert_space_after_comma_in_array_initializer;
    public boolean insert_space_after_comma_in_constructor_declaration_parameters;
    public boolean insert_space_after_comma_in_constructor_declaration_throws;
    public boolean insert_space_after_comma_in_enum_constant_arguments;
    public boolean insert_space_after_comma_in_enum_declarations;
    public boolean insert_space_after_comma_in_explicit_constructor_call_arguments;
    public boolean insert_space_after_comma_in_for_increments;
    public boolean insert_space_after_comma_in_for_inits;
    public boolean insert_space_after_comma_in_method_invocation_arguments;
    public boolean insert_space_after_comma_in_method_declaration_parameters;
    public boolean insert_space_after_comma_in_method_declaration_throws;
    public boolean insert_space_after_comma_in_multiple_field_declarations;
    public boolean insert_space_after_comma_in_multiple_local_declarations;
    public boolean insert_space_after_comma_in_parameterized_type_reference;
    public boolean insert_space_after_comma_in_permitted_types;
    public boolean insert_space_after_comma_in_record_components;
    public boolean insert_space_after_comma_in_superinterfaces;
    public boolean insert_space_after_comma_in_switch_case_expressions;
    public boolean insert_space_after_comma_in_type_arguments;
    public boolean insert_space_after_comma_in_type_parameters;
    public boolean insert_space_after_ellipsis;
    public boolean insert_space_after_lambda_arrow;
    public boolean insert_space_after_not_operator;
    public boolean insert_space_after_opening_angle_bracket_in_parameterized_type_reference;
    public boolean insert_space_after_opening_angle_bracket_in_type_arguments;
    public boolean insert_space_after_opening_angle_bracket_in_type_parameters;
    public boolean insert_space_after_opening_bracket_in_array_allocation_expression;
    public boolean insert_space_after_opening_bracket_in_array_reference;
    public boolean insert_space_after_opening_brace_in_array_initializer;
    public boolean insert_space_after_opening_paren_in_annotation;
    public boolean insert_space_after_opening_paren_in_cast;
    public boolean insert_space_after_opening_paren_in_catch;
    public boolean insert_space_after_opening_paren_in_constructor_declaration;
    public boolean insert_space_after_opening_paren_in_enum_constant;
    public boolean insert_space_after_opening_paren_in_for;
    public boolean insert_space_after_opening_paren_in_if;
    public boolean insert_space_after_opening_paren_in_method_declaration;
    public boolean insert_space_after_opening_paren_in_method_invocation;
    public boolean insert_space_after_opening_paren_in_parenthesized_expression;
    public boolean insert_space_after_opening_paren_in_record_declaration;
    public boolean insert_space_after_opening_paren_in_switch;
    public boolean insert_space_after_opening_paren_in_synchronized;
    public boolean insert_space_after_opening_paren_in_try;
    public boolean insert_space_after_opening_paren_in_while;
    public boolean insert_space_after_postfix_operator;
    public boolean insert_space_after_prefix_operator;
    public boolean insert_space_after_question_in_conditional;
    public boolean insert_space_after_question_in_wilcard;
    public boolean insert_space_after_semicolon_in_for;
    public boolean insert_space_after_semicolon_in_try_resources;
    public boolean insert_space_after_unary_operator;
    public boolean insert_space_before_and_in_type_parameter;
    public boolean insert_space_before_arrow_in_switch_case;
    public boolean insert_space_before_arrow_in_switch_default;
    public boolean insert_space_before_at_in_annotation_type_declaration;
    public boolean insert_space_before_assignment_operator;
    public boolean insert_space_before_multiplicative_operator;
    public boolean insert_space_before_additive_operator;
    public boolean insert_space_before_string_concatenation;
    public boolean insert_space_before_shift_operator;
    public boolean insert_space_before_relational_operator;
    public boolean insert_space_before_bitwise_operator;
    public boolean insert_space_before_logical_operator;
    public boolean insert_space_before_closing_angle_bracket_in_parameterized_type_reference;
    public boolean insert_space_before_closing_angle_bracket_in_type_arguments;
    public boolean insert_space_before_closing_angle_bracket_in_type_parameters;
    public boolean insert_space_before_closing_brace_in_array_initializer;
    public boolean insert_space_before_closing_bracket_in_array_allocation_expression;
    public boolean insert_space_before_closing_bracket_in_array_reference;
    public boolean insert_space_before_closing_paren_in_annotation;
    public boolean insert_space_before_closing_paren_in_cast;
    public boolean insert_space_before_closing_paren_in_catch;
    public boolean insert_space_before_closing_paren_in_constructor_declaration;
    public boolean insert_space_before_closing_paren_in_enum_constant;
    public boolean insert_space_before_closing_paren_in_for;
    public boolean insert_space_before_closing_paren_in_if;
    public boolean insert_space_before_closing_paren_in_method_declaration;
    public boolean insert_space_before_closing_paren_in_method_invocation;
    public boolean insert_space_before_closing_paren_in_parenthesized_expression;
    public boolean insert_space_before_closing_paren_in_record_declaration;
    public boolean insert_space_before_closing_paren_in_switch;
    public boolean insert_space_before_closing_paren_in_synchronized;
    public boolean insert_space_before_closing_paren_in_try;
    public boolean insert_space_before_closing_paren_in_while;
    public boolean insert_space_before_colon_in_assert;
    public boolean insert_space_before_colon_in_case;
    public boolean insert_space_before_colon_in_conditional;
    public boolean insert_space_before_colon_in_default;
    public boolean insert_space_before_colon_in_for;
    public boolean insert_space_before_colon_in_labeled_statement;
    public boolean insert_space_before_comma_in_allocation_expression;
    public boolean insert_space_before_comma_in_annotation;
    public boolean insert_space_before_comma_in_array_initializer;
    public boolean insert_space_before_comma_in_constructor_declaration_parameters;
    public boolean insert_space_before_comma_in_constructor_declaration_throws;
    public boolean insert_space_before_comma_in_enum_constant_arguments;
    public boolean insert_space_before_comma_in_enum_declarations;
    public boolean insert_space_before_comma_in_explicit_constructor_call_arguments;
    public boolean insert_space_before_comma_in_for_increments;
    public boolean insert_space_before_comma_in_for_inits;
    public boolean insert_space_before_comma_in_method_invocation_arguments;
    public boolean insert_space_before_comma_in_method_declaration_parameters;
    public boolean insert_space_before_comma_in_method_declaration_throws;
    public boolean insert_space_before_comma_in_multiple_field_declarations;
    public boolean insert_space_before_comma_in_multiple_local_declarations;
    public boolean insert_space_before_comma_in_parameterized_type_reference;
    public boolean insert_space_before_comma_in_permitted_types;
    public boolean insert_space_before_comma_in_record_components;
    public boolean insert_space_before_comma_in_superinterfaces;
    public boolean insert_space_before_comma_in_switch_case_expressions;
    public boolean insert_space_before_comma_in_type_arguments;
    public boolean insert_space_before_comma_in_type_parameters;
    public boolean insert_space_before_ellipsis;
    public boolean insert_space_before_lambda_arrow;
    public boolean insert_space_before_parenthesized_expression_in_return;
    public boolean insert_space_before_parenthesized_expression_in_throw;
    public boolean insert_space_before_question_in_wilcard;
    public boolean insert_space_before_opening_angle_bracket_in_parameterized_type_reference;
    public boolean insert_space_before_opening_angle_bracket_in_type_arguments;
    public boolean insert_space_before_opening_angle_bracket_in_type_parameters;
    public boolean insert_space_before_opening_brace_in_annotation_type_declaration;
    public boolean insert_space_before_opening_brace_in_anonymous_type_declaration;
    public boolean insert_space_before_opening_brace_in_array_initializer;
    public boolean insert_space_before_opening_brace_in_block;
    public boolean insert_space_before_opening_brace_in_constructor_declaration;
    public boolean insert_space_before_opening_brace_in_enum_constant;
    public boolean insert_space_before_opening_brace_in_enum_declaration;
    public boolean insert_space_before_opening_brace_in_method_declaration;
    public boolean insert_space_before_opening_brace_in_record_constructor;
    public boolean insert_space_before_opening_brace_in_record_declaration;
    public boolean insert_space_before_opening_brace_in_type_declaration;
    public boolean insert_space_before_opening_bracket_in_array_allocation_expression;
    public boolean insert_space_before_opening_bracket_in_array_reference;
    public boolean insert_space_before_opening_bracket_in_array_type_reference;
    public boolean insert_space_before_opening_paren_in_annotation;
    public boolean insert_space_before_opening_paren_in_annotation_type_member_declaration;
    public boolean insert_space_before_opening_paren_in_catch;
    public boolean insert_space_before_opening_paren_in_constructor_declaration;
    public boolean insert_space_before_opening_paren_in_enum_constant;
    public boolean insert_space_before_opening_paren_in_for;
    public boolean insert_space_before_opening_paren_in_if;
    public boolean insert_space_before_opening_paren_in_method_invocation;
    public boolean insert_space_before_opening_paren_in_method_declaration;
    public boolean insert_space_before_opening_paren_in_record_declaration;
    public boolean insert_space_before_opening_paren_in_switch;
    public boolean insert_space_before_opening_paren_in_try;
    public boolean insert_space_before_opening_brace_in_switch;
    public boolean insert_space_before_opening_paren_in_synchronized;
    public boolean insert_space_before_opening_paren_in_parenthesized_expression;
    public boolean insert_space_before_opening_paren_in_while;
    public boolean insert_space_before_postfix_operator;
    public boolean insert_space_before_prefix_operator;
    public boolean insert_space_before_question_in_conditional;
    public boolean insert_space_before_semicolon;
    public boolean insert_space_before_semicolon_in_for;
    public boolean insert_space_before_semicolon_in_try_resources;
    public boolean insert_space_before_unary_operator;
    public boolean insert_space_between_brackets_in_array_type_reference;
    public boolean insert_space_between_empty_braces_in_array_initializer;
    public boolean insert_space_between_empty_brackets_in_array_allocation_expression;
    public boolean insert_space_between_empty_parens_in_annotation_type_member_declaration;
    public boolean insert_space_between_empty_parens_in_constructor_declaration;
    public boolean insert_space_between_empty_parens_in_enum_constant;
    public boolean insert_space_between_empty_parens_in_method_declaration;
    public boolean insert_space_between_empty_parens_in_method_invocation;
    public boolean compact_else_if;
    public boolean keep_guardian_clause_on_one_line;
    public boolean keep_else_statement_on_same_line;
    public boolean keep_empty_array_initializer_on_one_line;
    public boolean keep_simple_if_on_one_line;
    public boolean keep_then_statement_on_same_line;
    public boolean keep_simple_for_body_on_same_line;
    public boolean keep_simple_while_body_on_same_line;
    public boolean keep_simple_do_while_body_on_same_line;
    public boolean never_indent_block_comments_on_first_column;
    public boolean never_indent_line_comments_on_first_column;
    public int number_of_empty_lines_to_preserve;
    public boolean join_wrapped_lines;
    public boolean join_lines_in_comments;
    public boolean join_line_comments;
    public boolean put_empty_statement_on_new_line;
    public boolean put_text_block_quotes_on_new_line;
    public int tab_size;
    public int page_width;
    public int tab_char;
    public boolean use_tabs_only_for_leading_indentations;
    public int text_block_indentation;
    public boolean wrap_before_multiplicative_operator;
    public boolean wrap_before_additive_operator;
    public boolean wrap_before_assertion_message_operator;
    public boolean wrap_before_string_concatenation;
    public boolean wrap_before_shift_operator;
    public boolean wrap_before_relational_operator;
    public boolean wrap_before_bitwise_operator;
    public boolean wrap_before_logical_operator;
    public boolean wrap_before_or_operator_multicatch;
    public boolean wrap_before_conditional_operator;
    public boolean wrap_before_assignment_operator;
    public boolean wrap_before_switch_case_arrow_operator;
    public boolean wrap_outer_expressions_when_nested;

    public int initial_indentation_level;
    public String line_separator;

    private final static List<String> KEEP_ON_ONE_LINE_VALUES = Arrays.asList("one_line_never", "one_line_if_empty",
        "one_line_if_single_item", "one_line_always", "one_line_preserve");

    private final static List<String> BRACE_POSITION_VALUES
        = Arrays.asList("end_of_line", "next_line", "next_line_shifted", "next_line_on_wrap");

    private final static List<String> PARENTHESIS_POSITION_VALUES
        = Arrays.asList("common_lines", "separate_lines_if_not_empty", "separate_lines_if_wrapped", "separate_lines",
            "separate_lines", "preserve_positions");

    private DefaultCodeFormatterOptions() {
        // cannot be instantiated
    }

    public DefaultCodeFormatterOptions(Map<String, String> settings) {
        setDefaultSettings();
        if (settings == null)
            return;
        set(settings);
    }

    private String getAlignment(int alignment) {
        return Integer.toString(alignment);
    }

    public Map<String, String> getMap() {
        Map<String, String> options = new HashMap<>();
        options.put("org.eclipse.jdt.core.formatter.alignment_for_annotations_on_type",
            getAlignment(this.alignment_for_annotations_on_type));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_type_annotations",
            getAlignment(this.alignment_for_type_annotations));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_annotations_on_enum_constant",
            getAlignment(this.alignment_for_annotations_on_enum_constant));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_annotations_on_field",
            getAlignment(this.alignment_for_annotations_on_field));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_annotations_on_method",
            getAlignment(this.alignment_for_annotations_on_method));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_annotations_on_package",
            getAlignment(this.alignment_for_annotations_on_package));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_annotations_on_parameter",
            getAlignment(this.alignment_for_annotations_on_parameter));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_annotations_on_local_variable",
            getAlignment(this.alignment_for_annotations_on_local_variable));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_allocation_expression",
            getAlignment(this.alignment_for_arguments_in_allocation_expression));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_annotation",
            getAlignment(this.alignment_for_arguments_in_annotation));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_enum_constant",
            getAlignment(this.alignment_for_arguments_in_enum_constant));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_explicit_constructor_call",
            getAlignment(this.alignment_for_arguments_in_explicit_constructor_call));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_method_invocation",
            getAlignment(this.alignment_for_arguments_in_method_invocation));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_qualified_allocation_expression",
            getAlignment(this.alignment_for_arguments_in_qualified_allocation_expression));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_assertion_message",
            getAlignment(this.alignment_for_assertion_message));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_assignment",
            getAlignment(this.alignment_for_assignment));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_multiplicative_operator",
            getAlignment(this.alignment_for_multiplicative_operator));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_additive_operator",
            getAlignment(this.alignment_for_additive_operator));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_string_concatenation",
            getAlignment(this.alignment_for_string_concatenation));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_shift_operator",
            getAlignment(this.alignment_for_shift_operator));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_relational_operator",
            getAlignment(this.alignment_for_relational_operator));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_bitwise_operator",
            getAlignment(this.alignment_for_bitwise_operator));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_logical_operator",
            getAlignment(this.alignment_for_logical_operator));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_compact_if",
            getAlignment(this.alignment_for_compact_if));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_compact_loops",
            getAlignment(this.alignment_for_compact_loop));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_conditional_expression",
            getAlignment(this.alignment_for_conditional_expression));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_conditional_expression_chain",
            getAlignment(this.alignment_for_conditional_expression_chain));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_enum_constants",
            getAlignment(this.alignment_for_enum_constants));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_expressions_in_array_initializer",
            getAlignment(this.alignment_for_expressions_in_array_initializer));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_expressions_in_for_loop_header",
            getAlignment(this.alignment_for_expressions_in_for_loop_header));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_expressions_in_switch_case_with_arrow",
            getAlignment(this.alignment_for_expressions_in_switch_case_with_arrow));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_expressions_in_switch_case_with_colon",
            getAlignment(this.alignment_for_expressions_in_switch_case_with_colon));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_method_declaration",
            getAlignment(this.alignment_for_method_declaration));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_module_statements",
            getAlignment(this.alignment_for_module_statements));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_multiple_fields",
            getAlignment(this.alignment_for_multiple_fields));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_parameterized_type_references",
            getAlignment(this.alignment_for_parameterized_type_references));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_parameters_in_constructor_declaration",
            getAlignment(this.alignment_for_parameters_in_constructor_declaration));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_parameters_in_method_declaration",
            getAlignment(this.alignment_for_parameters_in_method_declaration));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_permitted_types_in_type_declaration",
            getAlignment(this.alignment_for_permitted_types_in_type_declaration));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_record_components",
            getAlignment(this.alignment_for_record_components));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_resources_in_try",
            getAlignment(this.alignment_for_resources_in_try));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_selector_in_method_invocation",
            getAlignment(this.alignment_for_selector_in_method_invocation));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_superclass_in_type_declaration",
            getAlignment(this.alignment_for_superclass_in_type_declaration));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_superinterfaces_in_enum_declaration",
            getAlignment(this.alignment_for_superinterfaces_in_enum_declaration));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_superinterfaces_in_record_declaration",
            getAlignment(this.alignment_for_superinterfaces_in_record_declaration));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_superinterfaces_in_type_declaration",
            getAlignment(this.alignment_for_superinterfaces_in_type_declaration));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_switch_case_with_arrow",
            getAlignment(this.alignment_for_switch_case_with_arrow));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_throws_clause_in_constructor_declaration",
            getAlignment(this.alignment_for_throws_clause_in_constructor_declaration));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_throws_clause_in_method_declaration",
            getAlignment(this.alignment_for_throws_clause_in_method_declaration));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_type_arguments",
            getAlignment(this.alignment_for_type_arguments));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_type_parameters",
            getAlignment(this.alignment_for_type_parameters));
        options.put("org.eclipse.jdt.core.formatter.alignment_for_union_type_in_multicatch",
            getAlignment(this.alignment_for_union_type_in_multicatch));
        options.put("org.eclipse.jdt.core.formatter.align_selector_in_method_invocation_on_expression_first_line",
            this.align_selector_in_method_invocation_on_expression_first_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.align_type_members_on_columns",
            this.align_type_members_on_columns ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.align_variable_declarations_on_columns",
            this.align_variable_declarations_on_columns ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.align_assignment_statements_on_columns",
            this.align_assignment_statements_on_columns ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.align_arrows_in_switch_on_columns",
            this.align_arrows_in_switch_on_columns ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.align_fields_grouping_blank_lines",
            Integer.toString(this.align_fields_grouping_blank_lines));
        options.put("org.eclipse.jdt.core.formatter.align_with_spaces", this.align_with_spaces ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_annotation_type_declaration",
            this.brace_position_for_annotation_type_declaration);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_anonymous_type_declaration",
            this.brace_position_for_anonymous_type_declaration);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_array_initializer",
            this.brace_position_for_array_initializer);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_block", this.brace_position_for_block);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_block_in_case",
            this.brace_position_for_block_in_case);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_block_in_case_after_arrow",
            this.brace_position_for_block_in_case_after_arrow);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_constructor_declaration",
            this.brace_position_for_constructor_declaration);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_enum_constant",
            this.brace_position_for_enum_constant);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_enum_declaration",
            this.brace_position_for_enum_declaration);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_method_declaration",
            this.brace_position_for_method_declaration);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_type_declaration",
            this.brace_position_for_type_declaration);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_lambda_body",
            this.brace_position_for_lambda_body);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_record_constructor",
            this.brace_position_for_record_constructor);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_record_declaration",
            this.brace_position_for_record_declaration);
        options.put("org.eclipse.jdt.core.formatter.brace_position_for_switch", this.brace_position_for_switch);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_method_delcaration",
            this.parenthesis_positions_in_method_declaration);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_method_invocation",
            this.parenthesis_positions_in_method_invocation);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_enum_constant_declaration",
            this.parenthesis_positions_in_enum_constant_declaration);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_record_declaration",
            this.parenthesis_positions_in_record_declaration);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_if_while_statement",
            this.parenthesis_positions_in_if_while_statement);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_for_statment",
            this.parenthesis_positions_in_for_statement);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_switch_statement",
            this.parenthesis_positions_in_switch_statement);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_try_clause",
            this.parenthesis_positions_in_try_clause);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_catch_clause",
            this.parenthesis_positions_in_catch_clause);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_annotation",
            this.parenthesis_positions_in_annotation);
        options.put("org.eclipse.jdt.core.formatter.parentheses_positions_in_lambda_declaration",
            this.parenthesis_positions_in_lambda_declaration);
        options.put("org.eclipse.jdt.core.formatter.comment.clear_blank_lines_in_block_comment",
            this.comment_clear_blank_lines_in_block_comment ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.clear_blank_lines_in_javadoc_comment",
            this.comment_clear_blank_lines_in_javadoc_comment ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.new_lines_at_block_boundaries",
            this.comment_new_lines_at_block_boundaries ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.new_lines_at_javadoc_boundaries",
            this.comment_new_lines_at_javadoc_boundaries ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.javadoc_do_not_separate_block_tags",
            this.comment_javadoc_do_not_separate_block_tags ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.format_block_comments",
            this.comment_format_block_comment ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.format_header",
            this.comment_format_header ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.format_html", this.comment_format_html ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.format_javadoc_comments",
            this.comment_format_javadoc_comment ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.format_markdown_comments",
            this.comment_format_markdown_comment ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.format_line_comments",
            this.comment_format_line_comment ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.format_line_comment_starting_on_first_column",
            this.comment_format_line_comment_starting_on_first_column ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.format_source_code",
            this.comment_format_source ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.indent_parameter_description",
            this.comment_indent_parameter_description ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.indent_tag_description",
            this.comment_indent_tag_description ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.indent_root_tags",
            this.comment_indent_root_tags ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.align_tags_names_descriptions",
            this.comment_align_tags_names_descriptions ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.align_tags_descriptions_grouped",
            this.comment_align_tags_descriptions_grouped ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.insert_new_line_before_root_tags",
            this.comment_insert_empty_line_before_root_tags ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.comment.insert_new_line_between_different_tags",
            this.comment_insert_empty_line_between_different_tags ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.comment.insert_new_line_for_parameter",
            this.comment_insert_new_line_for_parameter ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.comment.preserve_white_space_between_code_and_line_comments",
            this.comment_preserve_white_space_between_code_and_line_comments ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.comment.line_length", Integer.toString(this.comment_line_length));
        options.put("org.eclipse.jdt.core.formatter.comment.count_line_length_from_starting_position",
            this.comment_count_line_length_from_starting_position ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.continuation_indentation",
            Integer.toString(this.continuation_indentation));
        options.put("org.eclipse.jdt.core.formatter.continuation_indentation_for_array_initializer",
            Integer.toString(this.continuation_indentation_for_array_initializer));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_after_imports",
            Integer.toString(this.blank_lines_after_imports));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_after_package",
            Integer.toString(this.blank_lines_after_package));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_before_field",
            Integer.toString(this.blank_lines_before_field));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_before_first_class_body_declaration",
            Integer.toString(this.blank_lines_before_first_class_body_declaration));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_after_last_class_body_declaration",
            Integer.toString(this.blank_lines_after_last_class_body_declaration));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_before_imports",
            Integer.toString(this.blank_lines_before_imports));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_before_member_type",
            Integer.toString(this.blank_lines_before_member_type));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_before_abstract_method",
            Integer.toString(this.blank_lines_before_abstract_method));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_before_method",
            Integer.toString(this.blank_lines_before_method));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_before_new_chunk",
            Integer.toString(this.blank_lines_before_new_chunk));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_before_package",
            Integer.toString(this.blank_lines_before_package));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_between_import_groups",
            Integer.toString(this.blank_lines_between_import_groups));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_between_type_declarations",
            Integer.toString(this.blank_lines_between_type_declarations));
        options.put("org.eclipse.jdt.core.formatter.number_of_blank_lines_at_beginning_of_method_body",
            Integer.toString(this.blank_lines_at_beginning_of_method_body));
        options.put("org.eclipse.jdt.core.formatter.number_of_blank_lines_at_end_of_method_body",
            Integer.toString(this.blank_lines_at_end_of_method_body));
        options.put("org.eclipse.jdt.core.formatter.number_of_blank_lines_at_beginning_of_code_block",
            Integer.toString(this.blank_lines_at_beginning_of_code_block));
        options.put("org.eclipse.jdt.core.formatter.number_of_blank_lines_at_end_of_code_block",
            Integer.toString(this.blank_lines_at_end_of_code_block));
        options.put("org.eclipse.jdt.core.formatter.number_of_blank_lines_before_code_block",
            Integer.toString(this.blank_lines_before_code_block));
        options.put("org.eclipse.jdt.core.formatter.number_of_blank_lines_after_code_block",
            Integer.toString(this.blank_lines_after_code_block));
        options.put("org.eclipse.jdt.core.formatter.blank_lines_between_statement_group_in_switch",
            Integer.toString(this.blank_lines_between_statement_groups_in_switch));
        options.put("org.eclipse.jdt.core.formatter.indent_statements_compare_to_block",
            this.indent_statements_compare_to_block ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indent_statements_compare_to_body",
            this.indent_statements_compare_to_body ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indent_body_declarations_compare_to_annotation_declaration_header",
            this.indent_body_declarations_compare_to_annotation_declaration_header ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indent_body_declarations_compare_to_enum_constant_header",
            this.indent_body_declarations_compare_to_enum_constant_header ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indent_body_declarations_compare_to_enum_declaration_header",
            this.indent_body_declarations_compare_to_enum_declaration_header ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indent_body_declarations_compare_to_record_header",
            this.indent_body_declarations_compare_to_record_header ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indent_body_declarations_compare_to_type_header",
            this.indent_body_declarations_compare_to_type_header ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indent_breaks_compare_to_cases",
            this.indent_breaks_compare_to_cases ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indent_empty_lines", this.indent_empty_lines ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indent_switchstatements_compare_to_cases",
            this.indent_switchstatements_compare_to_cases ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indent_switchstatements_compare_to_switch",
            this.indent_switchstatements_compare_to_switch ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.indentation.size",
            Integer.toString(this.tab_char == 4 ? this.indentation_size : this.tab_size)); // reverse values swapping
                                                                                           // performed by the
                                                                                           // indentation preference
                                                                                           // page
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_type",
            this.insert_new_line_after_annotation_on_type ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_type_annotation",
            this.insert_new_line_after_type_annotation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_enum_constant",
            this.insert_new_line_after_annotation_on_enum_constant ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_field",
            this.insert_new_line_after_annotation_on_field ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_method",
            this.insert_new_line_after_annotation_on_method ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_package",
            this.insert_new_line_after_annotation_on_package ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_parameter",
            this.insert_new_line_after_annotation_on_parameter ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_record_parameter",
            this.insert_new_line_after_annotation_on_record_parameter ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_local_variable",
            this.insert_new_line_after_annotation_on_local_variable ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_opening_brace_in_array_initializer",
            this.insert_new_line_after_opening_brace_in_array_initializer ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_at_end_of_file_if_missing",
            this.insert_new_line_at_end_of_file_if_missing ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_before_catch_in_try_statement",
            this.insert_new_line_before_catch_in_try_statement ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_before_closing_brace_in_array_initializer",
            this.insert_new_line_before_closing_brace_in_array_initializer ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_before_else_in_if_statement",
            this.insert_new_line_before_else_in_if_statement ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_before_finally_in_try_statement",
            this.insert_new_line_before_finally_in_try_statement ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_before_while_in_do_statement",
            this.insert_new_line_before_while_in_do_statement ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.keep_annotation_declaration_on_one_line",
            this.keep_annotation_declaration_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_anonymous_type_declaration_on_one_line",
            this.keep_anonymous_type_declaration_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_if_then_body_block_on_one_line",
            this.keep_if_then_body_block_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_switch_body_block_on_one_line",
            this.keep_switch_body_block_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_switch_case_with_arrow_on_one_line",
            this.keep_switch_case_with_arrow_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_lambda_body_block_on_one_line",
            this.keep_lambda_body_block_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_loop_body_block_on_one_line",
            this.keep_loop_body_block_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_code_block_on_one_line", this.keep_code_block_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_enum_constant_declaration_on_one_line",
            this.keep_enum_constant_declaration_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_enum_declaration_on_one_line",
            this.keep_enum_declaration_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_method_body_on_one_line", this.keep_method_body_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_type_declaration_on_one_line",
            this.keep_type_declaration_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_record_declaration_on_one_line",
            this.keep_record_declaration_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_record_constructor_on_one_line",
            this.keep_record_constructor_on_one_line);
        options.put("org.eclipse.jdt.core.formatter.keep_simple_getter_setter_on_one_line",
            this.keep_simple_getter_setter_on_one_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.insert_new_line_after_label",
            this.insert_new_line_after_label ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_and_in_type_parameter",
            this.insert_space_after_and_in_type_parameter ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_arrow_in_switch_case",
            this.insert_space_after_arrow_in_switch_case ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_arrow_in_switch_default",
            this.insert_space_after_arrow_in_switch_default ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_assignment_operator",
            this.insert_space_after_assignment_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_at_in_annotation",
            this.insert_space_after_at_in_annotation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_at_in_annotation_type_declaration",
            this.insert_space_after_at_in_annotation_type_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_multiplicative_operator",
            this.insert_space_after_multiplicative_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_additive_operator",
            this.insert_space_after_additive_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_string_concatenation",
            this.insert_space_after_string_concatenation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_shift_operator",
            this.insert_space_after_shift_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_relational_operator",
            this.insert_space_after_relational_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_bitwise_operator",
            this.insert_space_after_bitwise_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_logical_operator",
            this.insert_space_after_logical_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_closing_angle_bracket_in_type_arguments",
            this.insert_space_after_closing_angle_bracket_in_type_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_closing_angle_bracket_in_type_parameters",
            this.insert_space_after_closing_angle_bracket_in_type_parameters ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_closing_paren_in_cast",
            this.insert_space_after_closing_paren_in_cast ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_closing_brace_in_block",
            this.insert_space_after_closing_brace_in_block ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_colon_in_assert",
            this.insert_space_after_colon_in_assert ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_colon_in_case",
            this.insert_space_after_colon_in_case ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_colon_in_conditional",
            this.insert_space_after_colon_in_conditional ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_colon_in_for",
            this.insert_space_after_colon_in_for ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_colon_in_labeled_statement",
            this.insert_space_after_colon_in_labeled_statement ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_allocation_expression",
            this.insert_space_after_comma_in_allocation_expression ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_annotation",
            this.insert_space_after_comma_in_annotation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_array_initializer",
            this.insert_space_after_comma_in_array_initializer ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_constructor_declaration_parameters",
            this.insert_space_after_comma_in_constructor_declaration_parameters ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_constructor_declaration_throws",
            this.insert_space_after_comma_in_constructor_declaration_throws ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_enum_constant_arguments",
            this.insert_space_after_comma_in_enum_constant_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_enum_declarations",
            this.insert_space_after_comma_in_enum_declarations ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_explicitconstructorcall_arguments",
            this.insert_space_after_comma_in_explicit_constructor_call_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_for_increments",
            this.insert_space_after_comma_in_for_increments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_for_inits",
            this.insert_space_after_comma_in_for_inits ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_method_invocation_arguments",
            this.insert_space_after_comma_in_method_invocation_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_method_declaration_parameters",
            this.insert_space_after_comma_in_method_declaration_parameters ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_method_declaration_throws",
            this.insert_space_after_comma_in_method_declaration_throws ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_multiple_field_declarations",
            this.insert_space_after_comma_in_multiple_field_declarations ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_multiple_local_declarations",
            this.insert_space_after_comma_in_multiple_local_declarations ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_parameterized_type_reference",
            this.insert_space_after_comma_in_parameterized_type_reference ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_permitted_types",
            this.insert_space_after_comma_in_permitted_types ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_record_components",
            this.insert_space_after_comma_in_record_components ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_superinterfaces",
            this.insert_space_after_comma_in_superinterfaces ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_switch_case_expressions",
            this.insert_space_after_comma_in_switch_case_expressions ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_type_arguments",
            this.insert_space_after_comma_in_type_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_type_parameters",
            this.insert_space_after_comma_in_type_parameters ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_bracket_in_array_allocation_expression",
            this.insert_space_after_opening_bracket_in_array_allocation_expression ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_ellipsis",
            this.insert_space_after_ellipsis ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_lambda_arrow",
            this.insert_space_after_lambda_arrow ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_not_operator",
            this.insert_space_after_not_operator ? "insert" : "do not insert");
        options.put(
            "org.eclipse.jdt.core.formatter.insert_space_after_opening_angle_bracket_in_parameterized_type_reference",
            this.insert_space_after_opening_angle_bracket_in_parameterized_type_reference ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_angle_bracket_in_type_arguments",
            this.insert_space_after_opening_angle_bracket_in_type_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_angle_bracket_in_type_parameters",
            this.insert_space_after_opening_angle_bracket_in_type_parameters ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_bracket_in_array_reference",
            this.insert_space_after_opening_bracket_in_array_reference ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_brace_in_array_initializer",
            this.insert_space_after_opening_brace_in_array_initializer ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_annotation",
            this.insert_space_after_opening_paren_in_annotation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_cast",
            this.insert_space_after_opening_paren_in_cast ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_catch",
            this.insert_space_after_opening_paren_in_catch ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_constructor_declaration",
            this.insert_space_after_opening_paren_in_constructor_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_enum_constant",
            this.insert_space_after_opening_paren_in_enum_constant ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_for",
            this.insert_space_after_opening_paren_in_for ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_if",
            this.insert_space_after_opening_paren_in_if ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_method_declaration",
            this.insert_space_after_opening_paren_in_method_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_method_invocation",
            this.insert_space_after_opening_paren_in_method_invocation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_parenthesized_expression",
            this.insert_space_after_opening_paren_in_parenthesized_expression ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_record_declaration",
            this.insert_space_after_opening_paren_in_record_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_switch",
            this.insert_space_after_opening_paren_in_switch ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_synchronized",
            this.insert_space_after_opening_paren_in_synchronized ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_try",
            this.insert_space_after_opening_paren_in_try ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_while",
            this.insert_space_after_opening_paren_in_while ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_postfix_operator",
            this.insert_space_after_postfix_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_prefix_operator",
            this.insert_space_after_prefix_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_question_in_conditional",
            this.insert_space_after_question_in_conditional ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_question_in_wildcard",
            this.insert_space_after_question_in_wilcard ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_semicolon_in_for",
            this.insert_space_after_semicolon_in_for ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_semicolon_in_try_resources",
            this.insert_space_after_semicolon_in_try_resources ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_after_unary_operator",
            this.insert_space_after_unary_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_and_in_type_parameter",
            this.insert_space_before_and_in_type_parameter ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_arrow_in_switch_case",
            this.insert_space_before_arrow_in_switch_case ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_arrow_in_switch_default",
            this.insert_space_before_arrow_in_switch_default ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_at_in_annotation_type_declaration",
            this.insert_space_before_at_in_annotation_type_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_assignment_operator",
            this.insert_space_before_assignment_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_multiplicative_operator",
            this.insert_space_before_multiplicative_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_additive_operator",
            this.insert_space_before_additive_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_string_concatenation",
            this.insert_space_before_string_concatenation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_shift_operator",
            this.insert_space_before_shift_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_relational_operator",
            this.insert_space_before_relational_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_bitwise_operator",
            this.insert_space_before_bitwise_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_logical_operator",
            this.insert_space_before_logical_operator ? "insert" : "do not insert");
        options.put(
            "org.eclipse.jdt.core.formatter.insert_space_before_closing_angle_bracket_in_parameterized_type_reference",
            this.insert_space_before_closing_angle_bracket_in_parameterized_type_reference
                ? "insert"
                : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_angle_bracket_in_type_arguments",
            this.insert_space_before_closing_angle_bracket_in_type_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_angle_bracket_in_type_parameters",
            this.insert_space_before_closing_angle_bracket_in_type_parameters ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_brace_in_array_initializer",
            this.insert_space_before_closing_brace_in_array_initializer ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_bracket_in_array_allocation_expression",
            this.insert_space_before_closing_bracket_in_array_allocation_expression ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_bracket_in_array_reference",
            this.insert_space_before_closing_bracket_in_array_reference ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_annotation",
            this.insert_space_before_closing_paren_in_annotation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_cast",
            this.insert_space_before_closing_paren_in_cast ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_catch",
            this.insert_space_before_closing_paren_in_catch ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_constructor_declaration",
            this.insert_space_before_closing_paren_in_constructor_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_enum_constant",
            this.insert_space_before_closing_paren_in_enum_constant ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_for",
            this.insert_space_before_closing_paren_in_for ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_if",
            this.insert_space_before_closing_paren_in_if ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_method_declaration",
            this.insert_space_before_closing_paren_in_method_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_method_invocation",
            this.insert_space_before_closing_paren_in_method_invocation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_parenthesized_expression",
            this.insert_space_before_closing_paren_in_parenthesized_expression ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_record_declaration",
            this.insert_space_before_closing_paren_in_record_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_switch",
            this.insert_space_before_closing_paren_in_switch ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_synchronized",
            this.insert_space_before_closing_paren_in_synchronized ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_try",
            this.insert_space_before_closing_paren_in_try ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_while",
            this.insert_space_before_closing_paren_in_while ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_assert",
            this.insert_space_before_colon_in_assert ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_case",
            this.insert_space_before_colon_in_case ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_conditional",
            this.insert_space_before_colon_in_conditional ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_default",
            this.insert_space_before_colon_in_default ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_for",
            this.insert_space_before_colon_in_for ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_labeled_statement",
            this.insert_space_before_colon_in_labeled_statement ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_allocation_expression",
            this.insert_space_before_comma_in_allocation_expression ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_annotation",
            this.insert_space_before_comma_in_annotation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_array_initializer",
            this.insert_space_before_comma_in_array_initializer ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_constructor_declaration_parameters",
            this.insert_space_before_comma_in_constructor_declaration_parameters ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_constructor_declaration_throws",
            this.insert_space_before_comma_in_constructor_declaration_throws ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_enum_constant_arguments",
            this.insert_space_before_comma_in_enum_constant_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_enum_declarations",
            this.insert_space_before_comma_in_enum_declarations ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_explicitconstructorcall_arguments",
            this.insert_space_before_comma_in_explicit_constructor_call_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_for_increments",
            this.insert_space_before_comma_in_for_increments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_for_inits",
            this.insert_space_before_comma_in_for_inits ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_method_invocation_arguments",
            this.insert_space_before_comma_in_method_invocation_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_method_declaration_parameters",
            this.insert_space_before_comma_in_method_declaration_parameters ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_method_declaration_throws",
            this.insert_space_before_comma_in_method_declaration_throws ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_multiple_field_declarations",
            this.insert_space_before_comma_in_multiple_field_declarations ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_multiple_local_declarations",
            this.insert_space_before_comma_in_multiple_local_declarations ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_permitted_types",
            this.insert_space_before_comma_in_permitted_types ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_record_components",
            this.insert_space_before_comma_in_record_components ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_superinterfaces",
            this.insert_space_before_comma_in_superinterfaces ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_switch_case_expressions",
            this.insert_space_before_comma_in_switch_case_expressions ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_type_arguments",
            this.insert_space_before_comma_in_type_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_type_parameters",
            this.insert_space_before_comma_in_type_parameters ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_parameterized_type_reference",
            this.insert_space_before_comma_in_parameterized_type_reference ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_ellipsis",
            this.insert_space_before_ellipsis ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_lambda_arrow",
            this.insert_space_before_lambda_arrow ? "insert" : "do not insert");
        options.put(
            "org.eclipse.jdt.core.formatter.insert_space_before_opening_angle_bracket_in_parameterized_type_reference",
            this.insert_space_before_opening_angle_bracket_in_parameterized_type_reference
                ? "insert"
                : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_angle_bracket_in_type_arguments",
            this.insert_space_before_opening_angle_bracket_in_type_arguments ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_angle_bracket_in_type_parameters",
            this.insert_space_before_opening_angle_bracket_in_type_parameters ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_annotation_type_declaration",
            this.insert_space_before_opening_brace_in_annotation_type_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_anonymous_type_declaration",
            this.insert_space_before_opening_brace_in_anonymous_type_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_array_initializer",
            this.insert_space_before_opening_brace_in_array_initializer ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_block",
            this.insert_space_before_opening_brace_in_block ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_constructor_declaration",
            this.insert_space_before_opening_brace_in_constructor_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_enum_constant",
            this.insert_space_before_opening_brace_in_enum_constant ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_enum_declaration",
            this.insert_space_before_opening_brace_in_enum_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_method_declaration",
            this.insert_space_before_opening_brace_in_method_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_record_constructor",
            this.insert_space_before_opening_brace_in_record_constructor ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_record_declaration",
            this.insert_space_before_opening_brace_in_record_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_type_declaration",
            this.insert_space_before_opening_brace_in_type_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_bracket_in_array_allocation_expression",
            this.insert_space_before_opening_bracket_in_array_allocation_expression ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_bracket_in_array_reference",
            this.insert_space_before_opening_bracket_in_array_reference ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_bracket_in_array_type_reference",
            this.insert_space_before_opening_bracket_in_array_type_reference ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_annotation",
            this.insert_space_before_opening_paren_in_annotation ? "insert" : "do not insert");
        options.put(
            "org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_annotation_type_member_declaration",
            this.insert_space_before_opening_paren_in_annotation_type_member_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_catch",
            this.insert_space_before_opening_paren_in_catch ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_constructor_declaration",
            this.insert_space_before_opening_paren_in_constructor_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_enum_constant",
            this.insert_space_before_opening_paren_in_enum_constant ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_for",
            this.insert_space_before_opening_paren_in_for ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_if",
            this.insert_space_before_opening_paren_in_if ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_method_invocation",
            this.insert_space_before_opening_paren_in_method_invocation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_method_declaration",
            this.insert_space_before_opening_paren_in_method_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_record_declaration",
            this.insert_space_before_opening_paren_in_record_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_switch",
            this.insert_space_before_opening_paren_in_switch ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_switch",
            this.insert_space_before_opening_brace_in_switch ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_synchronized",
            this.insert_space_before_opening_paren_in_synchronized ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_try",
            this.insert_space_before_opening_paren_in_try ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_parenthesized_expression",
            this.insert_space_before_opening_paren_in_parenthesized_expression ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_while",
            this.insert_space_before_opening_paren_in_while ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_parenthesized_expression_in_return",
            this.insert_space_before_parenthesized_expression_in_return ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_parenthesized_expression_in_throw",
            this.insert_space_before_parenthesized_expression_in_throw ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_postfix_operator",
            this.insert_space_before_postfix_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_prefix_operator",
            this.insert_space_before_prefix_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_question_in_conditional",
            this.insert_space_before_question_in_conditional ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_question_in_wildcard",
            this.insert_space_before_question_in_wilcard ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_semicolon",
            this.insert_space_before_semicolon ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_semicolon_in_for",
            this.insert_space_before_semicolon_in_for ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_semicolon_in_try_resources",
            this.insert_space_before_semicolon_in_try_resources ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_before_unary_operator",
            this.insert_space_before_unary_operator ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_between_brackets_in_array_type_reference",
            this.insert_space_between_brackets_in_array_type_reference ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_between_empty_braces_in_array_initializer",
            this.insert_space_between_empty_braces_in_array_initializer ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_between_empty_brackets_in_array_allocation_expression",
            this.insert_space_between_empty_brackets_in_array_allocation_expression ? "insert" : "do not insert");
        options.put(
            "org.eclipse.jdt.core.formatter.insert_space_between_empty_parens_in_annotation_type_member_declaration",
            this.insert_space_between_empty_parens_in_annotation_type_member_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_between_empty_parens_in_constructor_declaration",
            this.insert_space_between_empty_parens_in_constructor_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_between_empty_parens_in_enum_constant",
            this.insert_space_between_empty_parens_in_enum_constant ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_between_empty_parens_in_method_declaration",
            this.insert_space_between_empty_parens_in_method_declaration ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.insert_space_between_empty_parens_in_method_invocation",
            this.insert_space_between_empty_parens_in_method_invocation ? "insert" : "do not insert");
        options.put("org.eclipse.jdt.core.formatter.compact_else_if", this.compact_else_if ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.format_guardian_clause_on_one_line",
            this.keep_guardian_clause_on_one_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.keep_else_statement_on_same_line",
            this.keep_else_statement_on_same_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.keep_empty_array_initializer_on_one_line",
            this.keep_empty_array_initializer_on_one_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.keep_imple_if_on_one_line",
            this.keep_simple_if_on_one_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.keep_then_statement_on_same_line",
            this.keep_then_statement_on_same_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.keep_simple_for_body_on_same_line",
            this.keep_simple_for_body_on_same_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.keep_simple_while_body_on_same_line",
            this.keep_simple_while_body_on_same_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.keep_simple_do_while_body_on_same_line",
            this.keep_simple_do_while_body_on_same_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.never_indent_block_comments_on_first_column",
            this.never_indent_block_comments_on_first_column ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.never_indent_line_comments_on_first_column",
            this.never_indent_line_comments_on_first_column ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.number_of_empty_lines_to_preserve",
            Integer.toString(this.number_of_empty_lines_to_preserve));
        options.put("org.eclipse.jdt.core.formatter.join_wrapped_lines", this.join_wrapped_lines ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.join_lines_in_comments",
            this.join_lines_in_comments ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.join_line_comments", this.join_line_comments ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.put_empty_statement_on_new_line",
            this.put_empty_statement_on_new_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.put_text_block_quotes_on_new_line",
            this.put_text_block_quotes_on_new_line ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.lineSplit", Integer.toString(this.page_width));
        switch (this.tab_char) {
            case 2:
                options.put("org.eclipse.jdt.core.formatter.tabulation.char", "space");
                break;

            case 1:
                options.put("org.eclipse.jdt.core.formatter.tabulation.char", "tab");
                break;

            case 4:
                options.put("org.eclipse.jdt.core.formatter.tabulation.char", "mixed");
                break;
        }
        options.put("org.eclipse.jdt.core.formatter.tabulation.size",
            Integer.toString(this.tab_char == 2 ? this.indentation_size : this.tab_size)); // reverse values swapping
                                                                                           // performed by the
                                                                                           // indentation preference
                                                                                           // page
        options.put("org.eclipse.jdt.core.formatter.use_tabs_only_for_leading_indentations",
            this.use_tabs_only_for_leading_indentations ? "true" : "false");

        int textBlockIndentation = switch (this.text_block_indentation) {
            case 8 -> 3;
            case 4 -> 2;
            case 0 -> 0;
            case 2 -> 1;
            default -> throw new IllegalArgumentException(
                "Invalid text block indentation: " + this.text_block_indentation); //$NON-NLS-1$
        };
        options.put("org.eclipse.jdt.core.formatter.text_block_indentation", Integer.toString(textBlockIndentation));

        options.put("org.eclipse.jdt.core.formatter.wrap_before_multiplicative_operator",
            this.wrap_before_multiplicative_operator ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_additive_operator",
            this.wrap_before_additive_operator ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_assertion_message_operator",
            this.wrap_before_assertion_message_operator ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_string_concatenation",
            this.wrap_before_string_concatenation ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_shift_operator",
            this.wrap_before_shift_operator ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_relational_operator",
            this.wrap_before_relational_operator ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_bitwise_operator",
            this.wrap_before_bitwise_operator ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_logical_operator",
            this.wrap_before_logical_operator ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_or_operator_multicatch",
            this.wrap_before_or_operator_multicatch ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_conditional_operator",
            this.wrap_before_conditional_operator ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_assignment_operator",
            this.wrap_before_assignment_operator ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_before_switch_case_arrow_operator",
            this.wrap_before_switch_case_arrow_operator ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.disabling_tag",
            this.disabling_tag == null ? Util.EMPTY_STRING : new String(this.disabling_tag));
        options.put("org.eclipse.jdt.core.formatter.enabling_tag",
            this.enabling_tag == null ? Util.EMPTY_STRING : new String(this.enabling_tag));
        options.put("org.eclipse.jdt.core.formatter.use_on_off_tags", this.use_tags ? "true" : "false");
        options.put("org.eclipse.jdt.core.formatter.wrap_outer_expressions_when_nested",
            this.wrap_outer_expressions_when_nested ? "true" : "false");
        return options;
    }

    public void set(Map<String, String> settings) {
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_annotations_on_type",
            v -> this.alignment_for_annotations_on_type = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_type_annotations",
            v -> this.alignment_for_type_annotations = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_annotations_on_enum_constant",
            v -> this.alignment_for_annotations_on_enum_constant = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_annotations_on_field",
            v -> this.alignment_for_annotations_on_field = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_annotations_on_method",
            v -> this.alignment_for_annotations_on_method = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_annotations_on_package",
            v -> this.alignment_for_annotations_on_package = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_annotations_on_parameter",
            v -> this.alignment_for_annotations_on_parameter = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_annotations_on_local_variable",
            v -> this.alignment_for_annotations_on_local_variable = v);
        final String alignmentForArgumentsInAllocationExpressionOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_allocation_expression");
        if (alignmentForArgumentsInAllocationExpressionOption != null) {
            try {
                this.alignment_for_arguments_in_allocation_expression
                    = Integer.parseInt(alignmentForArgumentsInAllocationExpressionOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_arguments_in_allocation_expression = 16;
            }
        }
        final String alignmentForArgumentsInAnnotationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_annotation");
        if (alignmentForArgumentsInAnnotationOption != null) {
            try {
                this.alignment_for_arguments_in_annotation = Integer.parseInt(alignmentForArgumentsInAnnotationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_arguments_in_annotation = 0;
            }
        }
        final String alignmentForArgumentsInEnumConstantOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_enum_constant");
        if (alignmentForArgumentsInEnumConstantOption != null) {
            try {
                this.alignment_for_arguments_in_enum_constant
                    = Integer.parseInt(alignmentForArgumentsInEnumConstantOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_arguments_in_enum_constant = 16;
            }
        }
        final String alignmentForArgumentsInExplicitConstructorCallOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_explicit_constructor_call");
        if (alignmentForArgumentsInExplicitConstructorCallOption != null) {
            try {
                this.alignment_for_arguments_in_explicit_constructor_call
                    = Integer.parseInt(alignmentForArgumentsInExplicitConstructorCallOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_arguments_in_explicit_constructor_call = 16;
            }
        }
        final String alignmentForArgumentsInMethodInvocationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_method_invocation");
        if (alignmentForArgumentsInMethodInvocationOption != null) {
            try {
                this.alignment_for_arguments_in_method_invocation
                    = Integer.parseInt(alignmentForArgumentsInMethodInvocationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_arguments_in_method_invocation = 16;
            }
        }
        final String alignmentForArgumentsInQualifiedAllocationExpressionOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_arguments_in_qualified_allocation_expression");
        if (alignmentForArgumentsInQualifiedAllocationExpressionOption != null) {
            try {
                this.alignment_for_arguments_in_qualified_allocation_expression
                    = Integer.parseInt(alignmentForArgumentsInQualifiedAllocationExpressionOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_arguments_in_qualified_allocation_expression = 16;
            }
        }
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_assertion_message",
            v -> this.alignment_for_assertion_message = v);
        final String alignmentForAssignmentOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_assignment");
        if (alignmentForAssignmentOption != null) {
            try {
                this.alignment_for_assignment = Integer.parseInt(alignmentForAssignmentOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_assignment = 48;
            }
        }
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_multiplicative_operator",
            v -> this.alignment_for_multiplicative_operator = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_additive_operator",
            v -> this.alignment_for_additive_operator = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_string_concatenation",
            v -> this.alignment_for_string_concatenation = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_shift_operator",
            v -> this.alignment_for_shift_operator = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_relational_operator",
            v -> this.alignment_for_relational_operator = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_bitwise_operator",
            v -> this.alignment_for_bitwise_operator = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_logical_operator",
            v -> this.alignment_for_logical_operator = v);
        final String alignmentForCompactIfOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_compact_if");
        if (alignmentForCompactIfOption != null) {
            try {
                this.alignment_for_compact_if = Integer.parseInt(alignmentForCompactIfOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_compact_if = 48 | 4;
            }
        }
        final Object alignmentForCompactLoopOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_compact_loops");
        if (alignmentForCompactLoopOption != null)
            this.alignment_for_compact_loop = toInt(alignmentForCompactLoopOption, 48 | 4);

        final String alignmentForConditionalExpressionOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_conditional_expression");
        if (alignmentForConditionalExpressionOption != null) {
            try {
                this.alignment_for_conditional_expression = Integer.parseInt(alignmentForConditionalExpressionOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_conditional_expression = 48;
            }
        }
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_conditional_expression_chain",
            v -> this.alignment_for_conditional_expression_chain = v);
        final String alignmentForEnumConstantsOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_enum_constants");
        if (alignmentForEnumConstantsOption != null) {
            try {
                this.alignment_for_enum_constants = Integer.parseInt(alignmentForEnumConstantsOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_enum_constants = 0;
            }
        }
        final String alignmentForExpressionsInArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_expressions_in_array_initializer");
        if (alignmentForExpressionsInArrayInitializerOption != null) {
            try {
                this.alignment_for_expressions_in_array_initializer
                    = Integer.parseInt(alignmentForExpressionsInArrayInitializerOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_expressions_in_array_initializer = 16;
            }
        }
        final Object alignmentForExpressionsInForLoopOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_expressions_in_for_loop_header");
        if (alignmentForExpressionsInForLoopOption != null)
            this.alignment_for_expressions_in_for_loop_header = toInt(alignmentForExpressionsInForLoopOption, 0);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_expressions_in_switch_case_with_arrow",
            v -> this.alignment_for_expressions_in_switch_case_with_arrow = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_expressions_in_switch_case_with_colon",
            v -> this.alignment_for_expressions_in_switch_case_with_colon = v);

        final String alignmentForMethodDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_method_declaration");
        if (alignmentForMethodDeclarationOption != null) {
            try {
                this.alignment_for_method_declaration = Integer.parseInt(alignmentForMethodDeclarationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_method_declaration = 16;
            }
        }
        final Object alignmentForModuleStatementsOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_module_statements");
        if (alignmentForModuleStatementsOption != null)
            this.alignment_for_module_statements = toInt(alignmentForModuleStatementsOption, 16);

        final String alignmentForMultipleFieldsOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_multiple_fields");
        if (alignmentForMultipleFieldsOption != null) {
            try {
                this.alignment_for_multiple_fields = Integer.parseInt(alignmentForMultipleFieldsOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_multiple_fields = 16;
            }
        }
        final Object alignmentForParameterizeddTypeReferencesOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_parameterized_type_references");
        if (alignmentForParameterizeddTypeReferencesOption != null) {
            this.alignment_for_parameterized_type_references = toInt(alignmentForParameterizeddTypeReferencesOption, 0);
        }
        final String alignmentForParametersInConstructorDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_parameters_in_constructor_declaration");
        if (alignmentForParametersInConstructorDeclarationOption != null) {
            try {
                this.alignment_for_parameters_in_constructor_declaration
                    = Integer.parseInt(alignmentForParametersInConstructorDeclarationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_parameters_in_constructor_declaration = 16;
            }
        }
        final String alignmentForParametersInMethodDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_parameters_in_method_declaration");
        if (alignmentForParametersInMethodDeclarationOption != null) {
            try {
                this.alignment_for_parameters_in_method_declaration
                    = Integer.parseInt(alignmentForParametersInMethodDeclarationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_parameters_in_method_declaration = 16;
            }
        }
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_permitted_types_in_type_declaration",
            v -> this.alignment_for_permitted_types_in_type_declaration = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_record_components",
            v -> this.alignment_for_record_components = v);
        final String alignmentForResourcesInTry
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_resources_in_try");
        if (alignmentForResourcesInTry != null) {
            try {
                this.alignment_for_resources_in_try = Integer.parseInt(alignmentForResourcesInTry);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_resources_in_try = 80;
            }
        }
        final String alignmentForSelectorInMethodInvocationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_selector_in_method_invocation");
        if (alignmentForSelectorInMethodInvocationOption != null) {
            try {
                this.alignment_for_selector_in_method_invocation
                    = Integer.parseInt(alignmentForSelectorInMethodInvocationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_selector_in_method_invocation = 16;
            }
        }
        final String alignmentForSuperclassInTypeDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_superclass_in_type_declaration");
        if (alignmentForSuperclassInTypeDeclarationOption != null) {
            try {
                this.alignment_for_superclass_in_type_declaration
                    = Integer.parseInt(alignmentForSuperclassInTypeDeclarationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_superclass_in_type_declaration = 64;
            }
        }
        final String alignmentForSuperinterfacesInEnumDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_superinterfaces_in_enum_declaration");
        if (alignmentForSuperinterfacesInEnumDeclarationOption != null) {
            try {
                this.alignment_for_superinterfaces_in_enum_declaration
                    = Integer.parseInt(alignmentForSuperinterfacesInEnumDeclarationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_superinterfaces_in_enum_declaration = 64;
            }
        }
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_superinterfaces_in_record_declaration",
            v -> this.alignment_for_superinterfaces_in_record_declaration = v);
        final String alignmentForSuperinterfacesInTypeDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_superinterfaces_in_type_declaration");
        if (alignmentForSuperinterfacesInTypeDeclarationOption != null) {
            try {
                this.alignment_for_superinterfaces_in_type_declaration
                    = Integer.parseInt(alignmentForSuperinterfacesInTypeDeclarationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_superinterfaces_in_type_declaration = 64;
            }
        }
        setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_switch_case_with_arrow",
            v -> this.alignment_for_switch_case_with_arrow = v);
        final String alignmentForThrowsClauseInConstructorDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_throws_clause_in_constructor_declaration");
        if (alignmentForThrowsClauseInConstructorDeclarationOption != null) {
            try {
                this.alignment_for_throws_clause_in_constructor_declaration
                    = Integer.parseInt(alignmentForThrowsClauseInConstructorDeclarationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_throws_clause_in_constructor_declaration = 16;
            }
        }
        final String alignmentForThrowsClauseInMethodDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_throws_clause_in_method_declaration");
        if (alignmentForThrowsClauseInMethodDeclarationOption != null) {
            try {
                this.alignment_for_throws_clause_in_method_declaration
                    = Integer.parseInt(alignmentForThrowsClauseInMethodDeclarationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_throws_clause_in_method_declaration = 16;
            }
        }
        final Object alignmentForTypeArguments
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_type_arguments");
        if (alignmentForTypeArguments != null) {
            this.alignment_for_type_arguments = toInt(alignmentForTypeArguments, 0);
        }
        final Object alignmentForTypeParameters
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_type_parameters");
        if (alignmentForTypeParameters != null) {
            this.alignment_for_type_parameters = toInt(alignmentForTypeParameters, 0);
        }
        final String alignmentForUnionTypeInMulticatch
            = settings.get("org.eclipse.jdt.core.formatter.alignment_for_union_type_in_multicatch");
        if (alignmentForUnionTypeInMulticatch != null) {
            try {
                this.alignment_for_union_type_in_multicatch = Integer.parseInt(alignmentForUnionTypeInMulticatch);
            } catch (NumberFormatException | ClassCastException e) {
                this.alignment_for_union_type_in_multicatch = 16;
            }
        }
        setBoolean(settings,
            "org.eclipse.jdt.core.formatter.align_selector_in_method_invocation_on_expression_first_line", "true",
            v -> this.align_selector_in_method_invocation_on_expression_first_line = v);
        final Object alignTypeMembersOnColumnsOption
            = settings.get("org.eclipse.jdt.core.formatter.align_type_members_on_columns");
        if (alignTypeMembersOnColumnsOption != null) {
            this.align_type_members_on_columns = "true".equals(alignTypeMembersOnColumnsOption);
        }
        final Object alignVariableDeclarationsOnColumnsOption
            = settings.get("org.eclipse.jdt.core.formatter.align_variable_declarations_on_columns");
        if (alignVariableDeclarationsOnColumnsOption != null) {
            this.align_variable_declarations_on_columns = "true".equals(alignVariableDeclarationsOnColumnsOption);
        }
        final Object alignAssignmentStatementsOnColumnsOption
            = settings.get("org.eclipse.jdt.core.formatter.align_assignment_statements_on_columns");
        if (alignAssignmentStatementsOnColumnsOption != null) {
            this.align_assignment_statements_on_columns = "true".equals(alignAssignmentStatementsOnColumnsOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.align_arrows_in_switch_on_columns", "true",
            v -> this.align_arrows_in_switch_on_columns = v);
        final String alignGroupSepartionBlankLinesOption
            = settings.get("org.eclipse.jdt.core.formatter.align_fields_grouping_blank_lines");
        if (alignTypeMembersOnColumnsOption != null) {
            try {
                this.align_fields_grouping_blank_lines = Integer.parseInt(alignGroupSepartionBlankLinesOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.align_fields_grouping_blank_lines = Integer.MAX_VALUE;
            }
        }
        final Object alignWithSpaces = settings.get("org.eclipse.jdt.core.formatter.align_with_spaces");
        if (alignWithSpaces != null) {
            this.align_with_spaces = "true".equals(alignWithSpaces);
        }
        final String bracePositionForAnnotationTypeDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_annotation_type_declaration");
        if (bracePositionForAnnotationTypeDeclarationOption != null) {
            try {
                this.brace_position_for_annotation_type_declaration = bracePositionForAnnotationTypeDeclarationOption;
            } catch (ClassCastException e) {
                this.brace_position_for_annotation_type_declaration = "end_of_line";
            }
        }
        final String bracePositionForAnonymousTypeDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_anonymous_type_declaration");
        if (bracePositionForAnonymousTypeDeclarationOption != null) {
            try {
                this.brace_position_for_anonymous_type_declaration = bracePositionForAnonymousTypeDeclarationOption;
            } catch (ClassCastException e) {
                this.brace_position_for_anonymous_type_declaration = "end_of_line";
            }
        }
        final String bracePositionForArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_array_initializer");
        if (bracePositionForArrayInitializerOption != null) {
            try {
                this.brace_position_for_array_initializer = bracePositionForArrayInitializerOption;
            } catch (ClassCastException e) {
                this.brace_position_for_array_initializer = "end_of_line";
            }
        }
        final String bracePositionForBlockOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_block");
        if (bracePositionForBlockOption != null) {
            try {
                this.brace_position_for_block = bracePositionForBlockOption;
            } catch (ClassCastException e) {
                this.brace_position_for_block = "end_of_line";
            }
        }
        final String bracePositionForBlockInCaseOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_block_in_case");
        if (bracePositionForBlockInCaseOption != null) {
            try {
                this.brace_position_for_block_in_case = bracePositionForBlockInCaseOption;
            } catch (ClassCastException e) {
                this.brace_position_for_block_in_case = "end_of_line";
            }
        }
        setString(settings, "org.eclipse.jdt.core.formatter.brace_position_for_block_in_case_after_arrow",
            BRACE_POSITION_VALUES, v -> this.brace_position_for_block_in_case_after_arrow = v);
        final String bracePositionForConstructorDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_constructor_declaration");
        if (bracePositionForConstructorDeclarationOption != null) {
            try {
                this.brace_position_for_constructor_declaration = bracePositionForConstructorDeclarationOption;
            } catch (ClassCastException e) {
                this.brace_position_for_constructor_declaration = "end_of_line";
            }
        }
        final String bracePositionForEnumConstantOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_enum_constant");
        if (bracePositionForEnumConstantOption != null) {
            try {
                this.brace_position_for_enum_constant = bracePositionForEnumConstantOption;
            } catch (ClassCastException e) {
                this.brace_position_for_enum_constant = "end_of_line";
            }
        }
        final String bracePositionForEnumDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_enum_declaration");
        if (bracePositionForEnumDeclarationOption != null) {
            try {
                this.brace_position_for_enum_declaration = bracePositionForEnumDeclarationOption;
            } catch (ClassCastException e) {
                this.brace_position_for_enum_declaration = "end_of_line";
            }
        }
        final String bracePositionForLambdaDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_lambda_body");
        if (bracePositionForLambdaDeclarationOption != null) {
            try {
                this.brace_position_for_lambda_body = bracePositionForLambdaDeclarationOption;
            } catch (ClassCastException e) {
                this.brace_position_for_lambda_body = "end_of_line";
            }
        }
        final String bracePositionForMethodDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_method_declaration");
        if (bracePositionForMethodDeclarationOption != null) {
            try {
                this.brace_position_for_method_declaration = bracePositionForMethodDeclarationOption;
            } catch (ClassCastException e) {
                this.brace_position_for_method_declaration = "end_of_line";
            }
        }
        setString(settings, "org.eclipse.jdt.core.formatter.brace_position_for_record_constructor",
            BRACE_POSITION_VALUES, v -> this.brace_position_for_record_constructor = v);
        setString(settings, "org.eclipse.jdt.core.formatter.brace_position_for_record_declaration",
            BRACE_POSITION_VALUES, v -> this.brace_position_for_record_declaration = v);
        final String bracePositionForSwitchOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_switch");
        if (bracePositionForSwitchOption != null) {
            try {
                this.brace_position_for_switch = bracePositionForSwitchOption;
            } catch (ClassCastException e) {
                this.brace_position_for_switch = "end_of_line";
            }
        }
        final String bracePositionForTypeDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.brace_position_for_type_declaration");
        if (bracePositionForTypeDeclarationOption != null) {
            try {
                this.brace_position_for_type_declaration = bracePositionForTypeDeclarationOption;
            } catch (ClassCastException e) {
                this.brace_position_for_type_declaration = "end_of_line";
            }
        }

        final Object closingParenPositionInMethodDeclaration
            = settings.get("org.eclipse.jdt.core.formatter.parentheses_positions_in_method_delcaration");
        if (closingParenPositionInMethodDeclaration != null) {
            this.parenthesis_positions_in_method_declaration = toString(closingParenPositionInMethodDeclaration);
        }
        final Object closingParenPositionInMethodInvocation
            = settings.get("org.eclipse.jdt.core.formatter.parentheses_positions_in_method_invocation");
        if (closingParenPositionInMethodInvocation != null) {
            this.parenthesis_positions_in_method_invocation = toString(closingParenPositionInMethodInvocation);
        }
        final Object closingParenPositionInEnumConstantDeclaration
            = settings.get("org.eclipse.jdt.core.formatter.parentheses_positions_in_enum_constant_declaration");
        if (closingParenPositionInEnumConstantDeclaration != null) {
            this.parenthesis_positions_in_enum_constant_declaration
                = toString(closingParenPositionInEnumConstantDeclaration);
        }
        setString(settings, "org.eclipse.jdt.core.formatter.parentheses_positions_in_record_declaration",
            PARENTHESIS_POSITION_VALUES, v -> this.parenthesis_positions_in_record_declaration = v);
        final Object closingParenPositionInIfWhileStatement
            = settings.get("org.eclipse.jdt.core.formatter.parentheses_positions_in_if_while_statement");
        if (closingParenPositionInIfWhileStatement != null) {
            this.parenthesis_positions_in_if_while_statement = toString(closingParenPositionInIfWhileStatement);
        }
        final Object closingParenPositionInForStatement
            = settings.get("org.eclipse.jdt.core.formatter.parentheses_positions_in_for_statment");
        if (closingParenPositionInForStatement != null) {
            this.parenthesis_positions_in_for_statement = toString(closingParenPositionInForStatement);
        }
        final Object closingParenPositionInSwitchStatement
            = settings.get("org.eclipse.jdt.core.formatter.parentheses_positions_in_switch_statement");
        if (closingParenPositionInSwitchStatement != null) {
            this.parenthesis_positions_in_switch_statement = toString(closingParenPositionInSwitchStatement);
        }
        final Object closingParenPositionInTryClause
            = settings.get("org.eclipse.jdt.core.formatter.parentheses_positions_in_try_clause");
        if (closingParenPositionInTryClause != null) {
            this.parenthesis_positions_in_try_clause = toString(closingParenPositionInTryClause);
        }
        final Object closingParenPositionInCatchClause
            = settings.get("org.eclipse.jdt.core.formatter.parentheses_positions_in_catch_clause");
        if (closingParenPositionInCatchClause != null) {
            this.parenthesis_positions_in_catch_clause = toString(closingParenPositionInCatchClause);
        }
        final Object closingParenPositionInAnnotation
            = settings.get("org.eclipse.jdt.core.formatter.parentheses_positions_in_annotation");
        if (closingParenPositionInAnnotation != null) {
            this.parenthesis_positions_in_annotation = toString(closingParenPositionInAnnotation);
        }
        final Object closingParenPositionInLambdaDeclaration
            = settings.get("org.eclipse.jdt.core.formatter.parentheses_positions_in_lambda_declaration");
        if (closingParenPositionInLambdaDeclaration != null) {
            this.parenthesis_positions_in_lambda_declaration = toString(closingParenPositionInLambdaDeclaration);
        }

        final String continuationIndentationOption
            = settings.get("org.eclipse.jdt.core.formatter.continuation_indentation");
        if (continuationIndentationOption != null) {
            try {
                this.continuation_indentation = Integer.parseInt(continuationIndentationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.continuation_indentation = 2;
            }
        }
        final String continuationIndentationForArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.continuation_indentation_for_array_initializer");
        if (continuationIndentationForArrayInitializerOption != null) {
            try {
                this.continuation_indentation_for_array_initializer
                    = Integer.parseInt(continuationIndentationForArrayInitializerOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.continuation_indentation_for_array_initializer = 2;
            }
        }
        final String blankLinesAfterImportsOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_after_imports");
        if (blankLinesAfterImportsOption != null) {
            try {
                this.blank_lines_after_imports = Integer.parseInt(blankLinesAfterImportsOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_after_imports = 0;
            }
        }
        final String blankLinesAfterPackageOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_after_package");
        if (blankLinesAfterPackageOption != null) {
            try {
                this.blank_lines_after_package = Integer.parseInt(blankLinesAfterPackageOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_after_package = 0;
            }
        }
        final String blankLinesBeforeFieldOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_before_field");
        if (blankLinesBeforeFieldOption != null) {
            try {
                this.blank_lines_before_field = Integer.parseInt(blankLinesBeforeFieldOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_before_field = 0;
            }
        }
        final String blankLinesBeforeFirstClassBodyDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_before_first_class_body_declaration");
        if (blankLinesBeforeFirstClassBodyDeclarationOption != null) {
            try {
                this.blank_lines_before_first_class_body_declaration
                    = Integer.parseInt(blankLinesBeforeFirstClassBodyDeclarationOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_before_first_class_body_declaration = 0;
            }
        }
        setInt(settings, "org.eclipse.jdt.core.formatter.blank_lines_after_last_class_body_declaration",
            v -> this.blank_lines_after_last_class_body_declaration = v);
        final String blankLinesBeforeImportsOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_before_imports");
        if (blankLinesBeforeImportsOption != null) {
            try {
                this.blank_lines_before_imports = Integer.parseInt(blankLinesBeforeImportsOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_before_imports = 0;
            }
        }
        final String blankLinesBeforeMemberTypeOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_before_member_type");
        if (blankLinesBeforeMemberTypeOption != null) {
            try {
                this.blank_lines_before_member_type = Integer.parseInt(blankLinesBeforeMemberTypeOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_before_member_type = 0;
            }
        }
        setInt(settings, "org.eclipse.jdt.core.formatter.blank_lines_before_abstract_method",
            v -> this.blank_lines_before_abstract_method = v);
        final String blankLinesBeforeMethodOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_before_method");
        if (blankLinesBeforeMethodOption != null) {
            try {
                this.blank_lines_before_method = Integer.parseInt(blankLinesBeforeMethodOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_before_method = 0;
            }
        }
        final String blankLinesBeforeNewChunkOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_before_new_chunk");
        if (blankLinesBeforeNewChunkOption != null) {
            try {
                this.blank_lines_before_new_chunk = Integer.parseInt(blankLinesBeforeNewChunkOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_before_new_chunk = 0;
            }
        }
        final String blankLinesBeforePackageOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_before_package");
        if (blankLinesBeforePackageOption != null) {
            try {
                this.blank_lines_before_package = Integer.parseInt(blankLinesBeforePackageOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_before_package = 0;
            }
        }
        final String blankLinesBetweenImportGroupsOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_between_import_groups");
        if (blankLinesBetweenImportGroupsOption != null) {
            try {
                this.blank_lines_between_import_groups = Integer.parseInt(blankLinesBetweenImportGroupsOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_between_import_groups = 1;
            }
        }
        final String blankLinesBetweenTypeDeclarationsOption
            = settings.get("org.eclipse.jdt.core.formatter.blank_lines_between_type_declarations");
        if (blankLinesBetweenTypeDeclarationsOption != null) {
            try {
                this.blank_lines_between_type_declarations = Integer.parseInt(blankLinesBetweenTypeDeclarationsOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_between_type_declarations = 0;
            }
        }
        final String blankLinesAtBeginningOfMethodBodyOption
            = settings.get("org.eclipse.jdt.core.formatter.number_of_blank_lines_at_beginning_of_method_body");
        if (blankLinesAtBeginningOfMethodBodyOption != null) {
            try {
                this.blank_lines_at_beginning_of_method_body
                    = Integer.parseInt(blankLinesAtBeginningOfMethodBodyOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.blank_lines_at_beginning_of_method_body = 0;
            }
        }
        setInt(settings, "org.eclipse.jdt.core.formatter.number_of_blank_lines_at_end_of_method_body",
            v -> this.blank_lines_at_end_of_method_body = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.number_of_blank_lines_at_beginning_of_code_block",
            v -> this.blank_lines_at_beginning_of_code_block = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.number_of_blank_lines_at_end_of_code_block",
            v -> this.blank_lines_at_end_of_code_block = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.number_of_blank_lines_before_code_block",
            v -> this.blank_lines_before_code_block = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.number_of_blank_lines_after_code_block",
            v -> this.blank_lines_after_code_block = v);
        setInt(settings, "org.eclipse.jdt.core.formatter.blank_lines_between_statement_group_in_switch",
            v -> this.blank_lines_between_statement_groups_in_switch = v);
        final Object insertNewLineAfterTypeAnnotationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_type_annotation");
        if (insertNewLineAfterTypeAnnotationOption != null) {
            this.insert_new_line_after_type_annotation = "insert".equals(insertNewLineAfterTypeAnnotationOption);
        }
        setDeprecatedOptions(settings);
        final Object commentFormatJavadocCommentOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.format_javadoc_comments");
        if (commentFormatJavadocCommentOption != null) {
            this.comment_format_javadoc_comment = "true".equals(commentFormatJavadocCommentOption);
        }
        final Object commentFormatMarkdownCommentOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.format_markdown_comments");
        if (commentFormatMarkdownCommentOption != null) {
            this.comment_format_markdown_comment = "true".equals(commentFormatMarkdownCommentOption);
        }
        final Object commentFormatBlockCommentOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.format_block_comments");
        if (commentFormatBlockCommentOption != null) {
            this.comment_format_block_comment = "true".equals(commentFormatBlockCommentOption);
        }
        final Object commentFormatLineCommentOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.format_line_comments");
        if (commentFormatLineCommentOption != null) {
            this.comment_format_line_comment = "true".equals(commentFormatLineCommentOption);
        }
        final Object formatLineCommentStartingOnFirstColumnOption
            = settings.get("org.eclipse.jdt.core.formatter.format_line_comment_starting_on_first_column");
        if (formatLineCommentStartingOnFirstColumnOption != null) {
            this.comment_format_line_comment_starting_on_first_column
                = "true".equals(formatLineCommentStartingOnFirstColumnOption);
        }
        final Object commentFormatHeaderOption = settings.get("org.eclipse.jdt.core.formatter.comment.format_header");
        if (commentFormatHeaderOption != null) {
            this.comment_format_header = "true".equals(commentFormatHeaderOption);
        }
        final Object commentFormatHtmlOption = settings.get("org.eclipse.jdt.core.formatter.comment.format_html");
        if (commentFormatHtmlOption != null) {
            this.comment_format_html = "true".equals(commentFormatHtmlOption);
        }
        final Object commentFormatSourceOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.format_source_code");
        if (commentFormatSourceOption != null) {
            this.comment_format_source = "true".equals(commentFormatSourceOption);
        }
        final Object commentIndentParameterDescriptionOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.indent_parameter_description");
        if (commentIndentParameterDescriptionOption != null) {
            this.comment_indent_parameter_description = "true".equals(commentIndentParameterDescriptionOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.comment.indent_tag_description", "true",
            v -> this.comment_indent_tag_description = v);
        final Object commentIndentRootTagsOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.indent_root_tags");
        if (commentIndentRootTagsOption != null) {
            this.comment_indent_root_tags = "true".equals(commentIndentRootTagsOption);
        }
        final Object commentAlignTagsDescriptionsOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.align_tags_names_descriptions");
        if (commentAlignTagsDescriptionsOption != null) {
            this.comment_align_tags_names_descriptions = "true".equals(commentAlignTagsDescriptionsOption);
        }
        final Object commentAlignTagsGroupedOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.align_tags_descriptions_grouped");
        if (commentAlignTagsGroupedOption != null) {
            this.comment_align_tags_descriptions_grouped = "true".equals(commentAlignTagsGroupedOption);
        }
        final Object commentInsertEmptyLineBeforeRootTagsOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.insert_new_line_before_root_tags");
        if (commentInsertEmptyLineBeforeRootTagsOption != null) {
            this.comment_insert_empty_line_before_root_tags
                = "insert".equals(commentInsertEmptyLineBeforeRootTagsOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.comment.insert_new_line_between_different_tags", "insert",
            v -> this.comment_insert_empty_line_between_different_tags = v);
        final Object commentInsertNewLineForParameterOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.insert_new_line_for_parameter");
        if (commentInsertNewLineForParameterOption != null) {
            this.comment_insert_new_line_for_parameter = "insert".equals(commentInsertNewLineForParameterOption);
        }
        final Object commentPreserveWhiteSpaceBetweenCodeAndLineCommentsOption = settings
            .get("org.eclipse.jdt.core.formatter.comment.preserve_white_space_between_code_and_line_comments");
        if (commentPreserveWhiteSpaceBetweenCodeAndLineCommentsOption != null) {
            this.comment_preserve_white_space_between_code_and_line_comments
                = "true".equals(commentPreserveWhiteSpaceBetweenCodeAndLineCommentsOption);
        }
        final String commentLineLengthOption = settings.get("org.eclipse.jdt.core.formatter.comment.line_length");
        if (commentLineLengthOption != null) {
            try {
                this.comment_line_length = Integer.parseInt(commentLineLengthOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.comment_line_length = 80;
            }
        }
        final Object commentCountLineLengthFromStartingPositionOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.count_line_length_from_starting_position");
        if (commentCountLineLengthFromStartingPositionOption != null) {
            this.comment_count_line_length_from_starting_position
                = "true".equals(commentCountLineLengthFromStartingPositionOption);
        }
        final Object commentNewLinesAtBlockBoundariesOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.new_lines_at_block_boundaries");
        if (commentNewLinesAtBlockBoundariesOption != null) {
            this.comment_new_lines_at_block_boundaries = "true".equals(commentNewLinesAtBlockBoundariesOption);
        }
        final Object commentNewLinesAtJavadocBoundariesOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.new_lines_at_javadoc_boundaries");
        if (commentNewLinesAtJavadocBoundariesOption != null) {
            this.comment_new_lines_at_javadoc_boundaries = "true".equals(commentNewLinesAtJavadocBoundariesOption);
        }
        final Object commentJavadocDoNotSeparateBlockTags
            = settings.get("org.eclipse.jdt.core.formatter.comment.javadoc_do_not_separate_block_tags");
        if (commentJavadocDoNotSeparateBlockTags != null) {
            this.comment_javadoc_do_not_separate_block_tags = "true".equals(commentJavadocDoNotSeparateBlockTags);
        }
        final Object indentStatementsCompareToBlockOption
            = settings.get("org.eclipse.jdt.core.formatter.indent_statements_compare_to_block");
        if (indentStatementsCompareToBlockOption != null) {
            this.indent_statements_compare_to_block = "true".equals(indentStatementsCompareToBlockOption);
        }
        final Object indentStatementsCompareToBodyOption
            = settings.get("org.eclipse.jdt.core.formatter.indent_statements_compare_to_body");
        if (indentStatementsCompareToBodyOption != null) {
            this.indent_statements_compare_to_body = "true".equals(indentStatementsCompareToBodyOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.indent_body_declarations_compare_to_record_header", "true",
            v -> this.indent_body_declarations_compare_to_record_header = v);
        final Object indentBodyDeclarationsCompareToAnnotationDeclarationHeaderOption = settings
            .get("org.eclipse.jdt.core.formatter.indent_body_declarations_compare_to_annotation_declaration_header");
        if (indentBodyDeclarationsCompareToAnnotationDeclarationHeaderOption != null) {
            this.indent_body_declarations_compare_to_annotation_declaration_header
                = "true".equals(indentBodyDeclarationsCompareToAnnotationDeclarationHeaderOption);
        }
        final Object indentBodyDeclarationsCompareToEnumConstantHeaderOption
            = settings.get("org.eclipse.jdt.core.formatter.indent_body_declarations_compare_to_enum_constant_header");
        if (indentBodyDeclarationsCompareToEnumConstantHeaderOption != null) {
            this.indent_body_declarations_compare_to_enum_constant_header
                = "true".equals(indentBodyDeclarationsCompareToEnumConstantHeaderOption);
        }
        final Object indentBodyDeclarationsCompareToEnumDeclarationHeaderOption = settings
            .get("org.eclipse.jdt.core.formatter.indent_body_declarations_compare_to_enum_declaration_header");
        if (indentBodyDeclarationsCompareToEnumDeclarationHeaderOption != null) {
            this.indent_body_declarations_compare_to_enum_declaration_header
                = "true".equals(indentBodyDeclarationsCompareToEnumDeclarationHeaderOption);
        }
        final Object indentBodyDeclarationsCompareToTypeHeaderOption
            = settings.get("org.eclipse.jdt.core.formatter.indent_body_declarations_compare_to_type_header");
        if (indentBodyDeclarationsCompareToTypeHeaderOption != null) {
            this.indent_body_declarations_compare_to_type_header
                = "true".equals(indentBodyDeclarationsCompareToTypeHeaderOption);
        }
        final Object indentBreaksCompareToCasesOption
            = settings.get("org.eclipse.jdt.core.formatter.indent_breaks_compare_to_cases");
        if (indentBreaksCompareToCasesOption != null) {
            this.indent_breaks_compare_to_cases = "true".equals(indentBreaksCompareToCasesOption);
        }
        final Object indentEmptyLinesOption = settings.get("org.eclipse.jdt.core.formatter.indent_empty_lines");
        if (indentEmptyLinesOption != null) {
            this.indent_empty_lines = "true".equals(indentEmptyLinesOption);
        }
        final Object indentSwitchstatementsCompareToCasesOption
            = settings.get("org.eclipse.jdt.core.formatter.indent_switchstatements_compare_to_cases");
        if (indentSwitchstatementsCompareToCasesOption != null) {
            this.indent_switchstatements_compare_to_cases = "true".equals(indentSwitchstatementsCompareToCasesOption);
        }
        final Object indentSwitchstatementsCompareToSwitchOption
            = settings.get("org.eclipse.jdt.core.formatter.indent_switchstatements_compare_to_switch");
        if (indentSwitchstatementsCompareToSwitchOption != null) {
            this.indent_switchstatements_compare_to_switch = "true".equals(indentSwitchstatementsCompareToSwitchOption);
        }
        final String indentationSizeOption = settings.get("org.eclipse.jdt.core.formatter.indentation.size");
        if (indentationSizeOption != null) {
            int indentationSize = 4;
            try {
                indentationSize = Integer.parseInt(indentationSizeOption);
            } catch (NumberFormatException | ClassCastException e) {
                // keep default
            }
            // reverse values swapping performed by the indentation preference page
            if ("mixed".equals(settings.get("org.eclipse.jdt.core.formatter.tabulation.char")))
                this.indentation_size = indentationSize;
            else if ("space".equals(settings.get("org.eclipse.jdt.core.formatter.tabulation.char")))
                this.tab_size = indentationSize;
        }
        final Object insertNewLineAfterOpeningBraceInArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_opening_brace_in_array_initializer");
        if (insertNewLineAfterOpeningBraceInArrayInitializerOption != null) {
            this.insert_new_line_after_opening_brace_in_array_initializer
                = "insert".equals(insertNewLineAfterOpeningBraceInArrayInitializerOption);
        }
        final Object insertNewLineAtEndOfFileIfMissingOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_at_end_of_file_if_missing");
        if (insertNewLineAtEndOfFileIfMissingOption != null) {
            this.insert_new_line_at_end_of_file_if_missing = "insert".equals(insertNewLineAtEndOfFileIfMissingOption);
        }
        final Object insertNewLineBeforeCatchInTryStatementOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_before_catch_in_try_statement");
        if (insertNewLineBeforeCatchInTryStatementOption != null) {
            this.insert_new_line_before_catch_in_try_statement
                = "insert".equals(insertNewLineBeforeCatchInTryStatementOption);
        }
        final Object insertNewLineBeforeClosingBraceInArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_before_closing_brace_in_array_initializer");
        if (insertNewLineBeforeClosingBraceInArrayInitializerOption != null) {
            this.insert_new_line_before_closing_brace_in_array_initializer
                = "insert".equals(insertNewLineBeforeClosingBraceInArrayInitializerOption);
        }
        final Object insertNewLineBeforeElseInIfStatementOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_before_else_in_if_statement");
        if (insertNewLineBeforeElseInIfStatementOption != null) {
            this.insert_new_line_before_else_in_if_statement
                = "insert".equals(insertNewLineBeforeElseInIfStatementOption);
        }
        final Object insertNewLineBeforeFinallyInTryStatementOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_before_finally_in_try_statement");
        if (insertNewLineBeforeFinallyInTryStatementOption != null) {
            this.insert_new_line_before_finally_in_try_statement
                = "insert".equals(insertNewLineBeforeFinallyInTryStatementOption);
        }
        final Object insertNewLineBeforeWhileInDoStatementOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_before_while_in_do_statement");
        if (insertNewLineBeforeWhileInDoStatementOption != null) {
            this.insert_new_line_before_while_in_do_statement
                = "insert".equals(insertNewLineBeforeWhileInDoStatementOption);
        }

        setString(settings, "org.eclipse.jdt.core.formatter.keep_annotation_declaration_on_one_line",
            KEEP_ON_ONE_LINE_VALUES, v -> this.keep_annotation_declaration_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_anonymous_type_declaration_on_one_line",
            KEEP_ON_ONE_LINE_VALUES, v -> this.keep_anonymous_type_declaration_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_if_then_body_block_on_one_line",
            KEEP_ON_ONE_LINE_VALUES, v -> this.keep_if_then_body_block_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_switch_body_block_on_one_line",
            KEEP_ON_ONE_LINE_VALUES, v -> this.keep_switch_body_block_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_switch_case_with_arrow_on_one_line",
            KEEP_ON_ONE_LINE_VALUES, v -> this.keep_switch_case_with_arrow_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_loop_body_block_on_one_line", KEEP_ON_ONE_LINE_VALUES,
            v -> this.keep_loop_body_block_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_lambda_body_block_on_one_line",
            KEEP_ON_ONE_LINE_VALUES, v -> this.keep_lambda_body_block_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_code_block_on_one_line",
            Arrays.asList("one_line_never", "one_line_if_empty"), v -> this.keep_code_block_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_enum_constant_declaration_on_one_line",
            KEEP_ON_ONE_LINE_VALUES, v -> this.keep_enum_constant_declaration_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_enum_declaration_on_one_line", KEEP_ON_ONE_LINE_VALUES,
            v -> this.keep_enum_declaration_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_method_body_on_one_line", KEEP_ON_ONE_LINE_VALUES,
            v -> this.keep_method_body_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_type_declaration_on_one_line", KEEP_ON_ONE_LINE_VALUES,
            v -> this.keep_type_declaration_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_record_declaration_on_one_line",
            KEEP_ON_ONE_LINE_VALUES, v -> this.keep_record_declaration_on_one_line = v);
        setString(settings, "org.eclipse.jdt.core.formatter.keep_record_constructor_on_one_line",
            KEEP_ON_ONE_LINE_VALUES, v -> this.keep_record_constructor_on_one_line = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.keep_simple_getter_setter_on_one_line", "true",
            v -> this.keep_simple_getter_setter_on_one_line = v);

        final Object insertNewLineAfterLabelOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_label");
        if (insertNewLineAfterLabelOption != null) {
            this.insert_new_line_after_label = "insert".equals(insertNewLineAfterLabelOption);
        }
        final Object insertSpaceAfterAndInWildcardOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_and_in_type_parameter");
        if (insertSpaceAfterAndInWildcardOption != null) {
            this.insert_space_after_and_in_type_parameter = "insert".equals(insertSpaceAfterAndInWildcardOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_arrow_in_switch_case", "insert",
            v -> this.insert_space_after_arrow_in_switch_case = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_arrow_in_switch_default", "insert",
            v -> this.insert_space_after_arrow_in_switch_default = v);
        final Object insertSpaceAfterAssignmentOperatorOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_assignment_operator");
        if (insertSpaceAfterAssignmentOperatorOption != null) {
            this.insert_space_after_assignment_operator = "insert".equals(insertSpaceAfterAssignmentOperatorOption);
        }
        final Object insertSpaceAfterAtInAnnotationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_at_in_annotation");
        if (insertSpaceAfterAtInAnnotationOption != null) {
            this.insert_space_after_at_in_annotation = "insert".equals(insertSpaceAfterAtInAnnotationOption);
        }
        final Object insertSpaceAfterAtInAnnotationTypeDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_at_in_annotation_type_declaration");
        if (insertSpaceAfterAtInAnnotationTypeDeclarationOption != null) {
            this.insert_space_after_at_in_annotation_type_declaration
                = "insert".equals(insertSpaceAfterAtInAnnotationTypeDeclarationOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_multiplicative_operator", "insert",
            v -> this.insert_space_after_multiplicative_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_additive_operator", "insert",
            v -> this.insert_space_after_additive_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_string_concatenation", "insert",
            v -> this.insert_space_after_string_concatenation = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_shift_operator", "insert",
            v -> this.insert_space_after_shift_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_relational_operator", "insert",
            v -> this.insert_space_after_relational_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_bitwise_operator", "insert",
            v -> this.insert_space_after_bitwise_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_logical_operator", "insert",
            v -> this.insert_space_after_logical_operator = v);
        final Object insertSpaceAfterClosingAngleBracketInTypeArgumentsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_closing_angle_bracket_in_type_arguments");
        if (insertSpaceAfterClosingAngleBracketInTypeArgumentsOption != null) {
            this.insert_space_after_closing_angle_bracket_in_type_arguments
                = "insert".equals(insertSpaceAfterClosingAngleBracketInTypeArgumentsOption);
        }
        final Object insertSpaceAfterClosingAngleBracketInTypeParametersOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_after_closing_angle_bracket_in_type_parameters");
        if (insertSpaceAfterClosingAngleBracketInTypeParametersOption != null) {
            this.insert_space_after_closing_angle_bracket_in_type_parameters
                = "insert".equals(insertSpaceAfterClosingAngleBracketInTypeParametersOption);
        }
        final Object insertSpaceAfterClosingParenInCastOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_closing_paren_in_cast");
        if (insertSpaceAfterClosingParenInCastOption != null) {
            this.insert_space_after_closing_paren_in_cast = "insert".equals(insertSpaceAfterClosingParenInCastOption);
        }
        final Object insertSpaceAfterClosingBraceInBlockOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_closing_brace_in_block");
        if (insertSpaceAfterClosingBraceInBlockOption != null) {
            this.insert_space_after_closing_brace_in_block = "insert".equals(insertSpaceAfterClosingBraceInBlockOption);
        }
        final Object insertSpaceAfterColonInAssertOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_colon_in_assert");
        if (insertSpaceAfterColonInAssertOption != null) {
            this.insert_space_after_colon_in_assert = "insert".equals(insertSpaceAfterColonInAssertOption);
        }
        final Object insertSpaceAfterColonInCaseOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_colon_in_case");
        if (insertSpaceAfterColonInCaseOption != null) {
            this.insert_space_after_colon_in_case = "insert".equals(insertSpaceAfterColonInCaseOption);
        }
        final Object insertSpaceAfterColonInConditionalOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_colon_in_conditional");
        if (insertSpaceAfterColonInConditionalOption != null) {
            this.insert_space_after_colon_in_conditional = "insert".equals(insertSpaceAfterColonInConditionalOption);
        }
        final Object insertSpaceAfterColonInForOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_colon_in_for");
        if (insertSpaceAfterColonInForOption != null) {
            this.insert_space_after_colon_in_for = "insert".equals(insertSpaceAfterColonInForOption);
        }
        final Object insertSpaceAfterColonInLabeledStatementOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_colon_in_labeled_statement");
        if (insertSpaceAfterColonInLabeledStatementOption != null) {
            this.insert_space_after_colon_in_labeled_statement
                = "insert".equals(insertSpaceAfterColonInLabeledStatementOption);
        }
        final Object insertSpaceAfterCommaInAllocationExpressionOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_allocation_expression");
        if (insertSpaceAfterCommaInAllocationExpressionOption != null) {
            this.insert_space_after_comma_in_allocation_expression
                = "insert".equals(insertSpaceAfterCommaInAllocationExpressionOption);
        }
        final Object insertSpaceAfterCommaInAnnotationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_annotation");
        if (insertSpaceAfterCommaInAnnotationOption != null) {
            this.insert_space_after_comma_in_annotation = "insert".equals(insertSpaceAfterCommaInAnnotationOption);
        }
        final Object insertSpaceAfterCommaInArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_array_initializer");
        if (insertSpaceAfterCommaInArrayInitializerOption != null) {
            this.insert_space_after_comma_in_array_initializer
                = "insert".equals(insertSpaceAfterCommaInArrayInitializerOption);
        }
        final Object insertSpaceAfterCommaInConstructorDeclarationParametersOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_constructor_declaration_parameters");
        if (insertSpaceAfterCommaInConstructorDeclarationParametersOption != null) {
            this.insert_space_after_comma_in_constructor_declaration_parameters
                = "insert".equals(insertSpaceAfterCommaInConstructorDeclarationParametersOption);
        }
        final Object insertSpaceAfterCommaInConstructorDeclarationThrowsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_constructor_declaration_throws");
        if (insertSpaceAfterCommaInConstructorDeclarationThrowsOption != null) {
            this.insert_space_after_comma_in_constructor_declaration_throws
                = "insert".equals(insertSpaceAfterCommaInConstructorDeclarationThrowsOption);
        }
        final Object insertSpaceAfterCommaInEnumConstantArgumentsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_enum_constant_arguments");
        if (insertSpaceAfterCommaInEnumConstantArgumentsOption != null) {
            this.insert_space_after_comma_in_enum_constant_arguments
                = "insert".equals(insertSpaceAfterCommaInEnumConstantArgumentsOption);
        }
        final Object insertSpaceAfterCommaInEnumDeclarationsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_enum_declarations");
        if (insertSpaceAfterCommaInEnumDeclarationsOption != null) {
            this.insert_space_after_comma_in_enum_declarations
                = "insert".equals(insertSpaceAfterCommaInEnumDeclarationsOption);
        }
        final Object insertSpaceAfterCommaInExplicitConstructorCallArgumentsOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_explicitconstructorcall_arguments");
        if (insertSpaceAfterCommaInExplicitConstructorCallArgumentsOption != null) {
            this.insert_space_after_comma_in_explicit_constructor_call_arguments
                = "insert".equals(insertSpaceAfterCommaInExplicitConstructorCallArgumentsOption);
        }
        final Object insertSpaceAfterCommaInForIncrementsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_for_increments");
        if (insertSpaceAfterCommaInForIncrementsOption != null) {
            this.insert_space_after_comma_in_for_increments
                = "insert".equals(insertSpaceAfterCommaInForIncrementsOption);
        }
        final Object insertSpaceAfterCommaInForInitsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_for_inits");
        if (insertSpaceAfterCommaInForInitsOption != null) {
            this.insert_space_after_comma_in_for_inits = "insert".equals(insertSpaceAfterCommaInForInitsOption);
        }
        final Object insertSpaceAfterCommaInMethodInvocationArgumentsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_method_invocation_arguments");
        if (insertSpaceAfterCommaInMethodInvocationArgumentsOption != null) {
            this.insert_space_after_comma_in_method_invocation_arguments
                = "insert".equals(insertSpaceAfterCommaInMethodInvocationArgumentsOption);
        }
        final Object insertSpaceAfterCommaInMethodDeclarationParametersOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_method_declaration_parameters");
        if (insertSpaceAfterCommaInMethodDeclarationParametersOption != null) {
            this.insert_space_after_comma_in_method_declaration_parameters
                = "insert".equals(insertSpaceAfterCommaInMethodDeclarationParametersOption);
        }
        final Object insertSpaceAfterCommaInMethodDeclarationThrowsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_method_declaration_throws");
        if (insertSpaceAfterCommaInMethodDeclarationThrowsOption != null) {
            this.insert_space_after_comma_in_method_declaration_throws
                = "insert".equals(insertSpaceAfterCommaInMethodDeclarationThrowsOption);
        }
        final Object insertSpaceAfterCommaInMultipleFieldDeclarationsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_multiple_field_declarations");
        if (insertSpaceAfterCommaInMultipleFieldDeclarationsOption != null) {
            this.insert_space_after_comma_in_multiple_field_declarations
                = "insert".equals(insertSpaceAfterCommaInMultipleFieldDeclarationsOption);
        }
        final Object insertSpaceAfterCommaInMultipleLocalDeclarationsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_multiple_local_declarations");
        if (insertSpaceAfterCommaInMultipleLocalDeclarationsOption != null) {
            this.insert_space_after_comma_in_multiple_local_declarations
                = "insert".equals(insertSpaceAfterCommaInMultipleLocalDeclarationsOption);
        }
        final Object insertSpaceAfterCommaInParameterizedTypeReferenceOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_parameterized_type_reference");
        if (insertSpaceAfterCommaInParameterizedTypeReferenceOption != null) {
            this.insert_space_after_comma_in_parameterized_type_reference
                = "insert".equals(insertSpaceAfterCommaInParameterizedTypeReferenceOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_comma_in_permitted_types", "insert",
            v -> this.insert_space_after_comma_in_permitted_types = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_comma_in_record_components", "insert",
            v -> this.insert_space_after_comma_in_record_components = v);
        final Object insertSpaceAfterCommaInSuperinterfacesOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_superinterfaces");
        if (insertSpaceAfterCommaInSuperinterfacesOption != null) {
            this.insert_space_after_comma_in_superinterfaces
                = "insert".equals(insertSpaceAfterCommaInSuperinterfacesOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_comma_in_switch_case_expressions",
            "insert", v -> this.insert_space_after_comma_in_switch_case_expressions = v);
        final Object insertSpaceAfterCommaInTypeArgumentsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_type_arguments");
        if (insertSpaceAfterCommaInTypeArgumentsOption != null) {
            this.insert_space_after_comma_in_type_arguments
                = "insert".equals(insertSpaceAfterCommaInTypeArgumentsOption);
        }
        final Object insertSpaceAfterCommaInTypeParametersOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_comma_in_type_parameters");
        if (insertSpaceAfterCommaInTypeParametersOption != null) {
            this.insert_space_after_comma_in_type_parameters
                = "insert".equals(insertSpaceAfterCommaInTypeParametersOption);
        }
        final Object insertSpaceAfterEllipsisOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_ellipsis");
        if (insertSpaceAfterEllipsisOption != null) {
            this.insert_space_after_ellipsis = "insert".equals(insertSpaceAfterEllipsisOption);
        }
        final Object insertSpaceAfterLambdaArrowOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_lambda_arrow");
        if (insertSpaceAfterLambdaArrowOption != null) {
            this.insert_space_after_lambda_arrow = "insert".equals(insertSpaceAfterLambdaArrowOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_not_operator", "insert",
            v -> this.insert_space_after_not_operator = v);
        final Object insertSpaceAfterOpeningAngleBracketInParameterizedTypeReferenceOption = settings.get(
            "org.eclipse.jdt.core.formatter.insert_space_after_opening_angle_bracket_in_parameterized_type_reference");
        if (insertSpaceAfterOpeningAngleBracketInParameterizedTypeReferenceOption != null) {
            this.insert_space_after_opening_angle_bracket_in_parameterized_type_reference
                = "insert".equals(insertSpaceAfterOpeningAngleBracketInParameterizedTypeReferenceOption);
        }
        final Object insertSpaceAfterOpeningAngleBracketInTypeArgumentsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_angle_bracket_in_type_arguments");
        if (insertSpaceAfterOpeningAngleBracketInTypeArgumentsOption != null) {
            this.insert_space_after_opening_angle_bracket_in_type_arguments
                = "insert".equals(insertSpaceAfterOpeningAngleBracketInTypeArgumentsOption);
        }
        final Object insertSpaceAfterOpeningAngleBracketInTypeParametersOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_after_opening_angle_bracket_in_type_parameters");
        if (insertSpaceAfterOpeningAngleBracketInTypeParametersOption != null) {
            this.insert_space_after_opening_angle_bracket_in_type_parameters
                = "insert".equals(insertSpaceAfterOpeningAngleBracketInTypeParametersOption);
        }
        final Object insertSpaceAfterOpeningBracketInArrayAllocationExpressionOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_after_opening_bracket_in_array_allocation_expression");
        if (insertSpaceAfterOpeningBracketInArrayAllocationExpressionOption != null) {
            this.insert_space_after_opening_bracket_in_array_allocation_expression
                = "insert".equals(insertSpaceAfterOpeningBracketInArrayAllocationExpressionOption);
        }
        final Object insertSpaceAfterOpeningBracketInArrayReferenceOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_bracket_in_array_reference");
        if (insertSpaceAfterOpeningBracketInArrayReferenceOption != null) {
            this.insert_space_after_opening_bracket_in_array_reference
                = "insert".equals(insertSpaceAfterOpeningBracketInArrayReferenceOption);
        }
        final Object insertSpaceAfterOpeningBraceInArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_brace_in_array_initializer");
        if (insertSpaceAfterOpeningBraceInArrayInitializerOption != null) {
            this.insert_space_after_opening_brace_in_array_initializer
                = "insert".equals(insertSpaceAfterOpeningBraceInArrayInitializerOption);
        }
        final Object insertSpaceAfterOpeningParenInAnnotationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_annotation");
        if (insertSpaceAfterOpeningParenInAnnotationOption != null) {
            this.insert_space_after_opening_paren_in_annotation
                = "insert".equals(insertSpaceAfterOpeningParenInAnnotationOption);
        }
        final Object insertSpaceAfterOpeningParenInCastOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_cast");
        if (insertSpaceAfterOpeningParenInCastOption != null) {
            this.insert_space_after_opening_paren_in_cast = "insert".equals(insertSpaceAfterOpeningParenInCastOption);
        }
        final Object insertSpaceAfterOpeningParenInCatchOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_catch");
        if (insertSpaceAfterOpeningParenInCatchOption != null) {
            this.insert_space_after_opening_paren_in_catch = "insert".equals(insertSpaceAfterOpeningParenInCatchOption);
        }
        final Object insertSpaceAfterOpeningParenInConstructorDeclarationOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_constructor_declaration");
        if (insertSpaceAfterOpeningParenInConstructorDeclarationOption != null) {
            this.insert_space_after_opening_paren_in_constructor_declaration
                = "insert".equals(insertSpaceAfterOpeningParenInConstructorDeclarationOption);
        }
        final Object insertSpaceAfterOpeningParenInEnumConstantOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_enum_constant");
        if (insertSpaceAfterOpeningParenInEnumConstantOption != null) {
            this.insert_space_after_opening_paren_in_enum_constant
                = "insert".equals(insertSpaceAfterOpeningParenInEnumConstantOption);
        }
        final Object insertSpaceAfterOpeningParenInForOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_for");
        if (insertSpaceAfterOpeningParenInForOption != null) {
            this.insert_space_after_opening_paren_in_for = "insert".equals(insertSpaceAfterOpeningParenInForOption);
        }
        final Object insertSpaceAfterOpeningParenInIfOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_if");
        if (insertSpaceAfterOpeningParenInIfOption != null) {
            this.insert_space_after_opening_paren_in_if = "insert".equals(insertSpaceAfterOpeningParenInIfOption);
        }
        final Object insertSpaceAfterOpeningParenInMethodDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_method_declaration");
        if (insertSpaceAfterOpeningParenInMethodDeclarationOption != null) {
            this.insert_space_after_opening_paren_in_method_declaration
                = "insert".equals(insertSpaceAfterOpeningParenInMethodDeclarationOption);
        }
        final Object insertSpaceAfterOpeningParenInMethodInvocationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_method_invocation");
        if (insertSpaceAfterOpeningParenInMethodInvocationOption != null) {
            this.insert_space_after_opening_paren_in_method_invocation
                = "insert".equals(insertSpaceAfterOpeningParenInMethodInvocationOption);
        }
        final Object insertSpaceAfterOpeningParenInParenthesizedExpressionOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_parenthesized_expression");
        if (insertSpaceAfterOpeningParenInParenthesizedExpressionOption != null) {
            this.insert_space_after_opening_paren_in_parenthesized_expression
                = "insert".equals(insertSpaceAfterOpeningParenInParenthesizedExpressionOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_record_declaration",
            "insert", v -> this.insert_space_after_opening_paren_in_record_declaration = v);
        final Object insertSpaceAfterOpeningParenInSwitchOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_switch");
        if (insertSpaceAfterOpeningParenInSwitchOption != null) {
            this.insert_space_after_opening_paren_in_switch
                = "insert".equals(insertSpaceAfterOpeningParenInSwitchOption);
        }
        final Object insertSpaceAfterOpeningParenInSynchronizedOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_synchronized");
        if (insertSpaceAfterOpeningParenInSynchronizedOption != null) {
            this.insert_space_after_opening_paren_in_synchronized
                = "insert".equals(insertSpaceAfterOpeningParenInSynchronizedOption);
        }
        final Object insertSpaceAfterOpeningParenInTryOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_try");
        if (insertSpaceAfterOpeningParenInTryOption != null) {
            this.insert_space_after_opening_paren_in_try = "insert".equals(insertSpaceAfterOpeningParenInTryOption);
        }
        final Object insertSpaceAfterOpeningParenInWhileOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_opening_paren_in_while");
        if (insertSpaceAfterOpeningParenInWhileOption != null) {
            this.insert_space_after_opening_paren_in_while = "insert".equals(insertSpaceAfterOpeningParenInWhileOption);
        }
        final Object insertSpaceAfterPostfixOperatorOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_postfix_operator");
        if (insertSpaceAfterPostfixOperatorOption != null) {
            this.insert_space_after_postfix_operator = "insert".equals(insertSpaceAfterPostfixOperatorOption);
        }
        final Object insertSpaceAfterPrefixOperatorOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_prefix_operator");
        if (insertSpaceAfterPrefixOperatorOption != null) {
            this.insert_space_after_prefix_operator = "insert".equals(insertSpaceAfterPrefixOperatorOption);
        }
        final Object insertSpaceAfterQuestionInConditionalOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_question_in_conditional");
        if (insertSpaceAfterQuestionInConditionalOption != null) {
            this.insert_space_after_question_in_conditional
                = "insert".equals(insertSpaceAfterQuestionInConditionalOption);
        }
        final Object insertSpaceAfterQuestionInWildcardOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_question_in_wildcard");
        if (insertSpaceAfterQuestionInWildcardOption != null) {
            this.insert_space_after_question_in_wilcard = "insert".equals(insertSpaceAfterQuestionInWildcardOption);
        }
        final Object insertSpaceAfterSemicolonInForOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_semicolon_in_for");
        if (insertSpaceAfterSemicolonInForOption != null) {
            this.insert_space_after_semicolon_in_for = "insert".equals(insertSpaceAfterSemicolonInForOption);
        }
        final Object insertSpaceAfterSemicolonInTryOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_semicolon_in_try_resources");
        if (insertSpaceAfterSemicolonInTryOption != null) {
            this.insert_space_after_semicolon_in_try_resources = "insert".equals(insertSpaceAfterSemicolonInTryOption);
        }
        final Object insertSpaceAfterUnaryOperatorOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_after_unary_operator");
        if (insertSpaceAfterUnaryOperatorOption != null) {
            this.insert_space_after_unary_operator = "insert".equals(insertSpaceAfterUnaryOperatorOption);
        }
        final Object insertSpaceBeforeAndInWildcardOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_and_in_type_parameter");
        if (insertSpaceBeforeAndInWildcardOption != null) {
            this.insert_space_before_and_in_type_parameter = "insert".equals(insertSpaceBeforeAndInWildcardOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_arrow_in_switch_case", "insert",
            v -> this.insert_space_before_arrow_in_switch_case = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_arrow_in_switch_default", "insert",
            v -> this.insert_space_before_arrow_in_switch_default = v);
        final Object insertSpaceBeforeAtInAnnotationTypeDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_at_in_annotation_type_declaration");
        if (insertSpaceBeforeAtInAnnotationTypeDeclarationOption != null) {
            this.insert_space_before_at_in_annotation_type_declaration
                = "insert".equals(insertSpaceBeforeAtInAnnotationTypeDeclarationOption);
        }
        final Object insertSpaceBeforeAssignmentOperatorOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_assignment_operator");
        if (insertSpaceBeforeAssignmentOperatorOption != null) {
            this.insert_space_before_assignment_operator = "insert".equals(insertSpaceBeforeAssignmentOperatorOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_multiplicative_operator", "insert",
            v -> this.insert_space_before_multiplicative_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_additive_operator", "insert",
            v -> this.insert_space_before_additive_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_string_concatenation", "insert",
            v -> this.insert_space_before_string_concatenation = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_shift_operator", "insert",
            v -> this.insert_space_before_shift_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_relational_operator", "insert",
            v -> this.insert_space_before_relational_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_bitwise_operator", "insert",
            v -> this.insert_space_before_bitwise_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_logical_operator", "insert",
            v -> this.insert_space_before_logical_operator = v);
        final Object insertSpaceBeforeClosingAngleBracketInParameterizedTypeReferenceOption = settings.get(
            "org.eclipse.jdt.core.formatter.insert_space_before_closing_angle_bracket_in_parameterized_type_reference");
        if (insertSpaceBeforeClosingAngleBracketInParameterizedTypeReferenceOption != null) {
            this.insert_space_before_closing_angle_bracket_in_parameterized_type_reference
                = "insert".equals(insertSpaceBeforeClosingAngleBracketInParameterizedTypeReferenceOption);
        }
        final Object insertSpaceBeforeClosingAngleBracketInTypeArgumentsOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_closing_angle_bracket_in_type_arguments");
        if (insertSpaceBeforeClosingAngleBracketInTypeArgumentsOption != null) {
            this.insert_space_before_closing_angle_bracket_in_type_arguments
                = "insert".equals(insertSpaceBeforeClosingAngleBracketInTypeArgumentsOption);
        }
        final Object insertSpaceBeforeClosingAngleBracketInTypeParametersOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_closing_angle_bracket_in_type_parameters");
        if (insertSpaceBeforeClosingAngleBracketInTypeParametersOption != null) {
            this.insert_space_before_closing_angle_bracket_in_type_parameters
                = "insert".equals(insertSpaceBeforeClosingAngleBracketInTypeParametersOption);
        }
        final Object insertSpaceBeforeClosingBraceInArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_brace_in_array_initializer");
        if (insertSpaceBeforeClosingBraceInArrayInitializerOption != null) {
            this.insert_space_before_closing_brace_in_array_initializer
                = "insert".equals(insertSpaceBeforeClosingBraceInArrayInitializerOption);
        }
        final Object insertSpaceBeforeClosingBracketInArrayAllocationExpressionOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_closing_bracket_in_array_allocation_expression");
        if (insertSpaceBeforeClosingBracketInArrayAllocationExpressionOption != null) {
            this.insert_space_before_closing_bracket_in_array_allocation_expression
                = "insert".equals(insertSpaceBeforeClosingBracketInArrayAllocationExpressionOption);
        }
        final Object insertSpaceBeforeClosingBracketInArrayReferenceOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_bracket_in_array_reference");
        if (insertSpaceBeforeClosingBracketInArrayReferenceOption != null) {
            this.insert_space_before_closing_bracket_in_array_reference
                = "insert".equals(insertSpaceBeforeClosingBracketInArrayReferenceOption);
        }
        final Object insertSpaceBeforeClosingParenInAnnotationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_annotation");
        if (insertSpaceBeforeClosingParenInAnnotationOption != null) {
            this.insert_space_before_closing_paren_in_annotation
                = "insert".equals(insertSpaceBeforeClosingParenInAnnotationOption);
        }
        final Object insertSpaceBeforeClosingParenInCastOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_cast");
        if (insertSpaceBeforeClosingParenInCastOption != null) {
            this.insert_space_before_closing_paren_in_cast = "insert".equals(insertSpaceBeforeClosingParenInCastOption);
        }
        final Object insertSpaceBeforeClosingParenInCatchOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_catch");
        if (insertSpaceBeforeClosingParenInCatchOption != null) {
            this.insert_space_before_closing_paren_in_catch
                = "insert".equals(insertSpaceBeforeClosingParenInCatchOption);
        }
        final Object insertSpaceBeforeClosingParenInConstructorDeclarationOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_constructor_declaration");
        if (insertSpaceBeforeClosingParenInConstructorDeclarationOption != null) {
            this.insert_space_before_closing_paren_in_constructor_declaration
                = "insert".equals(insertSpaceBeforeClosingParenInConstructorDeclarationOption);
        }
        final Object insertSpaceBeforeClosingParenInEnumConstantOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_enum_constant");
        if (insertSpaceBeforeClosingParenInEnumConstantOption != null) {
            this.insert_space_before_closing_paren_in_enum_constant
                = "insert".equals(insertSpaceBeforeClosingParenInEnumConstantOption);
        }
        final Object insertSpaceBeforeClosingParenInForOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_for");
        if (insertSpaceBeforeClosingParenInForOption != null) {
            this.insert_space_before_closing_paren_in_for = "insert".equals(insertSpaceBeforeClosingParenInForOption);
        }
        final Object insertSpaceBeforeClosingParenInIfOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_if");
        if (insertSpaceBeforeClosingParenInIfOption != null) {
            this.insert_space_before_closing_paren_in_if = "insert".equals(insertSpaceBeforeClosingParenInIfOption);
        }
        final Object insertSpaceBeforeClosingParenInMethodDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_method_declaration");
        if (insertSpaceBeforeClosingParenInMethodDeclarationOption != null) {
            this.insert_space_before_closing_paren_in_method_declaration
                = "insert".equals(insertSpaceBeforeClosingParenInMethodDeclarationOption);
        }
        final Object insertSpaceBeforeClosingParenInMethodInvocationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_method_invocation");
        if (insertSpaceBeforeClosingParenInMethodInvocationOption != null) {
            this.insert_space_before_closing_paren_in_method_invocation
                = "insert".equals(insertSpaceBeforeClosingParenInMethodInvocationOption);
        }
        final Object insertSpaceBeforeClosingParenInParenthesizedExpressionOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_parenthesized_expression");
        if (insertSpaceBeforeClosingParenInParenthesizedExpressionOption != null) {
            this.insert_space_before_closing_paren_in_parenthesized_expression
                = "insert".equals(insertSpaceBeforeClosingParenInParenthesizedExpressionOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_record_declaration",
            "insert", v -> this.insert_space_before_closing_paren_in_record_declaration = v);
        final Object insertSpaceBeforeClosingParenInSwitchOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_switch");
        if (insertSpaceBeforeClosingParenInSwitchOption != null) {
            this.insert_space_before_closing_paren_in_switch
                = "insert".equals(insertSpaceBeforeClosingParenInSwitchOption);
        }
        final Object insertSpaceBeforeClosingParenInSynchronizedOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_synchronized");
        if (insertSpaceBeforeClosingParenInSynchronizedOption != null) {
            this.insert_space_before_closing_paren_in_synchronized
                = "insert".equals(insertSpaceBeforeClosingParenInSynchronizedOption);
        }
        final Object insertSpaceBeforeClosingParenInTryOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_try");
        if (insertSpaceBeforeClosingParenInTryOption != null) {
            this.insert_space_before_closing_paren_in_try = "insert".equals(insertSpaceBeforeClosingParenInTryOption);
        }
        final Object insertSpaceBeforeClosingParenInWhileOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_closing_paren_in_while");
        if (insertSpaceBeforeClosingParenInWhileOption != null) {
            this.insert_space_before_closing_paren_in_while
                = "insert".equals(insertSpaceBeforeClosingParenInWhileOption);
        }
        final Object insertSpaceBeforeColonInAssertOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_assert");
        if (insertSpaceBeforeColonInAssertOption != null) {
            this.insert_space_before_colon_in_assert = "insert".equals(insertSpaceBeforeColonInAssertOption);
        }
        final Object insertSpaceBeforeColonInCaseOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_case");
        if (insertSpaceBeforeColonInCaseOption != null) {
            this.insert_space_before_colon_in_case = "insert".equals(insertSpaceBeforeColonInCaseOption);
        }
        final Object insertSpaceBeforeColonInConditionalOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_conditional");
        if (insertSpaceBeforeColonInConditionalOption != null) {
            this.insert_space_before_colon_in_conditional = "insert".equals(insertSpaceBeforeColonInConditionalOption);
        }
        final Object insertSpaceBeforeColonInDefaultOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_default");
        if (insertSpaceBeforeColonInDefaultOption != null) {
            this.insert_space_before_colon_in_default = "insert".equals(insertSpaceBeforeColonInDefaultOption);
        }
        final Object insertSpaceBeforeColonInForOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_for");
        if (insertSpaceBeforeColonInForOption != null) {
            this.insert_space_before_colon_in_for = "insert".equals(insertSpaceBeforeColonInForOption);
        }
        final Object insertSpaceBeforeColonInLabeledStatementOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_colon_in_labeled_statement");
        if (insertSpaceBeforeColonInLabeledStatementOption != null) {
            this.insert_space_before_colon_in_labeled_statement
                = "insert".equals(insertSpaceBeforeColonInLabeledStatementOption);
        }
        final Object insertSpaceBeforeCommaInAllocationExpressionOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_allocation_expression");
        if (insertSpaceBeforeCommaInAllocationExpressionOption != null) {
            this.insert_space_before_comma_in_allocation_expression
                = "insert".equals(insertSpaceBeforeCommaInAllocationExpressionOption);
        }
        final Object insertSpaceBeforeCommaInAnnotationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_annotation");
        if (insertSpaceBeforeCommaInAnnotationOption != null) {
            this.insert_space_before_comma_in_annotation = "insert".equals(insertSpaceBeforeCommaInAnnotationOption);
        }
        final Object insertSpaceBeforeCommaInArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_array_initializer");
        if (insertSpaceBeforeCommaInArrayInitializerOption != null) {
            this.insert_space_before_comma_in_array_initializer
                = "insert".equals(insertSpaceBeforeCommaInArrayInitializerOption);
        }
        final Object insertSpaceBeforeCommaInConstructorDeclarationParametersOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_constructor_declaration_parameters");
        if (insertSpaceBeforeCommaInConstructorDeclarationParametersOption != null) {
            this.insert_space_before_comma_in_constructor_declaration_parameters
                = "insert".equals(insertSpaceBeforeCommaInConstructorDeclarationParametersOption);
        }
        final Object insertSpaceBeforeCommaInConstructorDeclarationThrowsOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_constructor_declaration_throws");
        if (insertSpaceBeforeCommaInConstructorDeclarationThrowsOption != null) {
            this.insert_space_before_comma_in_constructor_declaration_throws
                = "insert".equals(insertSpaceBeforeCommaInConstructorDeclarationThrowsOption);
        }
        final Object insertSpaceBeforeCommaInEnumConstantArgumentsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_enum_constant_arguments");
        if (insertSpaceBeforeCommaInEnumConstantArgumentsOption != null) {
            this.insert_space_before_comma_in_enum_constant_arguments
                = "insert".equals(insertSpaceBeforeCommaInEnumConstantArgumentsOption);
        }
        final Object insertSpaceBeforeCommaInEnumDeclarationsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_enum_declarations");
        if (insertSpaceBeforeCommaInEnumDeclarationsOption != null) {
            this.insert_space_before_comma_in_enum_declarations
                = "insert".equals(insertSpaceBeforeCommaInEnumDeclarationsOption);
        }
        final Object insertSpaceBeforeCommaInExplicitConstructorCallArgumentsOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_explicitconstructorcall_arguments");
        if (insertSpaceBeforeCommaInExplicitConstructorCallArgumentsOption != null) {
            this.insert_space_before_comma_in_explicit_constructor_call_arguments
                = "insert".equals(insertSpaceBeforeCommaInExplicitConstructorCallArgumentsOption);
        }
        final Object insertSpaceBeforeCommaInForIncrementsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_for_increments");
        if (insertSpaceBeforeCommaInForIncrementsOption != null) {
            this.insert_space_before_comma_in_for_increments
                = "insert".equals(insertSpaceBeforeCommaInForIncrementsOption);
        }
        final Object insertSpaceBeforeCommaInForInitsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_for_inits");
        if (insertSpaceBeforeCommaInForInitsOption != null) {
            this.insert_space_before_comma_in_for_inits = "insert".equals(insertSpaceBeforeCommaInForInitsOption);
        }
        final Object insertSpaceBeforeCommaInMethodInvocationArgumentsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_method_invocation_arguments");
        if (insertSpaceBeforeCommaInMethodInvocationArgumentsOption != null) {
            this.insert_space_before_comma_in_method_invocation_arguments
                = "insert".equals(insertSpaceBeforeCommaInMethodInvocationArgumentsOption);
        }
        final Object insertSpaceBeforeCommaInMethodDeclarationParametersOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_method_declaration_parameters");
        if (insertSpaceBeforeCommaInMethodDeclarationParametersOption != null) {
            this.insert_space_before_comma_in_method_declaration_parameters
                = "insert".equals(insertSpaceBeforeCommaInMethodDeclarationParametersOption);
        }
        final Object insertSpaceBeforeCommaInMethodDeclarationThrowsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_method_declaration_throws");
        if (insertSpaceBeforeCommaInMethodDeclarationThrowsOption != null) {
            this.insert_space_before_comma_in_method_declaration_throws
                = "insert".equals(insertSpaceBeforeCommaInMethodDeclarationThrowsOption);
        }
        final Object insertSpaceBeforeCommaInMultipleFieldDeclarationsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_multiple_field_declarations");
        if (insertSpaceBeforeCommaInMultipleFieldDeclarationsOption != null) {
            this.insert_space_before_comma_in_multiple_field_declarations
                = "insert".equals(insertSpaceBeforeCommaInMultipleFieldDeclarationsOption);
        }
        final Object insertSpaceBeforeCommaInMultipleLocalDeclarationsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_multiple_local_declarations");
        if (insertSpaceBeforeCommaInMultipleLocalDeclarationsOption != null) {
            this.insert_space_before_comma_in_multiple_local_declarations
                = "insert".equals(insertSpaceBeforeCommaInMultipleLocalDeclarationsOption);
        }
        final Object insertSpaceBeforeCommaInParameterizedTypeReferenceOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_parameterized_type_reference");
        if (insertSpaceBeforeCommaInParameterizedTypeReferenceOption != null) {
            this.insert_space_before_comma_in_parameterized_type_reference
                = "insert".equals(insertSpaceBeforeCommaInParameterizedTypeReferenceOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_comma_in_permitted_types", "insert",
            v -> this.insert_space_before_comma_in_permitted_types = v);
        final Object insertSpaceBeforeCommaInSuperinterfacesOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_superinterfaces");
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_comma_in_record_components", "insert",
            v -> this.insert_space_before_comma_in_record_components = v);
        if (insertSpaceBeforeCommaInSuperinterfacesOption != null) {
            this.insert_space_before_comma_in_superinterfaces
                = "insert".equals(insertSpaceBeforeCommaInSuperinterfacesOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_comma_in_switch_case_expressions",
            "insert", v -> this.insert_space_before_comma_in_switch_case_expressions = v);
        final Object insertSpaceBeforeCommaInTypeArgumentsOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_type_arguments");
        if (insertSpaceBeforeCommaInTypeArgumentsOption != null) {
            this.insert_space_before_comma_in_type_arguments
                = "insert".equals(insertSpaceBeforeCommaInTypeArgumentsOption);
        }
        final Object insertSpaceBeforeCommaInTypeParametersOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_comma_in_type_parameters");
        if (insertSpaceBeforeCommaInTypeParametersOption != null) {
            this.insert_space_before_comma_in_type_parameters
                = "insert".equals(insertSpaceBeforeCommaInTypeParametersOption);
        }
        final Object insertSpaceBeforeEllipsisOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_ellipsis");
        if (insertSpaceBeforeEllipsisOption != null) {
            this.insert_space_before_ellipsis = "insert".equals(insertSpaceBeforeEllipsisOption);
        }
        final Object insertSpaceBeforeLambdaArrowOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_lambda_arrow");
        if (insertSpaceBeforeLambdaArrowOption != null) {
            this.insert_space_before_lambda_arrow = "insert".equals(insertSpaceBeforeLambdaArrowOption);
        }
        final Object insertSpaceBeforeOpeningAngleBrackerInParameterizedTypeReferenceOption = settings.get(
            "org.eclipse.jdt.core.formatter.insert_space_before_opening_angle_bracket_in_parameterized_type_reference");
        if (insertSpaceBeforeOpeningAngleBrackerInParameterizedTypeReferenceOption != null) {
            this.insert_space_before_opening_angle_bracket_in_parameterized_type_reference
                = "insert".equals(insertSpaceBeforeOpeningAngleBrackerInParameterizedTypeReferenceOption);
        }
        final Object insertSpaceBeforeOpeningAngleBrackerInTypeArgumentsOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_opening_angle_bracket_in_type_arguments");
        if (insertSpaceBeforeOpeningAngleBrackerInTypeArgumentsOption != null) {
            this.insert_space_before_opening_angle_bracket_in_type_arguments
                = "insert".equals(insertSpaceBeforeOpeningAngleBrackerInTypeArgumentsOption);
        }
        final Object insertSpaceBeforeOpeningAngleBrackerInTypeParametersOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_opening_angle_bracket_in_type_parameters");
        if (insertSpaceBeforeOpeningAngleBrackerInTypeParametersOption != null) {
            this.insert_space_before_opening_angle_bracket_in_type_parameters
                = "insert".equals(insertSpaceBeforeOpeningAngleBrackerInTypeParametersOption);
        }
        final Object insertSpaceBeforeOpeningBraceInAnnotationTypeDeclarationOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_annotation_type_declaration");
        if (insertSpaceBeforeOpeningBraceInAnnotationTypeDeclarationOption != null) {
            this.insert_space_before_opening_brace_in_annotation_type_declaration
                = "insert".equals(insertSpaceBeforeOpeningBraceInAnnotationTypeDeclarationOption);
        }
        final Object insertSpaceBeforeOpeningBraceInAnonymousTypeDeclarationOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_anonymous_type_declaration");
        if (insertSpaceBeforeOpeningBraceInAnonymousTypeDeclarationOption != null) {
            this.insert_space_before_opening_brace_in_anonymous_type_declaration
                = "insert".equals(insertSpaceBeforeOpeningBraceInAnonymousTypeDeclarationOption);
        }
        final Object insertSpaceBeforeOpeningBraceInArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_array_initializer");
        if (insertSpaceBeforeOpeningBraceInArrayInitializerOption != null) {
            this.insert_space_before_opening_brace_in_array_initializer
                = "insert".equals(insertSpaceBeforeOpeningBraceInArrayInitializerOption);
        }
        final Object insertSpaceBeforeOpeningBraceInBlockOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_block");
        if (insertSpaceBeforeOpeningBraceInBlockOption != null) {
            this.insert_space_before_opening_brace_in_block
                = "insert".equals(insertSpaceBeforeOpeningBraceInBlockOption);
        }
        final Object insertSpaceBeforeOpeningBraceInConstructorDeclarationOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_constructor_declaration");
        if (insertSpaceBeforeOpeningBraceInConstructorDeclarationOption != null) {
            this.insert_space_before_opening_brace_in_constructor_declaration
                = "insert".equals(insertSpaceBeforeOpeningBraceInConstructorDeclarationOption);
        }
        final Object insertSpaceBeforeOpeningBraceInEnumDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_enum_declaration");
        if (insertSpaceBeforeOpeningBraceInEnumDeclarationOption != null) {
            this.insert_space_before_opening_brace_in_enum_declaration
                = "insert".equals(insertSpaceBeforeOpeningBraceInEnumDeclarationOption);
        }
        final Object insertSpaceBeforeOpeningBraceInEnumConstantOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_enum_constant");
        if (insertSpaceBeforeOpeningBraceInEnumConstantOption != null) {
            this.insert_space_before_opening_brace_in_enum_constant
                = "insert".equals(insertSpaceBeforeOpeningBraceInEnumConstantOption);
        }
        final Object insertSpaceBeforeOpeningBraceInMethodDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_method_declaration");
        if (insertSpaceBeforeOpeningBraceInMethodDeclarationOption != null) {
            this.insert_space_before_opening_brace_in_method_declaration
                = "insert".equals(insertSpaceBeforeOpeningBraceInMethodDeclarationOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_record_constructor",
            "insert", v -> this.insert_space_before_opening_brace_in_record_constructor = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_record_declaration",
            "insert", v -> this.insert_space_before_opening_brace_in_record_declaration = v);
        final Object insertSpaceBeforeOpeningBraceInTypeDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_type_declaration");
        if (insertSpaceBeforeOpeningBraceInTypeDeclarationOption != null) {
            this.insert_space_before_opening_brace_in_type_declaration
                = "insert".equals(insertSpaceBeforeOpeningBraceInTypeDeclarationOption);
        }
        final Object insertSpaceBeforeOpeningBracketInArrayAllocationExpressionOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_opening_bracket_in_array_allocation_expression");
        if (insertSpaceBeforeOpeningBracketInArrayAllocationExpressionOption != null) {
            this.insert_space_before_opening_bracket_in_array_allocation_expression
                = "insert".equals(insertSpaceBeforeOpeningBracketInArrayAllocationExpressionOption);
        }
        final Object insertSpaceBeforeOpeningBracketInArrayReferenceOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_bracket_in_array_reference");
        if (insertSpaceBeforeOpeningBracketInArrayReferenceOption != null) {
            this.insert_space_before_opening_bracket_in_array_reference
                = "insert".equals(insertSpaceBeforeOpeningBracketInArrayReferenceOption);
        }
        final Object insertSpaceBeforeOpeningBracketInArrayTypeReferenceOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_opening_bracket_in_array_type_reference");
        if (insertSpaceBeforeOpeningBracketInArrayTypeReferenceOption != null) {
            this.insert_space_before_opening_bracket_in_array_type_reference
                = "insert".equals(insertSpaceBeforeOpeningBracketInArrayTypeReferenceOption);
        }
        final Object insertSpaceBeforeOpeningParenInAnnotationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_annotation");
        if (insertSpaceBeforeOpeningParenInAnnotationOption != null) {
            this.insert_space_before_opening_paren_in_annotation
                = "insert".equals(insertSpaceBeforeOpeningParenInAnnotationOption);
        }
        final Object insertSpaceBeforeOpeningParenInAnnotationTypeMemberDeclarationOption = settings.get(
            "org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_annotation_type_member_declaration");
        if (insertSpaceBeforeOpeningParenInAnnotationTypeMemberDeclarationOption != null) {
            this.insert_space_before_opening_paren_in_annotation_type_member_declaration
                = "insert".equals(insertSpaceBeforeOpeningParenInAnnotationTypeMemberDeclarationOption);
        }
        final Object insertSpaceBeforeOpeningParenInCatchOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_catch");
        if (insertSpaceBeforeOpeningParenInCatchOption != null) {
            this.insert_space_before_opening_paren_in_catch
                = "insert".equals(insertSpaceBeforeOpeningParenInCatchOption);
        }
        final Object insertSpaceBeforeOpeningParenInConstructorDeclarationOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_constructor_declaration");
        if (insertSpaceBeforeOpeningParenInConstructorDeclarationOption != null) {
            this.insert_space_before_opening_paren_in_constructor_declaration
                = "insert".equals(insertSpaceBeforeOpeningParenInConstructorDeclarationOption);
        }
        final Object insertSpaceBeforeOpeningParenInEnumConstantOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_enum_constant");
        if (insertSpaceBeforeOpeningParenInEnumConstantOption != null) {
            this.insert_space_before_opening_paren_in_enum_constant
                = "insert".equals(insertSpaceBeforeOpeningParenInEnumConstantOption);
        }
        final Object insertSpaceBeforeOpeningParenInForOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_for");
        if (insertSpaceBeforeOpeningParenInForOption != null) {
            this.insert_space_before_opening_paren_in_for = "insert".equals(insertSpaceBeforeOpeningParenInForOption);
        }
        final Object insertSpaceBeforeOpeningParenInIfOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_if");
        if (insertSpaceBeforeOpeningParenInIfOption != null) {
            this.insert_space_before_opening_paren_in_if = "insert".equals(insertSpaceBeforeOpeningParenInIfOption);
        }
        final Object insertSpaceBeforeOpeningParenInMethodInvocationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_method_invocation");
        if (insertSpaceBeforeOpeningParenInMethodInvocationOption != null) {
            this.insert_space_before_opening_paren_in_method_invocation
                = "insert".equals(insertSpaceBeforeOpeningParenInMethodInvocationOption);
        }
        final Object insertSpaceBeforeOpeningParenInMethodDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_method_declaration");
        if (insertSpaceBeforeOpeningParenInMethodDeclarationOption != null) {
            this.insert_space_before_opening_paren_in_method_declaration
                = "insert".equals(insertSpaceBeforeOpeningParenInMethodDeclarationOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_record_declaration",
            "insert", v -> this.insert_space_before_opening_paren_in_record_declaration = v);
        final Object insertSpaceBeforeOpeningParenInSwitchOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_switch");
        if (insertSpaceBeforeOpeningParenInSwitchOption != null) {
            this.insert_space_before_opening_paren_in_switch
                = "insert".equals(insertSpaceBeforeOpeningParenInSwitchOption);
        }
        final Object insertSpaceBeforeOpeningBraceInSwitchOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_brace_in_switch");
        if (insertSpaceBeforeOpeningBraceInSwitchOption != null) {
            this.insert_space_before_opening_brace_in_switch
                = "insert".equals(insertSpaceBeforeOpeningBraceInSwitchOption);
        }
        final Object insertSpaceBeforeOpeningParenInSynchronizedOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_synchronized");
        if (insertSpaceBeforeOpeningParenInSynchronizedOption != null) {
            this.insert_space_before_opening_paren_in_synchronized
                = "insert".equals(insertSpaceBeforeOpeningParenInSynchronizedOption);
        }
        final Object insertSpaceBeforeOpeningParenInTryOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_try");
        if (insertSpaceBeforeOpeningParenInTryOption != null) {
            this.insert_space_before_opening_paren_in_try = "insert".equals(insertSpaceBeforeOpeningParenInTryOption);
        }
        final Object insertSpaceBeforeOpeningParenInParenthesizedExpressionOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_parenthesized_expression");
        if (insertSpaceBeforeOpeningParenInParenthesizedExpressionOption != null) {
            this.insert_space_before_opening_paren_in_parenthesized_expression
                = "insert".equals(insertSpaceBeforeOpeningParenInParenthesizedExpressionOption);
        }
        final Object insertSpaceBeforeOpeningParenInWhileOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_opening_paren_in_while");
        if (insertSpaceBeforeOpeningParenInWhileOption != null) {
            this.insert_space_before_opening_paren_in_while
                = "insert".equals(insertSpaceBeforeOpeningParenInWhileOption);
        }
        final Object insertSpaceBeforeParenthesizedExpressionInReturnOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_parenthesized_expression_in_return");
        if (insertSpaceBeforeParenthesizedExpressionInReturnOption != null) {
            this.insert_space_before_parenthesized_expression_in_return
                = "insert".equals(insertSpaceBeforeParenthesizedExpressionInReturnOption);
        }
        final Object insertSpaceBeforeParenthesizedExpressionInThrowOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_parenthesized_expression_in_throw");
        if (insertSpaceBeforeParenthesizedExpressionInThrowOption != null) {
            this.insert_space_before_parenthesized_expression_in_throw
                = "insert".equals(insertSpaceBeforeParenthesizedExpressionInThrowOption);
        }
        final Object insertSpaceBeforePostfixOperatorOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_postfix_operator");
        if (insertSpaceBeforePostfixOperatorOption != null) {
            this.insert_space_before_postfix_operator = "insert".equals(insertSpaceBeforePostfixOperatorOption);
        }
        final Object insertSpaceBeforePrefixOperatorOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_prefix_operator");
        if (insertSpaceBeforePrefixOperatorOption != null) {
            this.insert_space_before_prefix_operator = "insert".equals(insertSpaceBeforePrefixOperatorOption);
        }
        final Object insertSpaceBeforeQuestionInConditionalOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_question_in_conditional");
        if (insertSpaceBeforeQuestionInConditionalOption != null) {
            this.insert_space_before_question_in_conditional
                = "insert".equals(insertSpaceBeforeQuestionInConditionalOption);
        }
        final Object insertSpaceBeforeQuestionInWildcardOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_question_in_wildcard");
        if (insertSpaceBeforeQuestionInWildcardOption != null) {
            this.insert_space_before_question_in_wilcard = "insert".equals(insertSpaceBeforeQuestionInWildcardOption);
        }
        final Object insertSpaceBeforeSemicolonOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_semicolon");
        if (insertSpaceBeforeSemicolonOption != null) {
            this.insert_space_before_semicolon = "insert".equals(insertSpaceBeforeSemicolonOption);
        }
        final Object insertSpaceBeforeSemicolonInForOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_semicolon_in_for");
        if (insertSpaceBeforeSemicolonInForOption != null) {
            this.insert_space_before_semicolon_in_for = "insert".equals(insertSpaceBeforeSemicolonInForOption);
        }
        final Object insertSpaceBeforeSemicolonInTryOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_semicolon_in_try_resources");
        if (insertSpaceBeforeSemicolonInTryOption != null) {
            this.insert_space_before_semicolon_in_try_resources
                = "insert".equals(insertSpaceBeforeSemicolonInTryOption);
        }
        final Object insertSpaceBeforeUnaryOperatorOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_before_unary_operator");
        if (insertSpaceBeforeUnaryOperatorOption != null) {
            this.insert_space_before_unary_operator = "insert".equals(insertSpaceBeforeUnaryOperatorOption);
        }
        final Object insertSpaceBetweenBracketsInArrayTypeReferenceOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_between_brackets_in_array_type_reference");
        if (insertSpaceBetweenBracketsInArrayTypeReferenceOption != null) {
            this.insert_space_between_brackets_in_array_type_reference
                = "insert".equals(insertSpaceBetweenBracketsInArrayTypeReferenceOption);
        }
        final Object insertSpaceBetweenEmptyBracesInArrayInitializerOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_between_empty_braces_in_array_initializer");
        if (insertSpaceBetweenEmptyBracesInArrayInitializerOption != null) {
            this.insert_space_between_empty_braces_in_array_initializer
                = "insert".equals(insertSpaceBetweenEmptyBracesInArrayInitializerOption);
        }
        final Object insertSpaceBetweenEmptyBracketsInArrayAllocationExpressionOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_between_empty_brackets_in_array_allocation_expression");
        if (insertSpaceBetweenEmptyBracketsInArrayAllocationExpressionOption != null) {
            this.insert_space_between_empty_brackets_in_array_allocation_expression
                = "insert".equals(insertSpaceBetweenEmptyBracketsInArrayAllocationExpressionOption);
        }
        final Object insertSpaceBetweenEmptyParensInConstructorDeclarationOption = settings
            .get("org.eclipse.jdt.core.formatter.insert_space_between_empty_parens_in_constructor_declaration");
        if (insertSpaceBetweenEmptyParensInConstructorDeclarationOption != null) {
            this.insert_space_between_empty_parens_in_constructor_declaration
                = "insert".equals(insertSpaceBetweenEmptyParensInConstructorDeclarationOption);
        }
        final Object insertSpaceBetweenEmptyParensInAnnotationTypeMemberDeclarationOption = settings.get(
            "org.eclipse.jdt.core.formatter.insert_space_between_empty_parens_in_annotation_type_member_declaration");
        if (insertSpaceBetweenEmptyParensInAnnotationTypeMemberDeclarationOption != null) {
            this.insert_space_between_empty_parens_in_annotation_type_member_declaration
                = "insert".equals(insertSpaceBetweenEmptyParensInAnnotationTypeMemberDeclarationOption);
        }
        final Object insertSpaceBetweenEmptyParensInEnumConstantOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_between_empty_parens_in_enum_constant");
        if (insertSpaceBetweenEmptyParensInEnumConstantOption != null) {
            this.insert_space_between_empty_parens_in_enum_constant
                = "insert".equals(insertSpaceBetweenEmptyParensInEnumConstantOption);
        }
        final Object insertSpaceBetweenEmptyParensInMethodDeclarationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_between_empty_parens_in_method_declaration");
        if (insertSpaceBetweenEmptyParensInMethodDeclarationOption != null) {
            this.insert_space_between_empty_parens_in_method_declaration
                = "insert".equals(insertSpaceBetweenEmptyParensInMethodDeclarationOption);
        }
        final Object insertSpaceBetweenEmptyParensInMethodInvocationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_space_between_empty_parens_in_method_invocation");
        if (insertSpaceBetweenEmptyParensInMethodInvocationOption != null) {
            this.insert_space_between_empty_parens_in_method_invocation
                = "insert".equals(insertSpaceBetweenEmptyParensInMethodInvocationOption);
        }
        final Object compactElseIfOption = settings.get("org.eclipse.jdt.core.formatter.compact_else_if");
        if (compactElseIfOption != null) {
            this.compact_else_if = "true".equals(compactElseIfOption);
        }
        final Object keepGuardianClauseOnOneLineOption
            = settings.get("org.eclipse.jdt.core.formatter.format_guardian_clause_on_one_line");
        if (keepGuardianClauseOnOneLineOption != null) {
            this.keep_guardian_clause_on_one_line = "true".equals(keepGuardianClauseOnOneLineOption);
        }
        final Object keepElseStatementOnSameLineOption
            = settings.get("org.eclipse.jdt.core.formatter.keep_else_statement_on_same_line");
        if (keepElseStatementOnSameLineOption != null) {
            this.keep_else_statement_on_same_line = "true".equals(keepElseStatementOnSameLineOption);
        }
        final Object keepEmptyArrayInitializerOnOneLineOption
            = settings.get("org.eclipse.jdt.core.formatter.keep_empty_array_initializer_on_one_line");
        if (keepEmptyArrayInitializerOnOneLineOption != null) {
            this.keep_empty_array_initializer_on_one_line = "true".equals(keepEmptyArrayInitializerOnOneLineOption);
        }
        final Object keepSimpleIfOnOneLineOption
            = settings.get("org.eclipse.jdt.core.formatter.keep_imple_if_on_one_line");
        if (keepSimpleIfOnOneLineOption != null) {
            this.keep_simple_if_on_one_line = "true".equals(keepSimpleIfOnOneLineOption);
        }
        final Object keepThenStatementOnSameLineOption
            = settings.get("org.eclipse.jdt.core.formatter.keep_then_statement_on_same_line");
        if (keepThenStatementOnSameLineOption != null) {
            this.keep_then_statement_on_same_line = "true".equals(keepThenStatementOnSameLineOption);
        }
        final Object keepSimpleForBodyOnSameLineOption
            = settings.get("org.eclipse.jdt.core.formatter.keep_simple_for_body_on_same_line");
        if (keepSimpleForBodyOnSameLineOption != null) {
            this.keep_simple_for_body_on_same_line = "true".equals(keepSimpleForBodyOnSameLineOption);
        }
        final Object keepSimpleWhileBodyOnSameLineOption
            = settings.get("org.eclipse.jdt.core.formatter.keep_simple_while_body_on_same_line");
        if (keepSimpleWhileBodyOnSameLineOption != null) {
            this.keep_simple_while_body_on_same_line = "true".equals(keepSimpleWhileBodyOnSameLineOption);
        }
        final Object keepSimpleDoWhileBodyOnSameLineOption
            = settings.get("org.eclipse.jdt.core.formatter.keep_simple_do_while_body_on_same_line");
        if (keepSimpleDoWhileBodyOnSameLineOption != null) {
            this.keep_simple_do_while_body_on_same_line = "true".equals(keepSimpleDoWhileBodyOnSameLineOption);
        }
        final Object neverIndentBlockCommentOnFirstColumnOption
            = settings.get("org.eclipse.jdt.core.formatter.never_indent_block_comments_on_first_column");
        if (neverIndentBlockCommentOnFirstColumnOption != null) {
            this.never_indent_block_comments_on_first_column
                = "true".equals(neverIndentBlockCommentOnFirstColumnOption);
        }
        final Object neverIndentLineCommentOnFirstColumnOption
            = settings.get("org.eclipse.jdt.core.formatter.never_indent_line_comments_on_first_column");
        if (neverIndentLineCommentOnFirstColumnOption != null) {
            this.never_indent_line_comments_on_first_column = "true".equals(neverIndentLineCommentOnFirstColumnOption);
        }
        final String numberOfEmptyLinesToPreserveOption
            = settings.get("org.eclipse.jdt.core.formatter.number_of_empty_lines_to_preserve");
        if (numberOfEmptyLinesToPreserveOption != null) {
            try {
                this.number_of_empty_lines_to_preserve = Integer.parseInt(numberOfEmptyLinesToPreserveOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.number_of_empty_lines_to_preserve = 0;
            }
        }
        final Object joinLinesInCommentsOption = settings.get("org.eclipse.jdt.core.formatter.join_lines_in_comments");
        if (joinLinesInCommentsOption != null) {
            this.join_lines_in_comments = "true".equals(joinLinesInCommentsOption);
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.join_line_comments", "true",
            v -> this.join_line_comments = v);
        final Object joinWrappedLinesOption = settings.get("org.eclipse.jdt.core.formatter.join_wrapped_lines");
        if (joinWrappedLinesOption != null) {
            this.join_wrapped_lines = "true".equals(joinWrappedLinesOption);
        }
        final Object putEmptyStatementOnNewLineOption
            = settings.get("org.eclipse.jdt.core.formatter.put_empty_statement_on_new_line");
        if (putEmptyStatementOnNewLineOption != null) {
            this.put_empty_statement_on_new_line = "true".equals(putEmptyStatementOnNewLineOption);
        }
        final Object putNewLineOnTextBlockOption
            = settings.get("org.eclipse.jdt.core.formatter.put_text_block_quotes_on_new_line");
        if (putNewLineOnTextBlockOption != null) {
            this.put_text_block_quotes_on_new_line = "true".equals(putNewLineOnTextBlockOption);
        }
        final String tabSizeOption = settings.get("org.eclipse.jdt.core.formatter.tabulation.size");
        if (tabSizeOption != null) {
            int tabSize = 4;
            try {
                tabSize = Integer.parseInt(tabSizeOption);
            } catch (NumberFormatException | ClassCastException e) {
                // keep default
            }
            // reverse values swapping performed by the indentation preference page
            if (!"space".equals(settings.get("org.eclipse.jdt.core.formatter.tabulation.char")))
                this.tab_size = tabSize;
            if (!"mixed".equals(settings.get("org.eclipse.jdt.core.formatter.tabulation.char")))
                this.indentation_size = tabSize;
        }
        final Object useTabsOnlyForLeadingIndentationsOption
            = settings.get("org.eclipse.jdt.core.formatter.use_tabs_only_for_leading_indentations");
        if (useTabsOnlyForLeadingIndentationsOption != null) {
            this.use_tabs_only_for_leading_indentations = "true".equals(useTabsOnlyForLeadingIndentationsOption);
        }
        setInt(settings, "org.eclipse.jdt.core.formatter.text_block_indentation", v -> {
            if (3 == v) {
                this.text_block_indentation = 8;
            } else if (2 == v) {
                this.text_block_indentation = 4;
            } else if (0 == v) {
                this.text_block_indentation = 0;
            } else if (1 == v) {
                this.text_block_indentation = 2;
            } else {
                throw new IllegalArgumentException("invalid text block setting: " + v); //$NON-NLS-1$
            }
        });
        final String pageWidthOption = settings.get("org.eclipse.jdt.core.formatter.lineSplit");
        if (pageWidthOption != null) {
            try {
                this.page_width = Integer.parseInt(pageWidthOption);
            } catch (NumberFormatException | ClassCastException e) {
                this.page_width = 120;
            }
        }
        final Object useTabOption = settings.get("org.eclipse.jdt.core.formatter.tabulation.char");
        if (useTabOption != null) {
            if ("tab".equals(useTabOption)) {
                this.tab_char = 1;
            } else if ("space".equals(useTabOption)) {
                this.tab_char = 2;
            } else {
                this.tab_char = 4;
            }
        }
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_multiplicative_operator", "true",
            v -> this.wrap_before_multiplicative_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_assertion_message_operator", "true",
            v -> this.wrap_before_assertion_message_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_additive_operator", "true",
            v -> this.wrap_before_additive_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_string_concatenation", "true",
            v -> this.wrap_before_string_concatenation = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_shift_operator", "true",
            v -> this.wrap_before_shift_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_relational_operator", "true",
            v -> this.wrap_before_relational_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_bitwise_operator", "true",
            v -> this.wrap_before_bitwise_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_logical_operator", "true",
            v -> this.wrap_before_logical_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_or_operator_multicatch", "true",
            v -> this.wrap_before_or_operator_multicatch = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_conditional_operator", "true",
            v -> this.wrap_before_conditional_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_assignment_operator", "true",
            v -> this.wrap_before_assignment_operator = v);
        setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_switch_case_arrow_operator", "true",
            v -> this.wrap_before_switch_case_arrow_operator = v);

        final Object useTags = settings.get("org.eclipse.jdt.core.formatter.use_on_off_tags");
        if (useTags != null) {
            this.use_tags = "true".equals(useTags);
        }
        final String disableTagOption = settings.get("org.eclipse.jdt.core.formatter.disabling_tag");
        if (disableTagOption != null) {
            int idx = disableTagOption.indexOf('\n');
            if (idx == 0) {
                this.disabling_tag = null;
            } else {
                String tag = idx < 0 ? disableTagOption.trim() : disableTagOption.substring(0, idx).trim();
                if (tag.isEmpty()) {
                    this.disabling_tag = null;
                } else {
                    this.disabling_tag = tag.toCharArray();
                }
            }
        }
        final String enableTagOption = settings.get("org.eclipse.jdt.core.formatter.enabling_tag");
        if (enableTagOption != null) {
            int idx = enableTagOption.indexOf('\n');
            if (idx == 0) {
                this.enabling_tag = null;
            } else {
                String tag = idx < 0 ? enableTagOption.trim() : enableTagOption.substring(0, idx).trim();
                if (tag.isEmpty()) {
                    this.enabling_tag = null;
                } else {
                    this.enabling_tag = tag.toCharArray();
                }
            }
        }
        final Object wrapWrapOuterExpressionsWhenNestedOption
            = settings.get("org.eclipse.jdt.core.formatter.wrap_outer_expressions_when_nested");
        if (wrapWrapOuterExpressionsWhenNestedOption != null) {
            this.wrap_outer_expressions_when_nested = "true".equals(wrapWrapOuterExpressionsWhenNestedOption);
        }

        setDerivableOptions(settings);
    }

    private int toInt(Object value, int defaultValue) {
        if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    private String toString(Object value) {

        if (value instanceof String)
            return (String) value;
        return "common_lines";
    }

    private void setInt(Map<String, String> settings, String key, IntConsumer setter) {
        String value = settings.get(key);
        if (value != null) {
            try {
                setter.accept(Integer.parseInt(value));
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Expected integer for setting " + key + ", got: " + value); //$NON-NLS-1$ //$NON-NLS-2$
            }
        }
    }

    private void setString(Map<String, String> settings, String key, List<String> allowedValues,
        Consumer<String> setter) {
        String value = settings.get(key);
        if (value != null) {
            if (!allowedValues.contains(value))
                throw new IllegalArgumentException("Unrecognized value for setting " + key + ": " + value); //$NON-NLS-1$ //$NON-NLS-2$
            setter.accept(value);
        }
    }

    private void setBoolean(Map<String, String> settings, String key, String trueValue, Consumer<Boolean> setter) {
        Object value = settings.get(key);
        if (value != null)
            setter.accept(trueValue.equals(value));
    }

    /**
     * This method is used to handle deprecated preferences which might be replaced by one or more preferences.
     * Depending on deprecated option handling policy, set the new formatting option(s).
     *
     * @param settings the given map
     * @deprecated
     */
    private void setDeprecatedOptions(Map<String, String> settings) {
        // backward compatibility code
        final Object commentClearBlankLinesOption
            = settings.get("org.eclipse.jdt.core.formatter.comment.clear_blank_lines");
        if (commentClearBlankLinesOption != null) {
            this.comment_clear_blank_lines_in_javadoc_comment = "true".equals(commentClearBlankLinesOption);
            this.comment_clear_blank_lines_in_block_comment = "true".equals(commentClearBlankLinesOption);
        } else {
            final Object commentClearBlankLinesInJavadocCommentOption
                = settings.get("org.eclipse.jdt.core.formatter.comment.clear_blank_lines_in_javadoc_comment");
            if (commentClearBlankLinesInJavadocCommentOption != null) {
                this.comment_clear_blank_lines_in_javadoc_comment
                    = "true".equals(commentClearBlankLinesInJavadocCommentOption);
            }
            final Object commentClearBlankLinesInBlockCommentOption
                = settings.get("org.eclipse.jdt.core.formatter.comment.clear_blank_lines_in_block_comment");
            if (commentClearBlankLinesInBlockCommentOption != null) {
                this.comment_clear_blank_lines_in_block_comment
                    = "true".equals(commentClearBlankLinesInBlockCommentOption);
            }
        }

        // New line after annotations
        final Object insertNewLineAfterAnnotationOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation");

        final Object insertNewLineAfterAnnotationOnMemberOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_member");
        final Object insertNewLineAfterAnnotationOnTypeOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_type");
        final Object insertNewLineAfterAnnotationOnEnumConstantOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_enum_constant");
        final Object insertNewLineAfterAnnotationOnFieldOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_field");
        final Object insertNewLineAfterAnnotationOnMethodOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_method");
        final Object insertNewLineAfterAnnotationOnPackageOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_package");

        final Object insertNewLineAfterAnnotationOnParameterOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_parameter");
        final Object insertNewLineAfterAnnotationOnRecordParameterOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_record_parameter");
        final Object insertNewLineAfterAnnotationOnLocalVariableOption
            = settings.get("org.eclipse.jdt.core.formatter.insert_new_line_after_annotation_on_local_variable");

        if (insertNewLineAfterAnnotationOnTypeOption == null
            && insertNewLineAfterAnnotationOnEnumConstantOption == null
            && insertNewLineAfterAnnotationOnFieldOption == null
            && insertNewLineAfterAnnotationOnMethodOption == null
            && insertNewLineAfterAnnotationOnPackageOption == null) {
            // if none of the new 3.7 options is used, fall back to the deprecated 3.4 option
            if (insertNewLineAfterAnnotationOnMemberOption != null) {
                boolean insert = "insert".equals(insertNewLineAfterAnnotationOnMemberOption);
                this.insert_new_line_after_annotation_on_type = insert;
                this.insert_new_line_after_annotation_on_enum_constant = insert;
                this.insert_new_line_after_annotation_on_field = insert;
                this.insert_new_line_after_annotation_on_method = insert;
                this.insert_new_line_after_annotation_on_package = insert;

                // and use the other 3.4 options if available
                if (insertNewLineAfterAnnotationOnParameterOption != null) {
                    this.insert_new_line_after_annotation_on_parameter
                        = "insert".equals(insertNewLineAfterAnnotationOnParameterOption);
                }
                if (insertNewLineAfterAnnotationOnRecordParameterOption != null) {
                    this.insert_new_line_after_annotation_on_record_parameter
                        = "insert".equals(insertNewLineAfterAnnotationOnRecordParameterOption);
                }
                if (insertNewLineAfterAnnotationOnLocalVariableOption != null) {
                    this.insert_new_line_after_annotation_on_local_variable
                        = "insert".equals(insertNewLineAfterAnnotationOnLocalVariableOption);
                }
            } else if (insertNewLineAfterAnnotationOnParameterOption == null
                && insertNewLineAfterAnnotationOnLocalVariableOption == null) {
                // if none of the new 3.4 options is used, fall back to the deprecated 3.1 option
                if (insertNewLineAfterAnnotationOption != null) {
                    boolean insert = "insert".equals(insertNewLineAfterAnnotationOption);
                    this.insert_new_line_after_annotation_on_type = insert;
                    this.insert_new_line_after_annotation_on_enum_constant = insert;
                    this.insert_new_line_after_annotation_on_field = insert;
                    this.insert_new_line_after_annotation_on_method = insert;
                    this.insert_new_line_after_annotation_on_package = insert;
                    this.insert_new_line_after_annotation_on_parameter = insert;
                    this.insert_new_line_after_annotation_on_record_parameter = insert;
                    this.insert_new_line_after_annotation_on_local_variable = insert;
                    int alignment = insert ? 1 | 48 : 0;
                    this.alignment_for_annotations_on_type = alignment;
                    this.alignment_for_annotations_on_enum_constant = alignment;
                    this.alignment_for_annotations_on_field = alignment;
                    this.alignment_for_annotations_on_method = alignment;
                    this.alignment_for_annotations_on_package = alignment;
                    this.alignment_for_annotations_on_parameter = alignment;
                    this.alignment_for_annotations_on_local_variable = alignment;
                }
            }
        } else { // otherwise use new 3.7 options if available
            if (insertNewLineAfterAnnotationOnTypeOption != null) {
                this.insert_new_line_after_annotation_on_type
                    = "insert".equals(insertNewLineAfterAnnotationOnTypeOption);
            }
            if (insertNewLineAfterAnnotationOnEnumConstantOption != null) {
                this.insert_new_line_after_annotation_on_enum_constant
                    = "insert".equals(insertNewLineAfterAnnotationOnEnumConstantOption);
            }
            if (insertNewLineAfterAnnotationOnFieldOption != null) {
                this.insert_new_line_after_annotation_on_field
                    = "insert".equals(insertNewLineAfterAnnotationOnFieldOption);
            }
            if (insertNewLineAfterAnnotationOnMethodOption != null) {
                this.insert_new_line_after_annotation_on_method
                    = "insert".equals(insertNewLineAfterAnnotationOnMethodOption);
            }
            if (insertNewLineAfterAnnotationOnPackageOption != null) {
                this.insert_new_line_after_annotation_on_package
                    = "insert".equals(insertNewLineAfterAnnotationOnPackageOption);
            }
            // and the other 3.4 options if available
            if (insertNewLineAfterAnnotationOnParameterOption != null) {
                this.insert_new_line_after_annotation_on_parameter
                    = "insert".equals(insertNewLineAfterAnnotationOnParameterOption);
            }
            if (insertNewLineAfterAnnotationOnRecordParameterOption != null) {
                this.insert_new_line_after_annotation_on_record_parameter
                    = "insert".equals(insertNewLineAfterAnnotationOnRecordParameterOption);
            }
            if (insertNewLineAfterAnnotationOnLocalVariableOption != null) {
                this.insert_new_line_after_annotation_on_local_variable
                    = "insert".equals(insertNewLineAfterAnnotationOnLocalVariableOption);
            }
        }

        // insert new line between empty braces -> keep braced code on one line
        HashMap<Boolean, String> insertToOneLine = new HashMap<>();
        insertToOneLine.put(true, "one_line_never");
        insertToOneLine.put(false, "one_line_if_empty");
        if (settings.get("org.eclipse.jdt.core.formatter.keep_annotation_declaration_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_annotation_declaration",
                "insert", v -> this.keep_annotation_declaration_on_one_line = insertToOneLine.get(v));
        }
        if (settings.get("org.eclipse.jdt.core.formatter.keep_anonymous_type_declaration_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_anonymous_type_declaration",
                "insert", v -> this.keep_anonymous_type_declaration_on_one_line = insertToOneLine.get(v));
        }
        if (settings.get("org.eclipse.jdt.core.formatter.keep_if_then_body_block_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_block", "insert",
                v -> this.keep_if_then_body_block_on_one_line = insertToOneLine.get(v));
        }
        if (settings.get("org.eclipse.jdt.core.formatter.keep_switch_case_with_arrow_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_block", "insert",
                v -> this.keep_switch_case_with_arrow_on_one_line = insertToOneLine.get(v));
        }
        if (settings.get("org.eclipse.jdt.core.formatter.keep_loop_body_block_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_block", "insert",
                v -> this.keep_loop_body_block_on_one_line = insertToOneLine.get(v));
        }
        if (settings.get("org.eclipse.jdt.core.formatter.keep_lambda_body_block_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_block", "insert",
                v -> this.keep_lambda_body_block_on_one_line = insertToOneLine.get(v));
        }
        if (settings.get("org.eclipse.jdt.core.formatter.keep_code_block_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_block", "insert",
                v -> this.keep_code_block_on_one_line = insertToOneLine.get(v));
        }
        if (settings.get("org.eclipse.jdt.core.formatter.keep_enum_constant_declaration_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_enum_constant", "insert",
                v -> this.keep_enum_constant_declaration_on_one_line = insertToOneLine.get(v));
        }
        if (settings.get("org.eclipse.jdt.core.formatter.keep_enum_declaration_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_enum_declaration", "insert",
                v -> this.keep_enum_declaration_on_one_line = insertToOneLine.get(v));
        }
        if (settings.get("org.eclipse.jdt.core.formatter.keep_method_body_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_method_body", "insert",
                v -> this.keep_method_body_on_one_line = insertToOneLine.get(v));
        }
        if (settings.get("org.eclipse.jdt.core.formatter.keep_type_declaration_on_one_line") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_new_line_in_empty_type_declaration", "insert",
                v -> this.keep_type_declaration_on_one_line = insertToOneLine.get(v));
        }

        // alignment for binary expressions -> more granular settings
        if (settings.get("org.eclipse.jdt.core.formatter.alignment_for_multiplicative_operator") == null) {
            setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_binary_expression",
                v -> this.alignment_for_multiplicative_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.alignment_for_additive_operator") == null) {
            setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_binary_expression",
                v -> this.alignment_for_additive_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.alignment_for_string_concatenation") == null) {
            setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_binary_expression",
                v -> this.alignment_for_string_concatenation = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.alignment_for_bitwise_operator") == null) {
            setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_binary_expression",
                v -> this.alignment_for_bitwise_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.alignment_for_logical_operator") == null) {
            setInt(settings, "org.eclipse.jdt.core.formatter.alignment_for_binary_expression",
                v -> this.alignment_for_logical_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.wrap_before_multiplicative_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_binary_operator", "true",
                v -> this.wrap_before_multiplicative_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.wrap_before_additive_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_binary_operator", "true",
                v -> this.wrap_before_additive_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.wrap_before_string_concatenation") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_binary_operator", "true",
                v -> this.wrap_before_string_concatenation = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.wrap_before_bitwise_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_binary_operator", "true",
                v -> this.wrap_before_bitwise_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.wrap_before_logical_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.wrap_before_binary_operator", "true",
                v -> this.wrap_before_logical_operator = v);
        }

        // add space before and after binary operator -> more granular settings
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_before_multiplicative_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_binary_operator", "insert",
                v -> this.insert_space_before_multiplicative_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_before_additive_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_binary_operator", "insert",
                v -> this.insert_space_before_additive_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_before_string_concatenation") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_binary_operator", "insert",
                v -> this.insert_space_before_string_concatenation = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_before_shift_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_binary_operator", "insert",
                v -> this.insert_space_before_shift_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_before_relational_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_binary_operator", "insert",
                v -> this.insert_space_before_relational_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_before_bitwise_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_binary_operator", "insert",
                v -> this.insert_space_before_bitwise_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_before_logical_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_before_binary_operator", "insert",
                v -> this.insert_space_before_logical_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_after_multiplicative_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_binary_operator", "insert",
                v -> this.insert_space_after_multiplicative_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_after_additive_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_binary_operator", "insert",
                v -> this.insert_space_after_additive_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_after_string_concatenation") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_binary_operator", "insert",
                v -> this.insert_space_after_string_concatenation = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_after_shift_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_binary_operator", "insert",
                v -> this.insert_space_after_shift_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_after_relational_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_binary_operator", "insert",
                v -> this.insert_space_after_relational_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_after_bitwise_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_binary_operator", "insert",
                v -> this.insert_space_after_bitwise_operator = v);
        }
        if (settings.get("org.eclipse.jdt.core.formatter.insert_space_after_logical_operator") == null) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_binary_operator", "insert",
                v -> this.insert_space_after_logical_operator = v);
        }
    }

    /**
     * Handles new settings which may not be defined in an older profile, but are can be easily derived from other
     * settings to keep the behavior consistent with previous versions.
     */
    private void setDerivableOptions(Map<String, String> settings) {
        if (!settings.containsKey("org.eclipse.jdt.core.formatter.blank_lines_before_abstract_method")) {
            setInt(settings, "org.eclipse.jdt.core.formatter.blank_lines_before_method",
                v -> this.blank_lines_before_abstract_method = v);
        }
        if (!settings.containsKey("org.eclipse.jdt.core.formatter.insert_space_after_not_operator")) {
            setBoolean(settings, "org.eclipse.jdt.core.formatter.insert_space_after_unary_operator", "insert",
                v -> this.insert_space_after_not_operator = v);
        }
    }

    public void setDefaultSettings() {
        this.alignment_for_annotations_on_type = 1 | 48;
        this.alignment_for_type_annotations = 0;
        this.alignment_for_annotations_on_enum_constant = 1 | 48;
        this.alignment_for_annotations_on_field = 1 | 48;
        this.alignment_for_annotations_on_method = 1 | 48;
        this.alignment_for_annotations_on_package = 1 | 48;
        this.alignment_for_annotations_on_parameter = 0;
        this.alignment_for_annotations_on_local_variable = 1 | 48;
        this.alignment_for_arguments_in_allocation_expression = 16;
        this.alignment_for_arguments_in_annotation = 0;
        this.alignment_for_arguments_in_enum_constant = 16;
        this.alignment_for_arguments_in_explicit_constructor_call = 16;
        this.alignment_for_arguments_in_method_invocation = 16;
        this.alignment_for_arguments_in_qualified_allocation_expression = 16;
        this.alignment_for_assertion_message = 16;
        this.alignment_for_assignment = 0;
        this.alignment_for_multiplicative_operator = 16;
        this.alignment_for_additive_operator = 16;
        this.alignment_for_string_concatenation = 16;
        this.alignment_for_shift_operator = 0;
        this.alignment_for_relational_operator = 0;
        this.alignment_for_bitwise_operator = 16;
        this.alignment_for_logical_operator = 16;
        this.alignment_for_compact_if = 48 | 4;
        this.alignment_for_compact_loop = 48 | 4;
        this.alignment_for_conditional_expression = 48;
        this.alignment_for_conditional_expression_chain = 0;
        this.alignment_for_enum_constants = 0;
        this.alignment_for_expressions_in_array_initializer = 16;
        this.alignment_for_expressions_in_for_loop_header = 0;
        this.alignment_for_expressions_in_switch_case_with_arrow = 16;
        this.alignment_for_expressions_in_switch_case_with_colon = 16;
        this.alignment_for_method_declaration = 0;
        this.alignment_for_module_statements = 16;
        this.alignment_for_multiple_fields = 16;
        this.alignment_for_parameterized_type_references = 0;
        this.alignment_for_parameters_in_constructor_declaration = 16;
        this.alignment_for_parameters_in_method_declaration = 16;
        this.alignment_for_permitted_types_in_type_declaration = 16;
        this.alignment_for_record_components = 16;
        this.alignment_for_resources_in_try = 80;
        this.alignment_for_selector_in_method_invocation = 16;
        this.alignment_for_superclass_in_type_declaration = 64;
        this.alignment_for_superinterfaces_in_enum_declaration = 64;
        this.alignment_for_superinterfaces_in_record_declaration = 64;
        this.alignment_for_superinterfaces_in_type_declaration = 64;
        this.alignment_for_switch_case_with_arrow = 16 | 4;
        this.alignment_for_throws_clause_in_constructor_declaration = 16;
        this.alignment_for_throws_clause_in_method_declaration = 16;
        this.alignment_for_type_arguments = 0;
        this.alignment_for_type_parameters = 0;
        this.alignment_for_union_type_in_multicatch = 16;
        this.align_selector_in_method_invocation_on_expression_first_line = true;
        this.align_type_members_on_columns = false;
        this.align_variable_declarations_on_columns = false;
        this.align_assignment_statements_on_columns = false;
        this.align_arrows_in_switch_on_columns = false;
        this.align_with_spaces = false;
        this.align_fields_grouping_blank_lines = Integer.MAX_VALUE;
        this.brace_position_for_annotation_type_declaration = "end_of_line";
        this.brace_position_for_anonymous_type_declaration = "end_of_line";
        this.brace_position_for_array_initializer = "end_of_line";
        this.brace_position_for_block = "end_of_line";
        this.brace_position_for_block_in_case = "end_of_line";
        this.brace_position_for_block_in_case_after_arrow = "end_of_line";
        this.brace_position_for_constructor_declaration = "end_of_line";
        this.brace_position_for_enum_constant = "end_of_line";
        this.brace_position_for_enum_declaration = "end_of_line";
        this.brace_position_for_lambda_body = "end_of_line";
        this.brace_position_for_method_declaration = "end_of_line";
        this.brace_position_for_type_declaration = "end_of_line";
        this.brace_position_for_record_constructor = "end_of_line";
        this.brace_position_for_record_declaration = "end_of_line";
        this.brace_position_for_switch = "end_of_line";
        this.parenthesis_positions_in_method_declaration = "common_lines";
        this.parenthesis_positions_in_method_invocation = "common_lines";
        this.parenthesis_positions_in_enum_constant_declaration = "common_lines";
        this.parenthesis_positions_in_record_declaration = "common_lines";
        this.parenthesis_positions_in_if_while_statement = "common_lines";
        this.parenthesis_positions_in_for_statement = "common_lines";
        this.parenthesis_positions_in_switch_statement = "common_lines";
        this.parenthesis_positions_in_try_clause = "common_lines";
        this.parenthesis_positions_in_catch_clause = "common_lines";
        this.parenthesis_positions_in_annotation = "common_lines";
        this.parenthesis_positions_in_lambda_declaration = "common_lines";
        this.comment_clear_blank_lines_in_block_comment = false;
        this.comment_clear_blank_lines_in_javadoc_comment = false;
        this.comment_format_block_comment = true;
        this.comment_format_javadoc_comment = true;
        this.comment_format_markdown_comment = true;
        this.comment_format_line_comment = true;
        this.comment_format_line_comment_starting_on_first_column = true;
        this.comment_format_header = false;
        this.comment_format_html = true;
        this.comment_format_source = true;
        this.comment_indent_parameter_description = true;
        this.comment_indent_tag_description = false;
        this.comment_indent_root_tags = true;
        this.comment_align_tags_names_descriptions = false;
        this.comment_align_tags_descriptions_grouped = false;
        this.comment_insert_empty_line_before_root_tags = true;
        this.comment_insert_empty_line_between_different_tags = false;
        this.comment_insert_new_line_for_parameter = true;
        this.comment_new_lines_at_block_boundaries = true;
        this.comment_new_lines_at_javadoc_boundaries = true;
        this.comment_line_length = 80;
        this.comment_count_line_length_from_starting_position = true;
        this.comment_preserve_white_space_between_code_and_line_comments = false;
        this.continuation_indentation = 2;
        this.continuation_indentation_for_array_initializer = 2;
        this.blank_lines_after_imports = 0;
        this.blank_lines_after_package = 0;
        this.blank_lines_before_field = 0;
        this.blank_lines_before_first_class_body_declaration = 0;
        this.blank_lines_after_last_class_body_declaration = 0;
        this.blank_lines_before_imports = 0;
        this.blank_lines_before_member_type = 0;
        this.blank_lines_before_abstract_method = 0;
        this.blank_lines_before_method = 0;
        this.blank_lines_before_new_chunk = 0;
        this.blank_lines_before_package = 0;
        this.blank_lines_between_import_groups = 1;
        this.blank_lines_between_type_declarations = 0;
        this.blank_lines_at_beginning_of_method_body = 0;
        this.blank_lines_at_end_of_method_body = 0;
        this.blank_lines_at_beginning_of_code_block = 0;
        this.blank_lines_at_end_of_code_block = 0;
        this.blank_lines_before_code_block = 0;
        this.blank_lines_after_code_block = 0;
        this.blank_lines_between_statement_groups_in_switch = 0;
        this.indent_statements_compare_to_block = true;
        this.indent_statements_compare_to_body = true;
        this.indent_body_declarations_compare_to_annotation_declaration_header = true;
        this.indent_body_declarations_compare_to_enum_constant_header = true;
        this.indent_body_declarations_compare_to_enum_declaration_header = true;
        this.indent_body_declarations_compare_to_record_header = true;
        this.indent_body_declarations_compare_to_type_header = true;
        this.indent_breaks_compare_to_cases = true;
        this.indent_empty_lines = false;
        this.indent_switchstatements_compare_to_cases = true;
        this.indent_switchstatements_compare_to_switch = true;
        this.indentation_size = 4;
        this.insert_new_line_after_annotation_on_type = true;
        this.insert_new_line_after_type_annotation = false;
        this.insert_new_line_after_annotation_on_enum_constant = true;
        this.insert_new_line_after_annotation_on_field = true;
        this.insert_new_line_after_annotation_on_method = true;
        this.insert_new_line_after_annotation_on_package = true;
        this.insert_new_line_after_annotation_on_parameter = false;
        this.insert_new_line_after_annotation_on_record_parameter = false;
        this.insert_new_line_after_annotation_on_local_variable = true;
        this.insert_new_line_after_opening_brace_in_array_initializer = false;
        this.insert_new_line_at_end_of_file_if_missing = false;
        this.insert_new_line_before_catch_in_try_statement = false;
        this.insert_new_line_before_closing_brace_in_array_initializer = false;
        this.insert_new_line_before_else_in_if_statement = false;
        this.insert_new_line_before_finally_in_try_statement = false;
        this.insert_new_line_before_while_in_do_statement = false;
        this.keep_annotation_declaration_on_one_line = "one_line_never";
        this.keep_anonymous_type_declaration_on_one_line = "one_line_never";
        this.keep_if_then_body_block_on_one_line = "one_line_never";
        this.keep_switch_body_block_on_one_line = "one_line_never";
        this.keep_switch_case_with_arrow_on_one_line = "one_line_never";
        this.keep_lambda_body_block_on_one_line = "one_line_never";
        this.keep_loop_body_block_on_one_line = "one_line_never";
        this.keep_code_block_on_one_line = "one_line_never";
        this.keep_enum_constant_declaration_on_one_line = "one_line_never";
        this.keep_enum_declaration_on_one_line = "one_line_never";
        this.keep_method_body_on_one_line = "one_line_never";
        this.keep_type_declaration_on_one_line = "one_line_never";
        this.keep_record_declaration_on_one_line = "one_line_never";
        this.keep_record_constructor_on_one_line = "one_line_never";
        this.keep_simple_getter_setter_on_one_line = false;
        this.insert_space_after_and_in_type_parameter = true;
        this.insert_space_after_arrow_in_switch_case = true;
        this.insert_space_after_arrow_in_switch_default = true;
        this.insert_space_after_assignment_operator = true;
        this.insert_space_after_at_in_annotation = false;
        this.insert_space_after_at_in_annotation_type_declaration = false;
        this.insert_space_after_multiplicative_operator = true;
        this.insert_space_after_additive_operator = true;
        this.insert_space_after_string_concatenation = true;
        this.insert_space_after_shift_operator = true;
        this.insert_space_after_relational_operator = true;
        this.insert_space_after_bitwise_operator = true;
        this.insert_space_after_logical_operator = true;
        this.insert_space_after_closing_angle_bracket_in_type_arguments = false;
        this.insert_space_after_closing_angle_bracket_in_type_parameters = true;
        this.insert_space_after_closing_paren_in_cast = true;
        this.insert_space_after_closing_brace_in_block = true;
        this.insert_space_after_colon_in_assert = true;
        this.insert_space_after_colon_in_case = true;
        this.insert_space_after_colon_in_conditional = true;
        this.insert_space_after_colon_in_for = true;
        this.insert_space_after_colon_in_labeled_statement = true;
        this.insert_space_after_comma_in_allocation_expression = true;
        this.insert_space_after_comma_in_annotation = true;
        this.insert_space_after_comma_in_array_initializer = true;
        this.insert_space_after_comma_in_constructor_declaration_parameters = true;
        this.insert_space_after_comma_in_constructor_declaration_throws = true;
        this.insert_space_after_comma_in_enum_constant_arguments = true;
        this.insert_space_after_comma_in_enum_declarations = true;
        this.insert_space_after_comma_in_explicit_constructor_call_arguments = true;
        this.insert_space_after_comma_in_for_increments = true;
        this.insert_space_after_comma_in_for_inits = true;
        this.insert_space_after_comma_in_method_invocation_arguments = true;
        this.insert_space_after_comma_in_method_declaration_parameters = true;
        this.insert_space_after_comma_in_method_declaration_throws = true;
        this.insert_space_after_comma_in_multiple_field_declarations = true;
        this.insert_space_after_comma_in_multiple_local_declarations = true;
        this.insert_space_after_comma_in_parameterized_type_reference = true;
        this.insert_space_after_comma_in_permitted_types = true;
        this.insert_space_after_comma_in_record_components = true;
        this.insert_space_after_comma_in_superinterfaces = true;
        this.insert_space_after_comma_in_switch_case_expressions = true;
        this.insert_space_after_comma_in_type_arguments = true;
        this.insert_space_after_comma_in_type_parameters = true;
        this.insert_space_after_ellipsis = true;
        this.insert_space_after_lambda_arrow = true;
        this.insert_space_after_not_operator = false;
        this.insert_space_after_opening_angle_bracket_in_parameterized_type_reference = false;
        this.insert_space_after_opening_angle_bracket_in_type_arguments = false;
        this.insert_space_after_opening_angle_bracket_in_type_parameters = false;
        this.insert_space_after_opening_bracket_in_array_allocation_expression = false;
        this.insert_space_after_opening_bracket_in_array_reference = false;
        this.insert_space_after_opening_brace_in_array_initializer = false;
        this.insert_space_after_opening_paren_in_annotation = false;
        this.insert_space_after_opening_paren_in_cast = false;
        this.insert_space_after_opening_paren_in_catch = false;
        this.insert_space_after_opening_paren_in_constructor_declaration = false;
        this.insert_space_after_opening_paren_in_enum_constant = false;
        this.insert_space_after_opening_paren_in_for = false;
        this.insert_space_after_opening_paren_in_if = false;
        this.insert_space_after_opening_paren_in_method_declaration = false;
        this.insert_space_after_opening_paren_in_method_invocation = false;
        this.insert_space_after_opening_paren_in_parenthesized_expression = false;
        this.insert_space_after_opening_paren_in_record_declaration = false;
        this.insert_space_after_opening_paren_in_switch = false;
        this.insert_space_after_opening_paren_in_synchronized = false;
        this.insert_space_after_opening_paren_in_try = false;
        this.insert_space_after_opening_paren_in_while = false;
        this.insert_space_after_postfix_operator = false;
        this.insert_space_after_prefix_operator = false;
        this.insert_space_after_question_in_conditional = true;
        this.insert_space_after_question_in_wilcard = false;
        this.insert_space_after_semicolon_in_for = true;
        this.insert_space_after_semicolon_in_try_resources = true;
        this.insert_space_after_unary_operator = false;
        this.insert_space_before_and_in_type_parameter = true;
        this.insert_space_before_arrow_in_switch_case = true;
        this.insert_space_before_arrow_in_switch_default = true;
        this.insert_space_before_at_in_annotation_type_declaration = true;
        this.insert_space_before_assignment_operator = true;
        this.insert_space_before_multiplicative_operator = true;
        this.insert_space_before_additive_operator = true;
        this.insert_space_before_string_concatenation = true;
        this.insert_space_before_shift_operator = true;
        this.insert_space_before_relational_operator = true;
        this.insert_space_before_bitwise_operator = true;
        this.insert_space_before_logical_operator = true;
        this.insert_space_before_closing_angle_bracket_in_parameterized_type_reference = false;
        this.insert_space_before_closing_angle_bracket_in_type_arguments = false;
        this.insert_space_before_closing_angle_bracket_in_type_parameters = false;
        this.insert_space_before_closing_brace_in_array_initializer = false;
        this.insert_space_before_closing_bracket_in_array_allocation_expression = false;
        this.insert_space_before_closing_bracket_in_array_reference = false;
        this.insert_space_before_closing_paren_in_annotation = false;
        this.insert_space_before_closing_paren_in_cast = false;
        this.insert_space_before_closing_paren_in_catch = false;
        this.insert_space_before_closing_paren_in_constructor_declaration = false;
        this.insert_space_before_closing_paren_in_enum_constant = false;
        this.insert_space_before_closing_paren_in_for = false;
        this.insert_space_before_closing_paren_in_if = false;
        this.insert_space_before_closing_paren_in_method_declaration = false;
        this.insert_space_before_closing_paren_in_method_invocation = false;
        this.insert_space_before_closing_paren_in_parenthesized_expression = false;
        this.insert_space_before_closing_paren_in_record_declaration = false;
        this.insert_space_before_closing_paren_in_switch = false;
        this.insert_space_before_closing_paren_in_synchronized = false;
        this.insert_space_before_closing_paren_in_try = false;
        this.insert_space_before_closing_paren_in_while = false;
        this.insert_space_before_colon_in_assert = true;
        this.insert_space_before_colon_in_case = true;
        this.insert_space_before_colon_in_conditional = true;
        this.insert_space_before_colon_in_default = true;
        this.insert_space_before_colon_in_for = true;
        this.insert_space_before_colon_in_labeled_statement = true;
        this.insert_space_before_comma_in_allocation_expression = false;
        this.insert_space_before_comma_in_array_initializer = false;
        this.insert_space_before_comma_in_constructor_declaration_parameters = false;
        this.insert_space_before_comma_in_constructor_declaration_throws = false;
        this.insert_space_before_comma_in_enum_constant_arguments = false;
        this.insert_space_before_comma_in_enum_declarations = false;
        this.insert_space_before_comma_in_explicit_constructor_call_arguments = false;
        this.insert_space_before_comma_in_for_increments = false;
        this.insert_space_before_comma_in_for_inits = false;
        this.insert_space_before_comma_in_method_invocation_arguments = false;
        this.insert_space_before_comma_in_method_declaration_parameters = false;
        this.insert_space_before_comma_in_method_declaration_throws = false;
        this.insert_space_before_comma_in_multiple_field_declarations = false;
        this.insert_space_before_comma_in_multiple_local_declarations = false;
        this.insert_space_before_comma_in_parameterized_type_reference = false;
        this.insert_space_before_comma_in_permitted_types = false;
        this.insert_space_before_comma_in_record_components = false;
        this.insert_space_before_comma_in_superinterfaces = false;
        this.insert_space_before_comma_in_switch_case_expressions = false;
        this.insert_space_before_comma_in_type_arguments = false;
        this.insert_space_before_comma_in_type_parameters = false;
        this.insert_space_before_ellipsis = false;
        this.insert_space_before_lambda_arrow = true;
        this.insert_space_before_parenthesized_expression_in_return = true;
        this.insert_space_before_parenthesized_expression_in_throw = true;
        this.insert_space_before_opening_angle_bracket_in_parameterized_type_reference = false;
        this.insert_space_before_opening_angle_bracket_in_type_arguments = false;
        this.insert_space_before_opening_angle_bracket_in_type_parameters = false;
        this.insert_space_before_opening_brace_in_annotation_type_declaration = true;
        this.insert_space_before_opening_brace_in_anonymous_type_declaration = true;
        this.insert_space_before_opening_brace_in_array_initializer = false;
        this.insert_space_before_opening_brace_in_block = true;
        this.insert_space_before_opening_brace_in_constructor_declaration = true;
        this.insert_space_before_opening_brace_in_enum_constant = true;
        this.insert_space_before_opening_brace_in_enum_declaration = true;
        this.insert_space_before_opening_brace_in_method_declaration = true;
        this.insert_space_before_opening_brace_in_record_constructor = true;
        this.insert_space_before_opening_brace_in_record_declaration = true;
        this.insert_space_before_opening_brace_in_switch = true;
        this.insert_space_before_opening_brace_in_type_declaration = true;
        this.insert_space_before_opening_bracket_in_array_allocation_expression = false;
        this.insert_space_before_opening_bracket_in_array_reference = false;
        this.insert_space_before_opening_bracket_in_array_type_reference = false;
        this.insert_space_before_opening_paren_in_annotation = false;
        this.insert_space_before_opening_paren_in_annotation_type_member_declaration = false;
        this.insert_space_before_opening_paren_in_catch = true;
        this.insert_space_before_opening_paren_in_constructor_declaration = false;
        this.insert_space_before_opening_paren_in_enum_constant = false;
        this.insert_space_before_opening_paren_in_for = true;
        this.insert_space_before_opening_paren_in_if = true;
        this.insert_space_before_opening_paren_in_method_invocation = false;
        this.insert_space_before_opening_paren_in_method_declaration = false;
        this.insert_space_before_opening_paren_in_record_declaration = false;
        this.insert_space_before_opening_paren_in_switch = true;
        this.insert_space_before_opening_paren_in_synchronized = true;
        this.insert_space_before_opening_paren_in_try = true;
        this.insert_space_before_opening_paren_in_parenthesized_expression = false;
        this.insert_space_before_opening_paren_in_while = true;
        this.insert_space_before_postfix_operator = false;
        this.insert_space_before_prefix_operator = false;
        this.insert_space_before_question_in_conditional = true;
        this.insert_space_before_question_in_wilcard = false;
        this.insert_space_before_semicolon = false;
        this.insert_space_before_semicolon_in_for = false;
        this.insert_space_before_semicolon_in_try_resources = false;
        this.insert_space_before_unary_operator = false;
        this.insert_space_between_brackets_in_array_type_reference = false;
        this.insert_space_between_empty_braces_in_array_initializer = false;
        this.insert_space_between_empty_brackets_in_array_allocation_expression = false;
        this.insert_space_between_empty_parens_in_annotation_type_member_declaration = false;
        this.insert_space_between_empty_parens_in_constructor_declaration = false;
        this.insert_space_between_empty_parens_in_enum_constant = false;
        this.insert_space_between_empty_parens_in_method_declaration = false;
        this.insert_space_between_empty_parens_in_method_invocation = false;
        this.compact_else_if = true;
        this.keep_guardian_clause_on_one_line = false;
        this.keep_else_statement_on_same_line = false;
        this.keep_empty_array_initializer_on_one_line = false;
        this.keep_simple_if_on_one_line = false;
        this.keep_then_statement_on_same_line = false;
        this.keep_simple_for_body_on_same_line = false;
        this.keep_simple_while_body_on_same_line = false;
        this.keep_simple_do_while_body_on_same_line = false;
        this.never_indent_block_comments_on_first_column = false;
        this.never_indent_line_comments_on_first_column = false;
        this.number_of_empty_lines_to_preserve = 1;
        this.join_lines_in_comments = true;
        this.join_line_comments = false;
        this.join_wrapped_lines = true;
        this.put_empty_statement_on_new_line = false;
        this.put_text_block_quotes_on_new_line = false;
        this.tab_size = 4;
        this.page_width = 120;
        this.tab_char = 1; // see https://bugs.eclipse.org/bugs/show_bug.cgi?id=49081
        this.use_tabs_only_for_leading_indentations = false;
        this.text_block_indentation = 0;
        this.wrap_before_multiplicative_operator = true;
        this.wrap_before_additive_operator = true;
        this.wrap_before_assertion_message_operator = true;
        this.wrap_before_string_concatenation = true;
        this.wrap_before_shift_operator = true;
        this.wrap_before_relational_operator = true;
        this.wrap_before_bitwise_operator = true;
        this.wrap_before_logical_operator = true;
        this.wrap_before_or_operator_multicatch = true;
        this.wrap_before_conditional_operator = true;
        this.wrap_before_assignment_operator = false;
        this.wrap_before_switch_case_arrow_operator = false;
        this.use_tags = true;
        this.disabling_tag = DEFAULT_DISABLING_TAG;
        this.enabling_tag = DEFAULT_ENABLING_TAG;
        this.wrap_outer_expressions_when_nested = true;
    }

    public void setJavaConventionsSettings() {
        this.alignment_for_annotations_on_type = 1 | 48;
        this.alignment_for_type_annotations = 0;
        this.alignment_for_annotations_on_enum_constant = 1 | 48;
        this.alignment_for_annotations_on_field = 1 | 48;
        this.alignment_for_annotations_on_method = 1 | 48;
        this.alignment_for_annotations_on_package = 1 | 48;
        this.alignment_for_annotations_on_parameter = 0;
        this.alignment_for_annotations_on_local_variable = 1 | 48;
        this.alignment_for_arguments_in_allocation_expression = 16;
        this.alignment_for_arguments_in_annotation = 0;
        this.alignment_for_arguments_in_enum_constant = 16;
        this.alignment_for_arguments_in_explicit_constructor_call = 16;
        this.alignment_for_arguments_in_method_invocation = 16;
        this.alignment_for_arguments_in_qualified_allocation_expression = 16;
        this.alignment_for_assertion_message = 16;
        this.alignment_for_assignment = 0;
        this.alignment_for_multiplicative_operator = 16;
        this.alignment_for_additive_operator = 16;
        this.alignment_for_string_concatenation = 16;
        this.alignment_for_shift_operator = 0;
        this.alignment_for_relational_operator = 0;
        this.alignment_for_bitwise_operator = 16;
        this.alignment_for_logical_operator = 16;
        this.alignment_for_compact_if = 16;
        this.alignment_for_compact_loop = 16;
        this.alignment_for_conditional_expression = 80;
        this.alignment_for_conditional_expression_chain = 0;
        this.alignment_for_enum_constants = 16;
        this.alignment_for_expressions_in_array_initializer = 16;
        this.alignment_for_expressions_in_for_loop_header = 0;
        this.alignment_for_expressions_in_switch_case_with_arrow = 16;
        this.alignment_for_expressions_in_switch_case_with_colon = 16;
        this.alignment_for_method_declaration = 0;
        this.alignment_for_module_statements = 16;
        this.alignment_for_multiple_fields = 16;
        this.alignment_for_parameterized_type_references = 0;
        this.alignment_for_parameters_in_constructor_declaration = 16;
        this.alignment_for_parameters_in_method_declaration = 16;
        this.alignment_for_permitted_types_in_type_declaration = 16;
        this.alignment_for_record_components = 16;
        this.alignment_for_resources_in_try = 80;
        this.alignment_for_selector_in_method_invocation = 16;
        this.alignment_for_superclass_in_type_declaration = 16;
        this.alignment_for_superinterfaces_in_enum_declaration = 16;
        this.alignment_for_superinterfaces_in_record_declaration = 16;
        this.alignment_for_superinterfaces_in_type_declaration = 16;
        this.alignment_for_switch_case_with_arrow = 16 | 4;
        this.alignment_for_throws_clause_in_constructor_declaration = 16;
        this.alignment_for_throws_clause_in_method_declaration = 16;
        this.alignment_for_type_arguments = 0;
        this.alignment_for_type_parameters = 0;
        this.alignment_for_union_type_in_multicatch = 16;
        this.align_selector_in_method_invocation_on_expression_first_line = true;
        this.align_type_members_on_columns = false;
        this.align_variable_declarations_on_columns = false;
        this.align_assignment_statements_on_columns = false;
        this.align_arrows_in_switch_on_columns = false;
        this.align_with_spaces = false;
        this.align_fields_grouping_blank_lines = Integer.MAX_VALUE;
        this.brace_position_for_annotation_type_declaration = "end_of_line";
        this.brace_position_for_anonymous_type_declaration = "end_of_line";
        this.brace_position_for_array_initializer = "end_of_line";
        this.brace_position_for_block = "end_of_line";
        this.brace_position_for_block_in_case = "end_of_line";
        this.brace_position_for_block_in_case_after_arrow = "end_of_line";
        this.brace_position_for_constructor_declaration = "end_of_line";
        this.brace_position_for_enum_constant = "end_of_line";
        this.brace_position_for_enum_declaration = "end_of_line";
        this.brace_position_for_lambda_body = "end_of_line";
        this.brace_position_for_method_declaration = "end_of_line";
        this.brace_position_for_type_declaration = "end_of_line";
        this.brace_position_for_record_constructor = "end_of_line";
        this.brace_position_for_record_declaration = "end_of_line";
        this.brace_position_for_switch = "end_of_line";
        this.parenthesis_positions_in_method_declaration = "common_lines";
        this.parenthesis_positions_in_method_invocation = "common_lines";
        this.parenthesis_positions_in_enum_constant_declaration = "common_lines";
        this.parenthesis_positions_in_record_declaration = "common_lines";
        this.parenthesis_positions_in_if_while_statement = "common_lines";
        this.parenthesis_positions_in_for_statement = "common_lines";
        this.parenthesis_positions_in_switch_statement = "common_lines";
        this.parenthesis_positions_in_try_clause = "common_lines";
        this.parenthesis_positions_in_catch_clause = "common_lines";
        this.parenthesis_positions_in_annotation = "common_lines";
        this.parenthesis_positions_in_lambda_declaration = "common_lines";
        this.comment_clear_blank_lines_in_block_comment = false;
        this.comment_clear_blank_lines_in_javadoc_comment = false;
        this.comment_format_block_comment = true;
        this.comment_format_javadoc_comment = true;
        this.comment_format_markdown_comment = true;
        this.comment_format_line_comment = true;
        this.comment_format_line_comment_starting_on_first_column = false;
        this.comment_format_header = false;
        this.comment_format_html = true;
        this.comment_format_source = true;
        this.comment_indent_parameter_description = false;
        this.comment_indent_tag_description = false;
        this.comment_indent_root_tags = false;
        this.comment_align_tags_names_descriptions = false;
        this.comment_align_tags_descriptions_grouped = true;
        this.comment_insert_empty_line_before_root_tags = true;
        this.comment_insert_empty_line_between_different_tags = false;
        this.comment_insert_new_line_for_parameter = false;
        this.comment_new_lines_at_block_boundaries = true;
        this.comment_new_lines_at_javadoc_boundaries = true;
        this.comment_line_length = 80;
        this.comment_count_line_length_from_starting_position = true;
        this.comment_preserve_white_space_between_code_and_line_comments = false;
        this.continuation_indentation = 2;
        this.continuation_indentation_for_array_initializer = 2;
        this.blank_lines_after_imports = 1;
        this.blank_lines_after_package = 1;
        this.blank_lines_before_field = 0;
        this.blank_lines_before_first_class_body_declaration = 0;
        this.blank_lines_after_last_class_body_declaration = 0;
        this.blank_lines_before_imports = 1;
        this.blank_lines_before_member_type = 1;
        this.blank_lines_before_abstract_method = 1;
        this.blank_lines_before_method = 1;
        this.blank_lines_before_new_chunk = 1;
        this.blank_lines_before_package = 0;
        this.blank_lines_between_import_groups = 1;
        this.blank_lines_between_type_declarations = 1;
        this.blank_lines_at_beginning_of_method_body = 0;
        this.blank_lines_at_end_of_method_body = 0;
        this.blank_lines_at_beginning_of_code_block = 0;
        this.blank_lines_at_end_of_code_block = 0;
        this.blank_lines_before_code_block = 0;
        this.blank_lines_after_code_block = 0;
        this.blank_lines_between_statement_groups_in_switch = 0;
        this.indent_statements_compare_to_block = true;
        this.indent_statements_compare_to_body = true;
        this.indent_body_declarations_compare_to_annotation_declaration_header = true;
        this.indent_body_declarations_compare_to_enum_constant_header = true;
        this.indent_body_declarations_compare_to_enum_declaration_header = true;
        this.indent_body_declarations_compare_to_record_header = true;
        this.indent_body_declarations_compare_to_type_header = true;
        this.indent_breaks_compare_to_cases = true;
        this.indent_empty_lines = false;
        this.indent_switchstatements_compare_to_cases = true;
        this.indent_switchstatements_compare_to_switch = false;
        this.indentation_size = 4;
        this.insert_new_line_after_annotation_on_type = true;
        this.insert_new_line_after_type_annotation = false;
        this.insert_new_line_after_annotation_on_enum_constant = true;
        this.insert_new_line_after_annotation_on_field = true;
        this.insert_new_line_after_annotation_on_method = true;
        this.insert_new_line_after_annotation_on_package = true;
        this.insert_new_line_after_annotation_on_parameter = false;
        this.insert_new_line_after_annotation_on_record_parameter = false;
        this.insert_new_line_after_annotation_on_local_variable = true;
        this.insert_new_line_after_opening_brace_in_array_initializer = false;
        this.insert_new_line_at_end_of_file_if_missing = false;
        this.insert_new_line_before_catch_in_try_statement = false;
        this.insert_new_line_before_closing_brace_in_array_initializer = false;
        this.insert_new_line_before_else_in_if_statement = false;
        this.insert_new_line_before_finally_in_try_statement = false;
        this.insert_new_line_before_while_in_do_statement = false;
        this.keep_annotation_declaration_on_one_line = "one_line_never";
        this.keep_anonymous_type_declaration_on_one_line = "one_line_never";
        this.keep_if_then_body_block_on_one_line = "one_line_never";
        this.keep_switch_body_block_on_one_line = "one_line_never";
        this.keep_switch_case_with_arrow_on_one_line = "one_line_never";
        this.keep_lambda_body_block_on_one_line = "one_line_never";
        this.keep_loop_body_block_on_one_line = "one_line_never";
        this.keep_code_block_on_one_line = "one_line_never";
        this.keep_enum_constant_declaration_on_one_line = "one_line_never";
        this.keep_enum_declaration_on_one_line = "one_line_never";
        this.keep_method_body_on_one_line = "one_line_never";
        this.keep_type_declaration_on_one_line = "one_line_never";
        this.keep_record_declaration_on_one_line = "one_line_never";
        this.keep_record_constructor_on_one_line = "one_line_never";
        this.keep_simple_getter_setter_on_one_line = false;
        this.insert_space_after_and_in_type_parameter = true;
        this.insert_space_after_arrow_in_switch_case = true;
        this.insert_space_after_arrow_in_switch_default = true;
        this.insert_space_after_assignment_operator = true;
        this.insert_space_after_at_in_annotation = false;
        this.insert_space_after_at_in_annotation_type_declaration = false;
        this.insert_space_after_multiplicative_operator = true;
        this.insert_space_after_additive_operator = true;
        this.insert_space_after_string_concatenation = true;
        this.insert_space_after_shift_operator = true;
        this.insert_space_after_relational_operator = true;
        this.insert_space_after_bitwise_operator = true;
        this.insert_space_after_logical_operator = true;
        this.insert_space_after_closing_angle_bracket_in_type_arguments = false;
        this.insert_space_after_closing_angle_bracket_in_type_parameters = true;
        this.insert_space_after_closing_paren_in_cast = true;
        this.insert_space_after_closing_brace_in_block = true;
        this.insert_space_after_colon_in_assert = true;
        this.insert_space_after_colon_in_case = true;
        this.insert_space_after_colon_in_conditional = true;
        this.insert_space_after_colon_in_for = true;
        this.insert_space_after_colon_in_labeled_statement = true;
        this.insert_space_after_comma_in_allocation_expression = true;
        this.insert_space_after_comma_in_annotation = true;
        this.insert_space_after_comma_in_array_initializer = true;
        this.insert_space_after_comma_in_constructor_declaration_parameters = true;
        this.insert_space_after_comma_in_constructor_declaration_throws = true;
        this.insert_space_after_comma_in_enum_constant_arguments = true;
        this.insert_space_after_comma_in_enum_declarations = true;
        this.insert_space_after_comma_in_explicit_constructor_call_arguments = true;
        this.insert_space_after_comma_in_for_increments = true;
        this.insert_space_after_comma_in_for_inits = true;
        this.insert_space_after_comma_in_method_invocation_arguments = true;
        this.insert_space_after_comma_in_method_declaration_parameters = true;
        this.insert_space_after_comma_in_method_declaration_throws = true;
        this.insert_space_after_comma_in_multiple_field_declarations = true;
        this.insert_space_after_comma_in_multiple_local_declarations = true;
        this.insert_space_after_comma_in_parameterized_type_reference = true;
        this.insert_space_after_comma_in_permitted_types = true;
        this.insert_space_after_comma_in_record_components = true;
        this.insert_space_after_comma_in_superinterfaces = true;
        this.insert_space_after_comma_in_switch_case_expressions = true;
        this.insert_space_after_comma_in_type_arguments = true;
        this.insert_space_after_comma_in_type_parameters = true;
        this.insert_space_after_ellipsis = true;
        this.insert_space_after_lambda_arrow = true;
        this.insert_space_after_not_operator = false;
        this.insert_space_after_opening_angle_bracket_in_parameterized_type_reference = false;
        this.insert_space_after_opening_angle_bracket_in_type_arguments = false;
        this.insert_space_after_opening_angle_bracket_in_type_parameters = false;
        this.insert_space_after_opening_bracket_in_array_allocation_expression = false;
        this.insert_space_after_opening_bracket_in_array_reference = false;
        this.insert_space_after_opening_brace_in_array_initializer = true;
        this.insert_space_after_opening_paren_in_annotation = false;
        this.insert_space_after_opening_paren_in_cast = false;
        this.insert_space_after_opening_paren_in_catch = false;
        this.insert_space_after_opening_paren_in_constructor_declaration = false;
        this.insert_space_after_opening_paren_in_enum_constant = false;
        this.insert_space_after_opening_paren_in_for = false;
        this.insert_space_after_opening_paren_in_if = false;
        this.insert_space_after_opening_paren_in_method_declaration = false;
        this.insert_space_after_opening_paren_in_method_invocation = false;
        this.insert_space_after_opening_paren_in_parenthesized_expression = false;
        this.insert_space_after_opening_paren_in_record_declaration = false;
        this.insert_space_after_opening_paren_in_switch = false;
        this.insert_space_after_opening_paren_in_synchronized = false;
        this.insert_space_after_opening_paren_in_try = false;
        this.insert_space_after_opening_paren_in_while = false;
        this.insert_space_after_postfix_operator = false;
        this.insert_space_after_prefix_operator = false;
        this.insert_space_after_question_in_conditional = true;
        this.insert_space_after_question_in_wilcard = false;
        this.insert_space_after_semicolon_in_for = true;
        this.insert_space_after_semicolon_in_try_resources = true;
        this.insert_space_after_unary_operator = false;
        this.insert_space_before_and_in_type_parameter = true;
        this.insert_space_before_arrow_in_switch_case = true;
        this.insert_space_before_arrow_in_switch_default = true;
        this.insert_space_before_at_in_annotation_type_declaration = true;
        this.insert_space_before_assignment_operator = true;
        this.insert_space_before_multiplicative_operator = true;
        this.insert_space_before_additive_operator = true;
        this.insert_space_before_string_concatenation = true;
        this.insert_space_before_shift_operator = true;
        this.insert_space_before_relational_operator = true;
        this.insert_space_before_bitwise_operator = true;
        this.insert_space_before_logical_operator = true;
        this.insert_space_before_closing_angle_bracket_in_parameterized_type_reference = false;
        this.insert_space_before_closing_angle_bracket_in_type_arguments = false;
        this.insert_space_before_closing_angle_bracket_in_type_parameters = false;
        this.insert_space_before_closing_brace_in_array_initializer = true;
        this.insert_space_before_closing_bracket_in_array_allocation_expression = false;
        this.insert_space_before_closing_bracket_in_array_reference = false;
        this.insert_space_before_closing_paren_in_annotation = false;
        this.insert_space_before_closing_paren_in_cast = false;
        this.insert_space_before_closing_paren_in_catch = false;
        this.insert_space_before_closing_paren_in_constructor_declaration = false;
        this.insert_space_before_closing_paren_in_enum_constant = false;
        this.insert_space_before_closing_paren_in_for = false;
        this.insert_space_before_closing_paren_in_if = false;
        this.insert_space_before_closing_paren_in_method_declaration = false;
        this.insert_space_before_closing_paren_in_method_invocation = false;
        this.insert_space_before_closing_paren_in_parenthesized_expression = false;
        this.insert_space_before_closing_paren_in_record_declaration = false;
        this.insert_space_before_closing_paren_in_switch = false;
        this.insert_space_before_closing_paren_in_synchronized = false;
        this.insert_space_before_closing_paren_in_try = false;
        this.insert_space_before_closing_paren_in_while = false;
        this.insert_space_before_colon_in_assert = true;
        this.insert_space_before_colon_in_case = false;
        this.insert_space_before_colon_in_conditional = true;
        this.insert_space_before_colon_in_default = false;
        this.insert_space_before_colon_in_for = true;
        this.insert_space_before_colon_in_labeled_statement = false;
        this.insert_space_before_comma_in_allocation_expression = false;
        this.insert_space_before_comma_in_array_initializer = false;
        this.insert_space_before_comma_in_constructor_declaration_parameters = false;
        this.insert_space_before_comma_in_constructor_declaration_throws = false;
        this.insert_space_before_comma_in_enum_constant_arguments = false;
        this.insert_space_before_comma_in_enum_declarations = false;
        this.insert_space_before_comma_in_explicit_constructor_call_arguments = false;
        this.insert_space_before_comma_in_for_increments = false;
        this.insert_space_before_comma_in_for_inits = false;
        this.insert_space_before_comma_in_method_invocation_arguments = false;
        this.insert_space_before_comma_in_method_declaration_parameters = false;
        this.insert_space_before_comma_in_method_declaration_throws = false;
        this.insert_space_before_comma_in_multiple_field_declarations = false;
        this.insert_space_before_comma_in_multiple_local_declarations = false;
        this.insert_space_before_comma_in_parameterized_type_reference = false;
        this.insert_space_before_comma_in_permitted_types = false;
        this.insert_space_before_comma_in_record_components = false;
        this.insert_space_before_comma_in_superinterfaces = false;
        this.insert_space_before_comma_in_switch_case_expressions = false;
        this.insert_space_before_comma_in_type_arguments = false;
        this.insert_space_before_comma_in_type_parameters = false;
        this.insert_space_before_ellipsis = false;
        this.insert_space_before_lambda_arrow = true;
        this.insert_space_before_parenthesized_expression_in_return = true;
        this.insert_space_before_parenthesized_expression_in_throw = true;
        this.insert_space_before_opening_angle_bracket_in_parameterized_type_reference = false;
        this.insert_space_before_opening_angle_bracket_in_type_arguments = false;
        this.insert_space_before_opening_angle_bracket_in_type_parameters = false;
        this.insert_space_before_opening_brace_in_annotation_type_declaration = true;
        this.insert_space_before_opening_brace_in_anonymous_type_declaration = true;
        this.insert_space_before_opening_brace_in_array_initializer = true;
        this.insert_space_before_opening_brace_in_block = true;
        this.insert_space_before_opening_brace_in_constructor_declaration = true;
        this.insert_space_before_opening_brace_in_enum_constant = true;
        this.insert_space_before_opening_brace_in_enum_declaration = true;
        this.insert_space_before_opening_brace_in_method_declaration = true;
        this.insert_space_before_opening_brace_in_record_constructor = true;
        this.insert_space_before_opening_brace_in_record_declaration = true;
        this.insert_space_before_opening_brace_in_switch = true;
        this.insert_space_before_opening_brace_in_type_declaration = true;
        this.insert_space_before_opening_bracket_in_array_allocation_expression = false;
        this.insert_space_before_opening_bracket_in_array_reference = false;
        this.insert_space_before_opening_bracket_in_array_type_reference = false;
        this.insert_space_before_opening_paren_in_annotation = false;
        this.insert_space_before_opening_paren_in_annotation_type_member_declaration = false;
        this.insert_space_before_opening_paren_in_catch = true;
        this.insert_space_before_opening_paren_in_constructor_declaration = false;
        this.insert_space_before_opening_paren_in_enum_constant = false;
        this.insert_space_before_opening_paren_in_for = true;
        this.insert_space_before_opening_paren_in_if = true;
        this.insert_space_before_opening_paren_in_method_invocation = false;
        this.insert_space_before_opening_paren_in_method_declaration = false;
        this.insert_space_before_opening_paren_in_record_declaration = false;
        this.insert_space_before_opening_paren_in_switch = true;
        this.insert_space_before_opening_paren_in_synchronized = true;
        this.insert_space_before_opening_paren_in_try = true;
        this.insert_space_before_opening_paren_in_parenthesized_expression = false;
        this.insert_space_before_opening_paren_in_while = true;
        this.insert_space_before_postfix_operator = false;
        this.insert_space_before_prefix_operator = false;
        this.insert_space_before_question_in_conditional = true;
        this.insert_space_before_question_in_wilcard = false;
        this.insert_space_before_semicolon = false;
        this.insert_space_before_semicolon_in_for = false;
        this.insert_space_before_semicolon_in_try_resources = false;
        this.insert_space_before_unary_operator = false;
        this.insert_space_between_brackets_in_array_type_reference = false;
        this.insert_space_between_empty_braces_in_array_initializer = false;
        this.insert_space_between_empty_brackets_in_array_allocation_expression = false;
        this.insert_space_between_empty_parens_in_annotation_type_member_declaration = false;
        this.insert_space_between_empty_parens_in_constructor_declaration = false;
        this.insert_space_between_empty_parens_in_enum_constant = false;
        this.insert_space_between_empty_parens_in_method_declaration = false;
        this.insert_space_between_empty_parens_in_method_invocation = false;
        this.compact_else_if = true;
        this.keep_guardian_clause_on_one_line = false;
        this.keep_else_statement_on_same_line = false;
        this.keep_empty_array_initializer_on_one_line = false;
        this.keep_simple_if_on_one_line = false;
        this.keep_then_statement_on_same_line = false;
        this.keep_simple_for_body_on_same_line = false;
        this.keep_simple_while_body_on_same_line = false;
        this.keep_simple_do_while_body_on_same_line = false;
        this.never_indent_block_comments_on_first_column = false;
        this.never_indent_line_comments_on_first_column = false;
        this.number_of_empty_lines_to_preserve = 1;
        this.join_lines_in_comments = true;
        this.join_line_comments = false;
        this.join_wrapped_lines = true;
        this.put_empty_statement_on_new_line = true;
        this.put_text_block_quotes_on_new_line = false;
        this.tab_size = 8;
        this.page_width = 120;
        this.tab_char = 4;
        this.use_tabs_only_for_leading_indentations = false;
        this.text_block_indentation = 0;
        this.wrap_before_multiplicative_operator = true;
        this.wrap_before_additive_operator = true;
        this.wrap_before_assertion_message_operator = true;
        this.wrap_before_string_concatenation = true;
        this.wrap_before_shift_operator = true;
        this.wrap_before_relational_operator = true;
        this.wrap_before_bitwise_operator = true;
        this.wrap_before_logical_operator = true;
        this.wrap_before_or_operator_multicatch = true;
        this.wrap_before_conditional_operator = true;
        this.wrap_before_assignment_operator = false;
        this.wrap_before_switch_case_arrow_operator = false;
        this.use_tags = true;
        this.disabling_tag = DEFAULT_DISABLING_TAG;
        this.enabling_tag = DEFAULT_ENABLING_TAG;
        this.wrap_outer_expressions_when_nested = true;
    }
}
