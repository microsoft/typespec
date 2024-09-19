import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.Core;
using Azure.ClientGenerator.Core;

@service({
  title: "DiscriminatorEdgeCases",
})
namespace Cadl.DiscriminatorEdgeCases;

model ParentWithRequiredProperty {
  discriminator: string;
  aProperty: string;
}

@discriminator("discriminator")
model ChildWithRequiredPropertyAsDiscriminator extends ParentWithRequiredProperty {
  anotherProperty: string;
}

@discriminator("differentDiscriminator")
model ChildWithAnotherDiscriminator extends ParentWithRequiredProperty {
  yetAnotherProperty: string;
}

model GrandChildWithRequiredProperty extends ChildWithRequiredPropertyAsDiscriminator {
  discriminator: "aValue";
}

model GrandChildWithAnotherDiscriminator extends ChildWithAnotherDiscriminator {
  differentDiscriminator: "anotherValue";
}

@client({
  service: Cadl.DiscriminatorEdgeCases,
  name: "DiscriminatorEdgeCasesClient",
})
@route("/model")
interface DiscriminatorEdgeCasesOp {
  @get
  @route("/childrequireddiscrim")
  getChildRequiredDiscrim(): {
    @body body: ChildWithRequiredPropertyAsDiscriminator;
  };

  @get
  @route("/childnewdiscrim")
  getChildNewDiscrim(): {
    @body body: ChildWithAnotherDiscriminator;
  };
}
