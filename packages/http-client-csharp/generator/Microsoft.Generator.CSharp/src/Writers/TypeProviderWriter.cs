// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;

namespace Microsoft.Generator.CSharp
{
    public class TypeProviderWriter
    {
        protected readonly TypeProvider _provider;
        protected readonly CodeWriter _writer;

        public TypeProviderWriter(CodeWriter writer, TypeProvider provider)
        {
            _provider = provider;
            _writer = writer;
        }

        public virtual void Write()
        {
            using (_writer.SetNamespace(_provider.Namespace))
            {
                WriteType();
            }
        }

        private void WriteType()
        {
            _writer.WriteTypeModifiers(_provider.DeclarationModifiers); // class, struct, enum and interface is written as modifiers in this part
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

            if (_provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Enum))
            {
                WriteEnumContent();
            }
            else if (_provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Interface))
            {
                WriteInterfaceContent();
            }
            else
            {
                WriteClassOrStructContent();
            }
        }

        private void WriteClassOrStructContent()
        {
            using (_writer.Scope())
            {
                WriteFields();

                WriteConstructors();

                WriteProperties();
                WriteMethods();

                WriteNestedTypes();
            }
        }

        private void WriteEnumContent()
        {
            using (_writer.Scope())
            {
                foreach (var field in _provider.Fields)
                {
                    _writer.Append($"{field.Name}");
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

        private void WriteInterfaceContent()
        {
            using (_writer.Scope())
            {
                // temporarily do nothing until we have a requirement for writing interfaces: https://github.com/microsoft/typespec/issues/3442
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
                _writer.WriteField(field);
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
                var nestedWriter = new TypeProviderWriter(_writer, nested);
                nestedWriter.Write();
                _writer.WriteLine();
            }
        }
    }
}
