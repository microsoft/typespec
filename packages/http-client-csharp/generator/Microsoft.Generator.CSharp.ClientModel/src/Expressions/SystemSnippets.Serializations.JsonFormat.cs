// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.ClientModel.OutputTypes;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal static partial class SystemSnippets
    {
        internal static StringExpression JsonFormatSerialization = Literal("J");
        internal static StringExpression WireFormat = Literal("W");

        /// <summary>
        /// Produces the validation body statements for the JSON serialization format.
        /// </summary>
        internal static MethodBodyStatement ValidateJsonFormat(ModelReaderWriterOptionsExpression options, CSharpType iModelTInterface, SerializationFormatValidationType validationType)
        {
            if (!iModelTInterface.IsGenericType)
            {
                throw new InvalidOperationException($"The interface {iModelTInterface.Name} must contain arguments.");
            }

            /*
                var format = options.Format == "W" ? GetFormatFromOptions(options) : options.Format;
                if (format != <formatValue>)
                {
                    throw new FormatException($"The model {nameof(ThisModel)} does not support '{format}' format.");
                }
            */
            MethodBodyStatement[] statements = new MethodBodyStatement[]
            {
                GetConcreteFormat(options, iModelTInterface, out TypedValueExpression format),
                new IfStatement(NotEqual(format, JsonFormatSerialization))
                {
                    ThrowValidationFailException(format, iModelTInterface.Arguments[0], validationType)
                },
                new EmptyLineStatement()
            };

            return statements;
        }

        internal static MethodBodyStatement GetConcreteFormat(ModelReaderWriterOptionsExpression options, CSharpType iModelTInterface, out TypedValueExpression format)
            => Var("format", new TypedTernaryConditionalOperator(
                Equal(options.Format, WireFormat),
                new StringExpression(This.CastTo(iModelTInterface).Invoke(nameof(IPersistableModel<object>.GetFormatFromOptions), options)),
                options.Format), out format);

        internal static MethodBodyStatement ThrowValidationFailException(ValueExpression format, CSharpType typeOfT, SerializationFormatValidationType validationType)
            => Throw(New.Instance(
                typeof(FormatException),
                new FormattableStringExpression($"The model {{{0}}} does not support {(validationType == SerializationFormatValidationType.Write ? "writing" : "reading")} '{{{1}}}' format.", new[]
                {
                    Nameof(typeOfT),
                    format
                })));
    }
}
