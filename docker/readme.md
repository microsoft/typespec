# Use cadl via docker

Image: `azsdkengsys.azurecr.io/cadl`

Tags:

- Lastest from master: `alpine`, `latest`

## Usage

```bash
docker run \
  -v "${pwd}:/wd" --workdir="/wd" \
  -t azsdkengsys.azurecr.io/cadl \
  # ... cadl args ...
```

**For usage in powershell replace `\` with `` ` ``**

### Install dependencies

```bash
docker run -v "${pwd}:/wd" --workdir="/wd"  -t azsdkengsys.azurecr.io/cadl install
```

### Compile

```bash
docker run -v "${pwd}:/wd" --workdir="/wd"  -t azsdkengsys.azurecr.io/cadl compile .
```

### Init a new project

```bash
docker run -v "${pwd}:/wd" --workdir="/wd"  -t azsdkengsys.azurecr.io/cadl init
```
