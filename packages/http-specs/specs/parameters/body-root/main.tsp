import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for @bodyRoot parameter patterns.")
@scenarioService("/parameters/body-root")
namespace Parameters.BodyRoot;

model BodyRootModel {
  category?: string;
  linkType?: string;
  wasSuccessful?: boolean;
}

@scenario
@scenarioDoc("""
  Test case for a \`@bodyRoot\` parameter nested inside a wrapper model.

  Emitters must resolve the accessor path through the wrapper (e.g.
  \`body.bodyRootParameters\`) rather than referencing the property name
  directly.

  Expected request body:
  \`\`\`json
  { "category": "widget", "linkType": "hard", "wasSuccessful": true }
  \`\`\`
  """)
@route("/nested")
@post
op nested(body: {
  @bodyRoot bodyRootParameters: BodyRootModel;
}): NoContentResponse;
