// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    /// <summary>
    /// Represents a FormattableString literal expression such as $"foo{bar}"
    /// Constructed by a format string which should look like "foo{0}"
    /// and a list of arguments of ValueExpressions
    /// The constructor throws IndexOutOfRangeException when the count of arguments does not match in the format string and argument list.
    /// </summary>
    internal sealed record FormattableStringExpression : ValueExpression
    {
        public FormattableStringExpression(string format, IReadOnlyList<ValueExpression> args)
        {
#if DEBUG
            Validate(format, args);
#endif
            Format = format;
            Args = args;
        }

        public FormattableStringExpression(string format, params ValueExpression[] args) : this(format, args as IReadOnlyList<ValueExpression>)
        {
        }

        public string Format { get; init; }
        public IReadOnlyList<ValueExpression> Args { get; init; }

        public void Deconstruct(out string format, out IReadOnlyList<ValueExpression> args)
        {
            format = Format;
            args = Args;
        }

        private static void Validate(string format, IReadOnlyList<ValueExpression> args)
        {
            var count = 0;
            foreach (var (_, isLiteral) in StringExtensions.GetPathParts(format))
            {
                if (!isLiteral)
                    count++;
            }

            if (count != args.Count)
            {
                throw new IndexOutOfRangeException($"The count of arguments in format {format} does not match with the arguments provided");
            }
        }
    }
}
