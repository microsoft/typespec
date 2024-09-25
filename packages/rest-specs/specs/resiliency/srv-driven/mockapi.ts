import { HttpVerb } from "@typespec/http";
import {
  mockapi,
  MockApi,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  ValidationError,
} from "@typespec/spec-api";

export const commonBase = "/resiliency/service-driven";

type PassResiliencyOptions = {
  path: string;
  verb: HttpVerb;
  commonValidate: (req: MockRequest) => void;
  oldApiVersionNewClientValidate: (req: MockRequest) => void;
  newApiVersionNewClientValidate: (req: MockRequest) => void;
};

function createResilientMockApi(options: PassResiliencyOptions): MockApi[] {
  return [
    mockapi.request(
      options.verb,
      `${commonBase}/client[:]v1/service[:]v1/api-version[:]v1${options.path}`,
      (req) => {
        options.commonValidate(req);
        return {
          status: 204,
        };
      },
    ),
    mockapi.request(
      options.verb,
      `${commonBase}/client[:]v1/service[:]v2/api-version[:]v1${options.path}`,
      (req) => {
        options.commonValidate(req);
        return {
          status: 204,
        };
      },
    ),
    mockapi.request(
      options.verb,
      `${commonBase}/client[:]v2/service[:]v2/api-version[:]v1${options.path}`,
      (req) => {
        options.commonValidate(req);
        options.oldApiVersionNewClientValidate(req);
        return {
          status: 204,
        };
      },
    ),
    mockapi.request(
      options.verb,
      `${commonBase}/client[:]v2/service[:]v2/api-version[:]v2${options.path}`,
      (req) => {
        options.commonValidate(req);
        options.newApiVersionNewClientValidate(req);
        return {
          status: 204,
        };
      },
    ),
  ];
}

function addOptionalParamOldApiVersionNewClientValidate(req: MockRequest): void {
  if (req.params["new-parameter"] !== undefined) {
    throw new ValidationError(
      "Did not expect 'new-parameter'",
      undefined,
      req.params["new-parameter"],
    );
  }
}

function addOptionalParamNewApiVersionNewClientValidate(req: MockRequest): void {
  req.expect.containsQueryParam("new-parameter", "new");
}

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Resiliency_ServiceDriven_AddOptionalParam_fromNone = passOnSuccess(
  createResilientMockApi({
    path: "/add-optional-param/from-none",
    verb: "head",
    commonValidate: function validate(req: MockRequest): void {},
    oldApiVersionNewClientValidate: addOptionalParamOldApiVersionNewClientValidate,
    newApiVersionNewClientValidate: addOptionalParamNewApiVersionNewClientValidate,
  }),
);

Scenarios.Resiliency_ServiceDriven_AddOptionalParam_fromOneRequired = passOnSuccess(
  createResilientMockApi({
    path: "/add-optional-param/from-one-required",
    verb: "get",
    commonValidate: function validate(req: MockRequest): void {
      req.expect.containsQueryParam("parameter", "required");
    },
    oldApiVersionNewClientValidate: addOptionalParamOldApiVersionNewClientValidate,
    newApiVersionNewClientValidate: addOptionalParamNewApiVersionNewClientValidate,
  }),
);

Scenarios.Resiliency_ServiceDriven_AddOptionalParam_fromOneOptional = passOnSuccess(
  createResilientMockApi({
    path: "/add-optional-param/from-one-optional",
    verb: "get",
    commonValidate: function validate(req: MockRequest): void {
      req.expect.containsQueryParam("parameter", "optional");
    },
    oldApiVersionNewClientValidate: addOptionalParamOldApiVersionNewClientValidate,
    newApiVersionNewClientValidate: addOptionalParamNewApiVersionNewClientValidate,
  }),
);

Scenarios.Resiliency_ServiceDriven_breakTheGlass = passOnSuccess(
  mockapi.delete(`${commonBase}/client[:]v1/service[:]v2/api-version[:]v2/add-operation`, (req) => {
    return {
      status: 204,
    };
  }),
);

Scenarios.Resiliency_ServiceDriven_addOperation = passOnSuccess(
  mockapi.delete(`${commonBase}/client[:]v2/service[:]v2/api-version[:]v2/add-operation`, (req) => {
    return {
      status: 204,
    };
  }),
);

