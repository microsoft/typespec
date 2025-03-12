#!/usr/bin/env bash
# cspell:ignore zxvf
set -euo pipefail

# Default values for args
skip_shell=false # --skip-shell
version="latest" # --version

os=$(uname -s)
platform=$(uname -ms)
bin_name="tsp"

if [[ ${OS:-} = Windows_NT ]]; then
  if [[ $platform != MINGW64* ]]; then
    powershell -c "irm typespec.io/install.ps1|iex"
    exit $?
  fi
fi

# Reset
Color_Off=''

# Regular Colors
Red=''
Green=''
Dim='' # White

# Bold
Bold_White=''
Bold_Green=''

if [[ -t 1 ]]; then
  # Reset
  Color_Off='\033[0m' # Text Reset

  # Regular Colors
  Red='\033[0;31m'   # Red
  Green='\033[0;32m' # Green
  Dim='\033[0;2m'    # White

  # Bold
  Bold_Green='\033[1;32m' # Bold Green
  Bold_White='\033[1m'    # Bold White
fi

error() {
  echo -e "${Red}error${Color_Off}:" "$@" >&2
  exit 1
}

info() {
  echo -e "${Dim}$@ ${Color_Off}"
}

success() {
  echo -e "${Green}$@ ${Color_Off}"
}

install_dir="$HOME/.tsp"

case $platform in
  'Darwin x86_64')
    target=darwin-x64
    ;;
  'Darwin arm64')
    target=darwin-arm64
    ;;
  'Linux aarch64' | 'Linux arm64')
    target=linux-arm64
    ;;
  'Linux x86_64' | *)
    target=linux-x64
    ;;
esac

if [[ $target = darwin-x64 ]]; then
  # Is this process running in Rosetta?
  # redirect stderr to devnull to avoid error message when not running in Rosetta
  if [[ $(sysctl -n sysctl.proc_translated 2> /dev/null) = 1 ]]; then
    target=darwin-aarch64
    info "Your shell is running in Rosetta 2. Downloading tsp for $target instead"
  fi
fi

# Parse Flags
parse_args() {
  while [[ $# -gt 0 ]]; do
    key="$1"

    case $key in
      # -d | --install-dir)
      #   install_dir="$2"
      #   shift # past argument
      #   shift # past value
      #   ;;
      -s | --skip-shell)
        SKIP_SHELL="true"
        shift # past argument
        ;;
      --version)
        version="$2"
        shift # past release argument
        shift # past release value
        ;;
      *)
        echo "Unrecognized argument $key"
        exit 1
        ;;
    esac
  done
}

find_latest_version() {
  curl "https://typespec.blob.core.windows.net/dist/latest.txt"
}

get_filename() {
  echo "tsp-$target.tar.gz"
}

get_download_url() {
  if [ "$version" = "latest" ]; then
    version=$(find_latest_version)
  fi

  echo "https://typespec.blob.core.windows.net/dist/$version/$(get_filename)"
}

download_tsp() {
  URL=$(get_download_url)
  info "Downloading Typespec from $URL"

  download_dir=$(mktemp -d)
  filename=$(get_filename)

  echo "Downloading $URL..."
  bin_dir="$install_dir/bin"

  compressed_file_path="$download_dir/$filename"
  if ! curl --progress-bar --fail -L "$URL" -o "$compressed_file_path"; then
    error "Download failed.  Check that the release/filename are correct."
    exit 1
  fi

  extract_location="$download_dir/extracted"
  mkdir $extract_location
  tar -zxvf "$compressed_file_path" -C "$extract_location"/
  rm "$compressed_file_path"
  chmod +x "$extract_location/$bin_name"

  # Move to install directory
  mkdir -p "$bin_dir" &> /dev/null
  mv "$extract_location/$bin_name" "$bin_dir/$bin_name"
  success "TypeSpec was installed successfully to $Bold_Green$("$install_dir")"
}

check_dependencies() {
  should_exit="false"
  info "Checking dependencies for the installation script..."

  info "Checking availability of curl... "
  if hash curl 2> /dev/null; then
    info "OK!"
  else
    error "curl is required to instal typespec"
    should_exit="true"
  fi

  if [ "$should_exit" = "true" ]; then
    info "Not installing TypeSpec due to missing dependencies."
    exit 1
  fi
}

ensure_containing_dir_exists() {
  local CONTAINING_DIR
  CONTAINING_DIR="$(dirname "$1")"
  if [ ! -d "$CONTAINING_DIR" ]; then
    echo " >> Creating directory $CONTAINING_DIR"
    mkdir -p "$CONTAINING_DIR"
  fi
}

setup_shell() {
  CURRENT_SHELL="$(basename "$SHELL")"

  if [ "$CURRENT_SHELL" = "zsh" ]; then
    CONF_FILE=${ZDOTDIR:-$HOME}/.zshrc
    ensure_containing_dir_exists "$CONF_FILE"
    echo "Installing for Zsh. Appending the following to $CONF_FILE:"
    {
      echo ''
      echo '# TypeSpec'
      echo 'TYPESPEC_PATH="'"$bin_dir"'"'
      echo 'if [ -d "$TYPESPEC_PATH" ]; then'
      echo '  export PATH="'$bin_dir':$PATH"'
      echo 'fi'
    } | tee -a "$CONF_FILE"

  elif [ "$CURRENT_SHELL" = "fish" ]; then
    CONF_FILE=$HOME/.config/fish/conf.d/tsp.fish
    ensure_containing_dir_exists "$CONF_FILE"
    echo "Installing for Fish. Appending the following to $CONF_FILE:"
    {
      echo ''
      echo '# TypeSpec'
      echo 'set TYPESPEC_PATH "'"$bin_dir"'"'
      echo 'if [ -d "$TYPESPEC_PATH" ]'
      echo '  set PATH "$TYPESPEC_PATH" $PATH'
      echo 'end'
    } | tee -a "$CONF_FILE"

  elif [ "$CURRENT_SHELL" = "bash" ]; then
    if [ "$os" = "Darwin" ]; then
      CONF_FILE=$HOME/.profile
    else
      CONF_FILE=$HOME/.bashrc
    fi
    ensure_containing_dir_exists "$CONF_FILE"
    echo "Installing for Bash. Appending the following to $CONF_FILE:"
    {
      echo ''
      echo '# TypeSpec'
      echo 'TYPESPEC_PATH="'"$bin_dir"'"'
      echo 'if [ -d "$TYPESPEC_PATH" ]; then'
      echo '  export PATH="$TYPESPEC_PATH:$PATH"'
      echo 'fi'
    } | tee -a "$CONF_FILE"

  else
    error "Could not infer shell type. Please set up manually."
    exit 1
  fi

  info ""
  info "In order to apply the changes, open a new terminal or run the following command:"
  info ""
  info "  source $CONF_FILE"
}

parse_args "$@"
check_dependencies
download_tsp
if [ "$skip_shell" != "true" ]; then
  setup_shell
fi
