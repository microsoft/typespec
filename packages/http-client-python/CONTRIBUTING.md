# Contributing

## PR

To observe the downstream effects of changes in this `@typespec/http-client-python` package on `@azure-tools/typespec-python`, we require a green PR to the [autorest.python](https://github.com/Azure/autorest.python) repo to ensure this.

To make the downstream PR, follow these steps:

1. Create your intended PR to the [microsoft/typespec](https://github.com/microsoft/typespec) repo for `@typespec/http-client-python`
2. After the above CI passes, you get the url of a private package in CI.
    ![alt text](image.png)
    a. Click on the section that says `5 published; 1 consumed`, like in the above picture
    b. Follow `Published artifacts -> build_artifacts_python -> packages -> typespec-http-client-python-x.x.x.tgz`.
    c. Go to the right side, click the three dots, and click `Copy download url`.
1. Create a PR in [autorest.python](https://github.com/Azure/autorest.python), updating the version of the `@typespec/http-client-python` in the `package.json` files to be the downloaded URL
1. Once the PR to [autorest.python](https://github.com/Azure/autorest.python) passes, you can merge and release the original PR
1. When the change to `@typespec/http-client-python` has been released, update your [autorest.python](https://github.com/Azure/autorest.python) repo to use the released version of the `@typespec/http-client-python` package