function createMockServerTests_1(uri: string, configData?: any) {
  let configObject: any;
  if (configData) {
    configObject = configData;
  } else {
    configObject = {};
  }

  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "head",
        request: {
          config: configObject,
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}

Scenarios.Resiliency_SRV_Driven_Add_Optional_Param_From_None_111 = createMockServerTests_1(
  "/resiliency/service-driven/client:v1/service:v1/api-version:v1/add-optional-param/from-none",
);
Scenarios.Resiliency_SRV_Driven_Add_Optional_Param_From_None_121 = createMockServerTests_1(
  "/resiliency/service-driven/client:v1/service:v2/api-version:v1/add-optional-param/from-none",
);
Scenarios.Resiliency_SRV_Driven_Add_Optional_Param_From_None_221 = createMockServerTests_1(
  "/resiliency/service-driven/client:v2/service:v2/api-version:v1/add-optional-param/from-none",
);
Scenarios.Resiliency_SRV_Driven_Add_Optional_Param_From_None_222 = createMockServerTests_1(
  "/resiliency/service-driven/client:v2/service:v2/api-version:v2/add-optional-param/from-none",
  {
    params: {
      "new-parameter": "new",
    },
  },
);

function createMockServerTests_2(uri: string, configData?: any) {
  let configObject: any;
  if (configData) {
    configObject = configData;
  } else {
    configObject = {};
  }

  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {
          config: configObject,
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}

Scenarios.Resiliency_SRV_Driven_From_One_Required_111 = createMockServerTests_2(
  "/resiliency/service-driven/client:v1/service:v1/api-version:v1/add-optional-param/from-one-required",
  {
    params: {
      parameter: "required",
    },
  },
);
Scenarios.Resiliency_SRV_Driven_From_One_Required_121 = createMockServerTests_2(
  "/resiliency/service-driven/client:v1/service:v2/api-version:v1/add-optional-param/from-one-required",
  {
    params: {
      parameter: "required",
    },
  },
);
Scenarios.Resiliency_SRV_Driven_From_One_Required_221 = createMockServerTests_2(
  "/resiliency/service-driven/client:v2/service:v2/api-version:v1/add-optional-param/from-one-required",
  {
    params: {
      parameter: "required",
    },
  },
);
Scenarios.Resiliency_SRV_Driven_From_One_Required_222 = createMockServerTests_2(
  "/resiliency/service-driven/client:v2/service:v2/api-version:v2/add-optional-param/from-one-required",
  {
    params: {
      "new-parameter": "new",
      parameter: "required",
    },
  },
);
Scenarios.Resiliency_SRV_Driven_From_One_Optional_111 = createMockServerTests_2(
  "/resiliency/service-driven/client:v1/service:v1/api-version:v1/add-optional-param/from-one-optional",
  {
    params: {
      parameter: "optional",
    },
  },
);
Scenarios.Resiliency_SRV_Driven_From_One_Optional_121 = createMockServerTests_2(
  "/resiliency/service-driven/client:v1/service:v2/api-version:v1/add-optional-param/from-one-optional",
  {
    params: {
      parameter: "optional",
    },
  },
);
Scenarios.Resiliency_SRV_Driven_From_One_Optional_221 = createMockServerTests_2(
  "/resiliency/service-driven/client:v2/service:v2/api-version:v1/add-optional-param/from-one-optional",
  {
    params: {
      parameter: "optional",
    },
  },
);
Scenarios.Resiliency_SRV_Driven_From_One_Optional_222 = createMockServerTests_2(
  "/resiliency/service-driven/client:v2/service:v2/api-version:v2/add-optional-param/from-one-optional",
  {
    params: {
      "new-parameter": "new",
      parameter: "optional",
    },
  },
);

function createMockServerTests_3(uri: string, configData?: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "delete",
        request: {},
        response: {
          status: 204,
        },
      },
    ],
  });
}

Scenarios.Resiliency_SRV_Driven_Add_Operation_122 = createMockServerTests_3(
  "/resiliency/service-driven/client:v1/service:v2/api-version:v2/add-operation",
);
Scenarios.Resiliency_SRV_Driven_Add_Operation_222 = createMockServerTests_3(
  "/resiliency/service-driven/client:v2/service:v2/api-version:v2/add-operation",
);
