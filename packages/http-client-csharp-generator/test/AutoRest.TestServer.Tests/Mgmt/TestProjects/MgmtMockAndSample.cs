using System;
using System.Collections.Generic;
using MgmtMockAndSample;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtMockAndSample : TestProjectTests
    {
        public MgmtMockAndSample() : base("MgmtMockAndSample", "src") { }

        protected override HashSet<Type> ListExceptionCollections { get; } = new HashSet<Type>() { typeof(DeletedManagedHsmCollection), typeof(DeletedVaultCollection) };
    }
}
