# Use TypeSpec via Docker

Image: `azsdkengsys.azurecr.io/typespec`

Tags:

- Lastest from master: `alpine`, `latest`

## Usage

```bash
docker run \
  -v "${pwd}:/wd" --workdir="/wd" \
  -t azsdkengsys.azurecr.io/typespec \
  # ... TypeSpec args ...
```

**For usage in PowerShell replace `\` with `` ` ``**

### Install dependencies

```bash
docker run -v "${pwd}:/wd" --workdir="/wd"  -t azsdkengsys.azurecr.io/typespec install
```

### Compile

```bash
docker run -v "${pwd}:/wd" --workdir="/wd"  -t azsdkengsys.azurecr.io/typespec compile .
```

### Init a new project

```bash
docker run -v "${pwd}:/wd" --workdir="/wd"  -t azsdkengsys.azurecr.io/typespec init
```
