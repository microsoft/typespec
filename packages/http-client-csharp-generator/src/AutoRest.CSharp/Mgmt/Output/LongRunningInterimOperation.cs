// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using Azure.Core;
using Azure.ResourceManager;

namespace AutoRest.CSharp.Mgmt.Output
{
    internal class LongRunningInterimOperation
    {
        public LongRunningInterimOperation(CSharpType returnType, Resource? resource, string methodName)
        {
            ReturnType = returnType;
            BaseClassType = new CSharpType(typeof(ArmOperation<>), returnType);
            IOperationSourceType = new CSharpType(typeof(IOperationSource<>), returnType);
            StateLockType = new CSharpType(typeof(AsyncLockWithValue<>), returnType);
            ValueTaskType = new CSharpType(typeof(ValueTask<>), returnType);
            ResponseType = new CSharpType(Configuration.ApiTypes.ResponseOfTType, returnType);
            var trimmedNamespace = MgmtContext.Context.DefaultNamespace.Split('.').Last();
            OperationType = $"{trimmedNamespace}ArmOperation<{returnType.Name}>";
            var resourceName = resource != null ? resource.ResourceName : $"{trimmedNamespace}Extensions";
            TypeName = $"{resourceName}{methodName}Operation";
            var targetSchema = new ObjectSchema()
            {
                Language = new Languages()
                {
                    Default = new Language()
                    {
                        Name = TypeName,
                        Namespace = MgmtContext.Context.DefaultNamespace
                    }
                }
            };
            InterimType = new CSharpType(new MgmtObjectType(targetSchema), MgmtContext.Context.DefaultNamespace, TypeName);
        }

        public CSharpType ReturnType { get; }

        public CSharpType BaseClassType { get; }

        public CSharpType IOperationSourceType { get; }

        public CSharpType StateLockType { get; }

        public CSharpType ValueTaskType { get; }

        public CSharpType ResponseType { get; }

        public CSharpType InterimType { get; }

        public string TypeName { get; }

        public string OperationType { get; }

        public static IEqualityComparer<LongRunningInterimOperation> LongRunningInterimOperationComparer { get; } = new LongRunningInterimOperationComparerImplementation();

        private class LongRunningInterimOperationComparerImplementation : IEqualityComparer<LongRunningInterimOperation>
        {
            public bool Equals(LongRunningInterimOperation? x, LongRunningInterimOperation? y)
            {
                if (x is null || y is null)
                {
                    return ReferenceEquals(x, y);
                }

                return x.TypeName == y.TypeName;
            }

            public int GetHashCode(LongRunningInterimOperation obj)
            {

                var hashCode = new HashCode();
                hashCode.Add(obj.TypeName);

                return hashCode.ToHashCode();
            }
        }
    }
}
