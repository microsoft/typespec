// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class ServiceVersionDefinition : TypeProvider
    {
        private readonly IReadOnlyList<string> _apiVersions;
        private IReadOnlyList<EnumTypeMember>? _members;

        public ServiceVersionDefinition(ClientOptionsProvider declaringType)
        {
            _apiVersions = declaringType.ApiVersions;
            DeclaringTypeProvider = declaringType;

            // Since the ServiceVersionProvider is only instantiated when there are service versions,
            // we can safely assume that there is at least one member in the enum.
            LatestServiceVersion = Fields[Fields.Count - 1];
        }

        protected override FormattableString Description => $"The version of the service to use.";

        protected override string BuildName() => "ServiceVersion";

        protected override string BuildRelativeFilePath()
        {
            throw new InvalidOperationException("ServiceVersionProvider should not be generated to a new file.");
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum;
        }

        internal IReadOnlyList<EnumTypeMember> Members => _members ??= BuildMembers();

        private IReadOnlyList<EnumTypeMember> BuildMembers()
        {
            var count = _apiVersions.Count;
            EnumTypeMember[] members = new EnumTypeMember[count];

            for (int i = 0; i < count; i++)
            {
                var apiVersion = _apiVersions[i];
                var memberName = StringExtensions.ToApiVersionMemberName(apiVersion);
                var field = new FieldProvider(
                    FieldModifiers.Public | FieldModifiers.Static,
                    Type,
                    memberName,
                    $"Service version {apiVersion:L}",
                    Literal(i + 1));

                members[i] = new EnumTypeMember(memberName, field, apiVersion);
            }
            return members;
        }

        protected override FieldProvider[] BuildFields()
            => [.. Members.Select(v => v.Field)];

        internal FieldProvider LatestServiceVersion { get; }
    }
}
