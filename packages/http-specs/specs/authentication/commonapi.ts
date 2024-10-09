import {
  json,
  mockapi,
  MockRequest,
  passOnCode,
  PassOnCodeScenario,
  passOnSuccess,
  PassOnSuccessScenario,
  ScenarioMockApi,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

interface ValidAndInvalidCodeScenarios {
  valid: PassOnSuccessScenario;
  invalid: PassOnCodeScenario;
}

export function getValidAndInvalidScenarios(
  scenarioFolder: string,
  errorCode: string,
  authenticationValidation: (req: MockRequest) => void,
): ValidAndInvalidCodeScenarios {
  return {
    valid: passOnSuccess(
      mockapi.get(`/authentication/${scenarioFolder}/valid`, (req) => {
        authenticationValidation(req);
        return { status: 204 };
      }),
    ),
    invalid: passOnCode(
      403,
      mockapi.get(`/authentication/${scenarioFolder}/invalid`, (req) => {
        return {
          status: 403,
          body: json({
            error: errorCode,
          }),
        };
      }),
    ),
  };
}
