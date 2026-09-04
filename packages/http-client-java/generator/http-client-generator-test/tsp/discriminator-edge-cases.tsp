import "@typespec/rest";
import "@typespec/xml";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Xml;
using Azure.Core;
using Azure.ClientGenerator.Core;

@service(#{ title: "DiscriminatorEdgeCases" })
namespace TspTest.DiscriminatorEdgeCases;

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

@discriminator("nestedDiscriminator")
model GrandChildWithNestedDiscriminator extends ChildWithRequiredPropertyAsDiscriminator {
  discriminator: "nested";

  // Activates a nested hierarchy so the outer discriminator is propagated and masks the base property.
  nestedDiscriminator: string;
}

model GreatGrandChildWithDuplicateDiscriminator extends GrandChildWithNestedDiscriminator {
  // Repeats the propagated outer discriminator to exercise duplicate merging.
  discriminator: "nested";

  nestedDiscriminator: "leaf";
}

@usage(Usage.output)
@access(Access.public)
@name("NestedDiscriminatorBase")
@discriminator("type")
model NestedDiscriminatorBase {
  @attribute type: string;
}

@name("NestedDiscriminatorMessage")
@discriminator("role")
model NestedDiscriminatorMessage extends NestedDiscriminatorBase {
  @attribute type: "message";
  @attribute role: string;
}

@name("NestedDiscriminatorAssistant")
model NestedDiscriminatorAssistant extends NestedDiscriminatorMessage {
  @attribute type: "message";
  @attribute role: "assistant";
}

model GrandChildWithAnotherDiscriminator extends ChildWithAnotherDiscriminator {
  differentDiscriminator: "anotherValue";
}

/** Model with @discriminator but no known subtypes. */
@discriminator("kind")
model ModelWithDiscriminatorNoSubtypes {
  kind: string;
  name: string;
}

@client({
  service: TspTest.DiscriminatorEdgeCases,
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

  @get
  @route("/nosubtypes")
  getNoSubtypes(): {
    @body body: ModelWithDiscriminatorNoSubtypes;
  };
}
