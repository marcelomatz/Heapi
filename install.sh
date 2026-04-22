#!/bin/sh
set -e

echo "Fetching latest release information..."
LATEST_RELEASE=$(curl -s https://api.github.com/repos/marcelomatz/Heapi/releases/latest)
VERSION=$(echo "$LATEST_RELEASE" | grep -oP '"tag_name": "\K(.*)(?=")' || echo "")

if [ -z "$VERSION" ]; then
    # Fallback to grep/sed for macOS compatibility
    VERSION=$(echo "$LATEST_RELEASE" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
fi

if [ -z "$VERSION" ]; then
    echo "Error: Failed to fetch the latest version from GitHub."
    exit 1
fi

OS="$(uname -s)"
ARCH="$(uname -m)"

echo "Detected OS: $OS"
echo "Detected Arch: $ARCH"

INSTALL_DIR="$HOME/.local/bin"

if [ "$OS" = "Darwin" ]; then
    echo "Downloading Heapi $VERSION for macOS..."
    DOWNLOAD_URL="https://github.com/marcelomatz/Heapi/releases/download/$VERSION/heapi-macos-universal.zip"
    
    TMP_DIR=$(mktemp -d)
    curl -fsSL "$DOWNLOAD_URL" -o "$TMP_DIR/heapi.zip"
    
    echo "Extracting..."
    unzip -q "$TMP_DIR/heapi.zip" -d "$TMP_DIR"
    
    APP_TARGET="/Applications/Heapi.app"
    echo "Installing to $APP_TARGET..."
    
    # Try to copy to /Applications, fallback to ~/Applications
    if [ -w "/Applications" ]; then
        rm -rf "$APP_TARGET"
        cp -R "$TMP_DIR/heapi.app" "$APP_TARGET"
    else
        APP_TARGET="$HOME/Applications/Heapi.app"
        mkdir -p "$HOME/Applications"
        rm -rf "$APP_TARGET"
        cp -R "$TMP_DIR/heapi.app" "$APP_TARGET"
    fi
    
    # Bypass Gatekeeper/Quarantine
    echo "Removing quarantine attribute (bypassing Gatekeeper warnings)..."
    xattr -d com.apple.quarantine "$APP_TARGET" 2>/dev/null || true
    
    # Create symlink in ~/.local/bin
    mkdir -p "$INSTALL_DIR"
    ln -sf "$APP_TARGET/Contents/MacOS/heapi" "$INSTALL_DIR/heapi"
    
    rm -rf "$TMP_DIR"
    
    echo ""
    echo "Heapi $VERSION was installed successfully! 🚀"
    echo "App installed at: $APP_TARGET"
    
elif [ "$OS" = "Linux" ]; then
    if [ "$ARCH" = "x86_64" ]; then
        DOWNLOAD_URL="https://github.com/marcelomatz/Heapi/releases/download/$VERSION/heapi-linux-amd64.tar.gz"
    else
        echo "Error: Architecture $ARCH is not supported yet for Linux."
        exit 1
    fi
    
    echo "Downloading Heapi $VERSION for Linux..."
    
    TMP_DIR=$(mktemp -d)
    curl -fsSL "$DOWNLOAD_URL" -o "$TMP_DIR/heapi.tar.gz"
    
    echo "Extracting..."
    mkdir -p "$INSTALL_DIR"
    tar -xzf "$TMP_DIR/heapi.tar.gz" -C "$INSTALL_DIR"
    chmod +x "$INSTALL_DIR/heapi"
    
    rm -rf "$TMP_DIR"
    
    echo ""
    echo "Heapi $VERSION was installed successfully! 🚀"
    echo "Binary installed at: $INSTALL_DIR/heapi"
else
    echo "Error: Unsupported OS: $OS"
    exit 1
fi

# Check if ~/.local/bin is in PATH
case ":$PATH:" in
    *":$INSTALL_DIR:"*) ;;
    *)
        echo ""
        echo "⚠️  WARNING: $INSTALL_DIR is not in your PATH."
        echo "Please add it to your shell profile (e.g., ~/.bashrc or ~/.zshrc):"
        echo "export PATH=\"\$PATH:$INSTALL_DIR\""
        ;;
esac

echo "You can now run 'heapi' from your terminal."
