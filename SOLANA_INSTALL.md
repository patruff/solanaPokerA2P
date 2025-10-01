# Solana CLI Installation Guide

If you're having trouble installing Solana CLI, try these methods in order:

## Method 1: Homebrew (Recommended for macOS)

This is the easiest and most reliable method:

```bash
brew install solana
```

Verify:
```bash
solana --version
```

## Method 2: Direct Install Script

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

## Method 3: If You Get SSL Errors

If you see errors like:
```
curl: (35) LibreSSL SSL_connect: SSL_ERROR_SYSCALL in connection to release.solana.com:443
```

Try these alternatives:

### Option A: Use wget

```bash
# Install wget if needed
brew install wget

# Download and install Solana
wget -O - https://release.solana.com/stable/install | sh
```

### Option B: Download from GitHub Releases

**For macOS with Apple Silicon (M1/M2/M3):**
```bash
curl -L https://github.com/solana-labs/solana/releases/download/v1.17.0/solana-release-aarch64-apple-darwin.tar.bz2 -o solana.tar.bz2
tar -xjf solana.tar.bz2
cd solana-release
export PATH=$PWD/bin:$PATH
echo 'export PATH="'$PWD'/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**For macOS with Intel:**
```bash
curl -L https://github.com/solana-labs/solana/releases/download/v1.17.0/solana-release-x86_64-apple-darwin.tar.bz2 -o solana.tar.bz2
tar -xjf solana.tar.bz2
cd solana-release
export PATH=$PWD/bin:$PATH
echo 'export PATH="'$PWD'/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Option C: Use npm

```bash
npm install -g @solana/cli
```

## Verify Installation

After any method, verify it works:

```bash
solana --version
```

You should see something like:
```
solana-cli 1.17.0 (src:...)
```

## Common Issues

### Issue: "command not found: solana"

**Solution**: Add Solana to your PATH

```bash
# For zsh (default on newer macOS)
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile
```

### Issue: SSL/TLS connection errors

**Solutions**:
1. Try Homebrew method (most reliable)
2. Check if you're behind a corporate firewall
3. Disable VPN temporarily
4. Try using your phone's hotspot
5. Use the GitHub direct download method

### Issue: Permission denied

**Solution**: Run with proper permissions

```bash
# If using the install script
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# If you get permission errors, you may need to fix permissions
sudo chown -R $(whoami) ~/.local/share/solana
```

## Next Steps

Once Solana CLI is installed:

1. Configure for devnet:
```bash
solana config set --url devnet
```

2. Create a wallet:
```bash
solana-keygen new
```

3. Get test SOL:
```bash
solana airdrop 2
```

4. Check balance:
```bash
solana balance
```

## Alternative: Use Solana Playground (No Installation)

If you can't get Solana CLI installed locally, you can use Solana Playground:

1. Go to https://beta.solpg.io
2. Build and deploy your program in the browser
3. Use the web-based tools

This is great for testing but you'll still need Solana CLI for production deployment.

## Still Having Issues?

1. Check the official docs: https://docs.solana.com/cli/install-solana-cli-tools
2. Join Solana Discord: https://discord.gg/solana
3. Check your system requirements:
   - macOS 10.14 or later
   - At least 2GB free disk space
   - Active internet connection

## Quick Test

Once installed, test that everything works:

```bash
# Check version
solana --version

# Check config
solana config get

# Test connection to devnet
solana cluster-version --url devnet
```

If all these commands work, you're ready to go! 🚀
