// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;

namespace Microsoft.Generator.CSharp.Writers
{
    public class ExpressionTypeProviderWriter
    {
        protected readonly TypeProvider _provider;
        protected readonly CodeWriter _writer;

        public ExpressionTypeProviderWriter(CodeWriter writer, TypeProvider provider)
        {
            _provider = provider;
            _writer = writer;
        }

        public virtual void Write()
        {
            var ns = TypeProvider.GetDefaultModelNamespace(CodeModelPlugin.Instance.Configuration.Namespace);
            using (_writer.SetNamespace(ns))
            {
                WriteType();
            }
        }

        private void WriteType()
        {
            if (_provider.IsEnum)
            {
                WriteEnum();
            }
            else
            {
                WriteClassOrStruct();
            }
        }

        private void WriteClassOrStruct()
        {
            _writer.WriteTypeModifiers(_provider.DeclarationModifiers);
            if (_provider.IsStruct)
            {
                _writer.AppendRaw("struct ");
            }
            else
            {
                _writer.AppendRaw("class ");
            }
            _writer.Append($"{_provider.Type:D}")
                .AppendRawIf(" : ", _provider.Inherits != null || _provider.Implements.Any())
                .AppendIf($"{_provider.Inherits},", _provider.Inherits != null);

            foreach (var implement in _provider.Implements)
            {
                _writer.Append($"{implement:D},");
            }
            _writer.RemoveTrailingComma();

            if (_provider.WhereClause is not null)
            {
                _provider.WhereClause.Write(_writer);
            }

            _writer.WriteLine();
            using (_writer.Scope())
            {
                WriteFields();

                WriteConstructors();

                WriteProperties();

                _writer.WriteLine($"// Add Methods"); // https://github.com/Azure/autorest.csharp/issues/4476
                WriteMethods();

                _writer.WriteLine($"// Add Nested Type");
                WriteNestedTypes();
            }
        }

        private void WriteEnum()
        {
            _writer.WriteTypeModifiers(_provider.DeclarationModifiers);
            _writer.Append($" enum {_provider.Type:D}")
                .AppendRawIf(" : ", _provider.Inherits != null)
                .AppendIf($"{_provider.Inherits}", _provider.Inherits != null);

            using (_writer.Scope())
            {
                foreach (var field in _provider.Fields)
                {
                    _writer.Append($"{field.Declaration:D}");
                    if (field.InitializationValue != null)
                    {
                        _writer.AppendRaw(" = ");
                        field.InitializationValue.Write(_writer);
                    }
                    _writer.WriteRawLine(",");
                }
                _writer.RemoveTrailingComma();
            }
        }

        protected virtual void WriteProperties()
        {
            foreach (var property in _provider.Properties)
            {
                _writer.WriteProperty(property);
                _writer.WriteLine();
            }
            _writer.WriteLine();
        }

        protected virtual void WriteFields()
        {
            foreach (var field in _provider.Fields)
            {
                _writer.WriteField(field, declareInCurrentScope: true);
            }
            _writer.WriteLine();
        }

        protected virtual void WriteConstructors()
        {
            foreach (var ctor in _provider.Constructors)
            {
                _writer.WriteMethod(ctor);
            }
            _writer.WriteLine();
        }

        protected virtual void WriteMethods()
        {
            foreach (var method in _provider.Methods)
            {
                _writer.WriteMethod(method);
            }
            _writer.WriteLine();
        }

        protected virtual void WriteNestedTypes()
        {
            foreach (var nested in _provider.NestedTypes)
            {
                var nestedWriter = new ExpressionTypeProviderWriter(_writer, nested);
                nestedWriter.Write();
                _writer.WriteLine();
            }
        }
    }
}
