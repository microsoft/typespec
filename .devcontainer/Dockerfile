FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install mise for toolchain management (node, pnpm, etc.)
RUN curl https://mise.run | MISE_INSTALL_PATH=/usr/local/bin/mise sh \
  && echo 'eval "$(/usr/local/bin/mise activate bash)"' >> /home/vscode/.bashrc \
  && echo 'eval "$(/usr/local/bin/mise activate zsh)"' >> /home/vscode/.zshrc

# Pre-install all toolchain versions pinned in mise.toml/mise.lock into the image
COPY mise.toml mise.lock /tmp/mise-setup/
RUN chown -R vscode:vscode /tmp/mise-setup
USER vscode
RUN cd /tmp/mise-setup && mise trust && mise install
USER root
