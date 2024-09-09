// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Primitives;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.ClientModel.Snippets.ModelSerializationExtensionsSnippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal sealed class ModelSerializationExtensionsDefinition : TypeProvider
    {
        private const string WriteStringValueMethodName = "WriteStringValue";
        private const string WriteBase64StringValueMethodName = "WriteBase64StringValue";
        private const string WriteNumberValueMethodName = "WriteNumberValue";
        private const string WriteObjectValueMethodName = "WriteObjectValue";
        private class WriteObjectValueTemplate<T> { }

        private readonly CSharpType _t = typeof(WriteObjectValueTemplate<>).GetGenericArguments()[0];

        private readonly MethodSignatureModifiers _methodModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension;
        private readonly ParameterProvider _formatParameter = new ParameterProvider("format", FormattableStringHelpers.Empty, typeof(string));
        private readonly ParameterProvider _propertyParameter = new ParameterProvider("property", FormattableStringHelpers.Empty, typeof(JsonProperty));

        public ModelSerializationExtensionsDefinition()
        {
            _wireOptionsField = new FieldProvider(
                modifiers: FieldModifiers.Internal | FieldModifiers.Static | FieldModifiers.ReadOnly,
                type: typeof(ModelReaderWriterOptions),
                name: _wireOptionsName,
                initializationValue: New.Instance(typeof(ModelReaderWriterOptions), Literal("W")),
                enclosingType: this);
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        private const string _wireOptionsName = "WireOptions";
        private readonly FieldProvider _wireOptionsField;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "ModelSerializationExtensions";

        protected override FieldProvider[] BuildFields()
        {
            return [_wireOptionsField];
        }

        protected override MethodProvider[] BuildMethods()
        {
            var writer = ScmKnownParameters.Utf8JsonWriter.As<Utf8JsonWriter>();
            var dateTimeOffsetValueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(DateTimeOffset));
            var writeStringDateTimeOffset = new MethodProvider(
                new MethodSignature(
                    Name: WriteStringValueMethodName,
                    Modifiers: _methodModifiers,
                    ReturnType: null,
                    Parameters: [ScmKnownParameters.Utf8JsonWriter, dateTimeOffsetValueParameter, _formatParameter],
                    Description: null, ReturnDescription: null),
                writer.WriteStringValue(TypeFormattersSnippets.ToString(dateTimeOffsetValueParameter, _formatParameter)),
                this);

            var dateTimeValueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(DateTime));
            var writeStringDateTime = new MethodProvider(
                new MethodSignature(
                    Name: WriteStringValueMethodName,
                    Modifiers: _methodModifiers,
                    ReturnType: null,
                    Parameters: [ScmKnownParameters.Utf8JsonWriter, dateTimeValueParameter, _formatParameter],
                    Description: null, ReturnDescription: null),
                writer.WriteStringValue(TypeFormattersSnippets.ToString(dateTimeValueParameter, _formatParameter)),
                this);

            var timeSpanValueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(TimeSpan));
            var writeStringTimeSpan = new MethodProvider(
                new MethodSignature(
                    Name: WriteStringValueMethodName,
                    Modifiers: _methodModifiers,
                    ReturnType: null,
                    Parameters: [ScmKnownParameters.Utf8JsonWriter, timeSpanValueParameter, _formatParameter],
                    Description: null, ReturnDescription: null),
                writer.WriteStringValue(TypeFormattersSnippets.ToString(timeSpanValueParameter, _formatParameter)),
                this);

            var charValueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(char));
            var value = charValueParameter.AsExpression.As<char>();
            var writeStringChar = new MethodProvider(
                new MethodSignature(
                    Name: WriteStringValueMethodName,
                    Modifiers: _methodModifiers,
                    ReturnType: null,
                    Parameters: [ScmKnownParameters.Utf8JsonWriter, charValueParameter],
                    Description: null, ReturnDescription: null),
                writer.WriteStringValue(value.InvokeToString(new MemberExpression(typeof(CultureInfo), nameof(CultureInfo.InvariantCulture)))),
                this);

            return
            [
                BuildGetObjectMethodProvider(),
                BuildGetBytesFromBase64(),
                BuildGetDateTimeOffsetMethodProvider(),
                BuildGetTimeSpanMethodProvider(),
                BuildGetCharMethodProvider(),
                BuildThrowNonNullablePropertyIsNullMethodProvider(),
                BuildGetRequiredStringMethodProvider(),
                writeStringDateTimeOffset,
                writeStringDateTime,
                writeStringTimeSpan,
                writeStringChar,
                BuildWriteBase64StringValueMethodProvider(),
                BuildWriteNumberValueMethodProvider(),
                BuildWriteObjectValueMethodGeneric(),
                BuildWriteObjectValueMethodProvider()
            ];
        }

        #region JsonElementExtensions MethodProvider builders
        private const string _getBytesFromBase64MethodName = "GetBytesFromBase64";
        private const string _getCharMethodName = "GetChar";
        private const string _getDateTimeOffsetMethodName = "GetDateTimeOffset";
        private const string _getObjectMethodName = "GetObject";
        private const string _getTimeSpanMethodName = "GetTimeSpan";
        private const string _throwNonNullablePropertyIsNullMethodName = "ThrowNonNullablePropertyIsNull";
        private const string _getRequiredStringMethodName = "GetRequiredString";

        private MethodProvider BuildGetObjectMethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getObjectMethodName,
                Description: null,
                Modifiers: _methodModifiers,
                ReturnType: typeof(object),
                ReturnDescription: null,
                Parameters: [ScmKnownParameters.JsonElement]);
            var element = ScmKnownParameters.JsonElement.As<JsonElement>();
            var body = new SwitchStatement(element.ValueKind())
            {
                new(JsonValueKindSnippets.String, Return(element.GetString())),
                new(JsonValueKindSnippets.Number, new MethodBodyStatement[]
                {
                    new IfStatement(element.TryGetInt32(out var intValue))
                    {
                        Return(intValue)
                    },
                    new IfStatement(element.TryGetInt64(out var longValue))
                    {
                        Return(longValue)
                    },
                    Return(element.GetDouble())
                }),
                new(JsonValueKindSnippets.True, Return(True)),
                new(JsonValueKindSnippets.False, Return(False)),
                new([JsonValueKindSnippets.Undefined, JsonValueKindSnippets.Null], Return(Null)),
                new(JsonValueKindSnippets.Object, new MethodBodyStatement[]
                {
                    Declare("dictionary", New.Dictionary(typeof(string), typeof(object)), out var dictionary),
                    new ForeachStatement("jsonProperty", element.EnumerateObject(), out var jsonProperty)
                    {
                        dictionary.Add(jsonProperty.Property(nameof(JsonProperty.Name)), jsonProperty.Property(nameof(JsonProperty.Value)).Invoke("GetObject"))
                    },
                    Return(dictionary)
                }),
                new(JsonValueKindSnippets.Array, new MethodBodyStatement[]
                {
                    Declare("list", New.List<object>(), out var list),
                    new ForeachStatement("item", element.EnumerateArray(), out var item)
                    {
                        list.Add(item.Invoke("GetObject"))
                    },
                    Return(list.ToArray())
                }),
                SwitchCaseStatement.Default(Throw(New.NotSupportedException(new FormattableStringExpression("Not supported value kind {0}", [element.ValueKind()]))))
            };
            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildGetBytesFromBase64()
        {
            var signature = new MethodSignature(
                Name: _getBytesFromBase64MethodName,
                Modifiers: _methodModifiers,
                Parameters: [ScmKnownParameters.JsonElement, _formatParameter],
                ReturnType: typeof(byte[]),
                Description: null, ReturnDescription: null);
            var element = ScmKnownParameters.JsonElement.As<JsonElement>();
            var body = new MethodBodyStatement[]
            {
                new IfStatement(element.ValueKindEqualsNull())
                {
                    Return(Null)
                },
                MethodBodyStatement.EmptyLine,
                Return(new SwitchExpression(_formatParameter,
                    new SwitchCaseExpression(Literal("U"), TypeFormattersSnippets.FromBase64UrlString(element.GetRequiredString())),
                    new SwitchCaseExpression(Literal("D"), element.GetBytesFromBase64()),
                    SwitchCaseExpression.Default(ThrowExpression(New.ArgumentException(_formatParameter, new FormattableStringExpression("Format is not supported: '{0}'", [_formatParameter]))))
                    ))
            };

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildGetDateTimeOffsetMethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getDateTimeOffsetMethodName,
                Modifiers: _methodModifiers,
                Parameters: [ScmKnownParameters.JsonElement, _formatParameter],
                ReturnType: typeof(DateTimeOffset),
                Description: null, ReturnDescription: null);
            var element = ScmKnownParameters.JsonElement.As<JsonElement>();
            var body = new SwitchExpression(_formatParameter,
                SwitchCaseExpression.When(Literal("U"), element.ValueKind().Equal(JsonValueKindSnippets.Number), DateTimeOffsetSnippets.FromUnixTimeSeconds(element.GetInt64())),
                // relying on the param check of the inner call to throw ArgumentNullException if GetString() returns null
                SwitchCaseExpression.Default(TypeFormattersSnippets.ParseDateTimeOffset(element.GetString(), _formatParameter))
                );

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildGetTimeSpanMethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getTimeSpanMethodName,
                Modifiers: _methodModifiers,
                Parameters: [ScmKnownParameters.JsonElement, _formatParameter],
                ReturnType: typeof(TimeSpan),
                Description: null, ReturnDescription: null);
            var element = ScmKnownParameters.JsonElement.As<JsonElement>();
            // relying on the param check of the inner call to throw ArgumentNullException if GetString() returns null
            var body = TypeFormattersSnippets.ParseTimeSpan(element.GetString(), _formatParameter);

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildGetCharMethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getCharMethodName,
                Modifiers: _methodModifiers,
                Parameters: [ScmKnownParameters.JsonElement],
                ReturnType: typeof(char),
                Description: null, ReturnDescription: null);
            var element = ScmKnownParameters.JsonElement.As<JsonElement>();
            var body = new IfElseStatement(
                element.ValueKindEqualsString(),
                new MethodBodyStatement[]
                {
                    Declare("text", element.GetString(), out ScopedApi<string> text),
                    new IfStatement(text.Equal(Null).Or(text.Length().NotEqual(Literal(1))))
                    {
                        Throw(New.NotSupportedException(new FormattableStringExpression("Cannot convert \\\"{0}\\\" to a char", [text])))
                    },
                    Return(text.Index(Int(0)))
                },
                Throw(New.NotSupportedException(new FormattableStringExpression("Cannot convert {0} to a char", [element.ValueKind()])))
                );

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildThrowNonNullablePropertyIsNullMethodProvider()
        {
            var signature = new MethodSignature(
                Name: _throwNonNullablePropertyIsNullMethodName,
                Modifiers: _methodModifiers,
                Parameters: [_propertyParameter],
                ReturnType: null,
                Attributes:
                [
                    new AttributeStatement(typeof(ConditionalAttribute), Literal("DEBUG"))
                ],
                Description: null, ReturnDescription: null);
            var property = _propertyParameter.As<JsonProperty>();
            var body = Throw(New.JsonException(new FormattableStringExpression("A property '{0}' defined as non-nullable but received as null from the service. This exception only happens in DEBUG builds of the library and would be ignored in the release build", [property.Name()])));

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildGetRequiredStringMethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getRequiredStringMethodName,
                Modifiers: _methodModifiers,
                Parameters: [ScmKnownParameters.JsonElement],
                ReturnType: typeof(string),
                Description: null, ReturnDescription: null);
            var element = ScmKnownParameters.JsonElement.As<JsonElement>();
            var body = new MethodBodyStatement[]
            {
                Declare("value", element.GetString(), out ScopedApi<string> value),
                new IfStatement(value.Equal(Null))
                {
                    Throw(New.InvalidOperationException(new FormattableStringExpression("The requested operation requires an element of type 'String', but the target element has type '{0}'.", [element.ValueKind()])))
                },
                Return(value)
            };

            return new MethodProvider(signature, body, this);
        }

        #endregion

        #region Utf8JsonWriterExtensions MethodProvider builders

        private MethodProvider BuildWriteBase64StringValueMethodProvider()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(byte[]));
            var signature = new MethodSignature(
                Name: WriteBase64StringValueMethodName,
                Modifiers: _methodModifiers,
                Parameters: [ScmKnownParameters.Utf8JsonWriter, valueParameter, _formatParameter],
                ReturnType: null,
                Description: null, ReturnDescription: null);
            var writer = ScmKnownParameters.Utf8JsonWriter.As<Utf8JsonWriter>();
            var value = (ValueExpression)valueParameter;
            var body = new MethodBodyStatement[]
            {
                new IfStatement(value.Equal(Null))
                {
                    writer.WriteNullValue(),
                    Return()
                },
                new SwitchStatement(_formatParameter)
                {
                    new(Literal("U"), new MethodBodyStatement[]
                    {
                        writer.WriteStringValue(TypeFormattersSnippets.ToBase64UrlString(value.As<byte[]>())),
                        Break
                    }),
                    new(Literal("D"), new MethodBodyStatement[]
                    {
                        writer.WriteBase64StringValue(value),
                        Break
                    }),
                    SwitchCaseStatement.Default(Throw(New.ArgumentException(_formatParameter, new FormattableStringExpression("Format is not supported: '{0}'", [_formatParameter]))))
                }
            };

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildWriteNumberValueMethodProvider()
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, typeof(DateTimeOffset));
            var signature = new MethodSignature(
                Name: WriteNumberValueMethodName,
                Modifiers: _methodModifiers,
                Parameters: [ScmKnownParameters.Utf8JsonWriter, valueParameter, _formatParameter],
                ReturnType: null,
                Description: null, ReturnDescription: null);
            var writer = ScmKnownParameters.Utf8JsonWriter.As<Utf8JsonWriter>();
            var value = valueParameter.As<DateTimeOffset>();
            var body = new MethodBodyStatement[]
            {
                new IfStatement(_formatParameter.NotEqual(Literal("U")))
                {
                    Throw(New.ArgumentOutOfRangeException(_formatParameter, "Only 'U' format is supported when writing a DateTimeOffset as a Number.")),
                },
                writer.WriteNumberValue(value.ToUnixTimeSeconds())
            };

            return new MethodProvider(signature, body, this);
        }

        private MethodProvider BuildWriteObjectValueMethodProvider()
        {
            ValueExpression value;
            ScopedApi<Utf8JsonWriter> writer;
            ValueExpression options;
            MethodSignature signature = GetWriteObjectValueMethodSignature(null, out value, out writer, out options);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                writer.WriteObjectValue(value.As<object>(), options)
            },
            this);
        }

        private MethodProvider BuildWriteObjectValueMethodGeneric()
        {
            ValueExpression value;
            ScopedApi<Utf8JsonWriter> writer;
            ValueExpression options;
            MethodSignature signature = GetWriteObjectValueMethodSignature(_t, out value, out writer, out options);
            List<SwitchCaseStatement> cases = new List<SwitchCaseStatement>
            {
                new(Null, new MethodBodyStatement[]
                {
                    writer.WriteNullValue(),
                    Break
                })
            };
            cases.Add(
                BuildWriteObjectValueSwitchCase(new CSharpType(typeof(IJsonModel<>), _t), "jsonModel", jsonModel => new MethodBodyStatement[]
                {
                    jsonModel.Invoke(nameof(IJsonModel<object>.Write), writer, options.NullCoalesce(ModelSerializationExtensionsSnippets.Wire)).Terminate(),
                    Break
                }));
            cases.AddRange(new[]
            {
                // byte[] case
                BuildWriteObjectValueSwitchCase(typeof(byte[]), "bytes", bytes => new MethodBodyStatement[]
                {
                    writer.WriteBase64StringValue(bytes),
                    Break
                }),
                // BinaryData case
                BuildWriteObjectValueSwitchCase(typeof(BinaryData), "bytes", bytes => new MethodBodyStatement[]
                {
                    writer.WriteBase64StringValue(bytes),
                    Break
                }),
                // JsonElement case
                BuildWriteObjectValueSwitchCase(typeof(JsonElement), "json", json => new MethodBodyStatement[]
                {
                    json.As<JsonElement>().WriteTo(writer),
                    Break
                }),
                // int case
                BuildWriteObjectValueSwitchCase(typeof(int), "i", i => new MethodBodyStatement[]
                {
                    writer.WriteNumberValue(i),
                    Break
                }),
                // decimal case
                BuildWriteObjectValueSwitchCase(typeof(decimal), "d", dec => new MethodBodyStatement[]
                {
                    writer.WriteNumberValue(dec),
                    Break
                }),
                // double case
                BuildWriteObjectValueSwitchCase(typeof(double), "d", d => new MethodBodyStatement[]
                {
                    new IfElseStatement(
                        DoubleSnippets.IsNan(d),
                        writer.WriteStringValue(Literal("NaN")),
                        writer.WriteNumberValue(d)),
                    Break
                }),
                // float case
                BuildWriteObjectValueSwitchCase(typeof(float), "f", f => new MethodBodyStatement[]
                {
                    writer.WriteNumberValue(f),
                    Break
                }),
                // long case
                BuildWriteObjectValueSwitchCase(typeof(long), "l", l => new MethodBodyStatement[]
                {
                    writer.WriteNumberValue(l),
                    Break
                }),
                // string case
                BuildWriteObjectValueSwitchCase(typeof(string), "s", s => new MethodBodyStatement[]
                {
                    writer.WriteStringValue(s),
                    Break
                }),
                // bool case
                BuildWriteObjectValueSwitchCase(typeof(bool), "b", b => new MethodBodyStatement[]
                {
                    writer.WriteBooleanValue(b),
                    Break
                }),
                // Guid case
                BuildWriteObjectValueSwitchCase(typeof(Guid), "g", g => new MethodBodyStatement[]
                {
                    writer.WriteStringValue(g),
                    Break
                }),
                // DateTimeOffset case
                BuildWriteObjectValueSwitchCase(typeof(DateTimeOffset), "dateTimeOffset", dateTimeOffset => new MethodBodyStatement[]
                {
                    writer.WriteStringValue(dateTimeOffset, "O"),
                    Break
                }),
                // DateTime case
                BuildWriteObjectValueSwitchCase(typeof(DateTime), "dateTime", dateTime => new MethodBodyStatement[]
                {
                    writer.WriteStringValue(dateTime, "O"),
                    Break
                }),
                // IEnumerable<KeyValuePair<>> case
                BuildWriteObjectValueSwitchCase(typeof(IEnumerable<KeyValuePair<string, object>>), "enumerable", enumerable => new MethodBodyStatement[]
                {
                    writer.WriteStartObject(),
                    new ForeachStatement("pair", enumerable.As<IEnumerable<KeyValuePair<string, object>>>(), out var pair)
                    {
                        writer.WritePropertyName(pair.Property(nameof(KeyValuePair<string, object>.Key))),
                        writer.WriteObjectValue(pair.Property(nameof(KeyValuePair<string, object>.Value)).As<object>(), options)
                    },
                    writer.WriteEndObject(),
                    Break
                }),
                // IEnumerable<object> case
                BuildWriteObjectValueSwitchCase(typeof(IEnumerable<object>), "objectEnumerable", objectEnumerable => new MethodBodyStatement[]
                {
                    writer.WriteStartArray(),
                    new ForeachStatement("item", objectEnumerable.As<IEnumerable<object>>(), out var item)
                    {
                        writer.WriteObjectValue(item.As<object>(), options)
                    },
                    writer.WriteEndArray(),
                    Break
                }),
                // TimeSpan case
                BuildWriteObjectValueSwitchCase(typeof(TimeSpan), "timeSpan", timeSpan => new MethodBodyStatement[]
                {
                    writer.WriteStringValue(timeSpan, "P"),
                    Break
                }),
                // default
                SwitchCaseStatement.Default(Throw(New.NotSupportedException(new FormattableStringExpression("Not supported type {0}", [value.InvokeGetType()]))))
            });

            return new MethodProvider(signature, new SwitchStatement(value, cases), this);

            static SwitchCaseStatement BuildWriteObjectValueSwitchCase(CSharpType type, string varName, Func<VariableExpression, MethodBodyStatement> bodyFunc)
            {
                var declaration = new DeclarationExpression(type, varName, out var variable);
                var body = bodyFunc(variable);

                return new(declaration, body);
            }
        }

        private MethodSignature GetWriteObjectValueMethodSignature(CSharpType? genericArgument, out ValueExpression value, out ScopedApi<Utf8JsonWriter> writer, out ValueExpression options)
        {
            var valueParameter = new ParameterProvider("value", FormattableStringHelpers.Empty, genericArgument ?? typeof(object));
            var optionsParameter = new ParameterProvider("options", FormattableStringHelpers.Empty, typeof(ModelReaderWriterOptions), DefaultOf(new CSharpType(typeof(ModelReaderWriterOptions)).WithNullable(true)));
            var parameters = new[] { ScmKnownParameters.Utf8JsonWriter, valueParameter, optionsParameter };
            var signature = new MethodSignature(
                Name: WriteObjectValueMethodName,
                Description: null,
                Modifiers: _methodModifiers,
                ReturnType: null,
                ReturnDescription: null,
                Parameters: parameters,
                GenericArguments: genericArgument != null ? new[] { genericArgument } : null);
            value = (ValueExpression)valueParameter;
            writer = ScmKnownParameters.Utf8JsonWriter.As<Utf8JsonWriter>();
            options = optionsParameter;
            return signature;
        }
        #endregion
    }
}
