# Universal Project Publishing Script
# Publishes frontend and PHP backend to file system and/or FTP server
# Supports both root deployment (frontpage) and subfolder deployment (other projects)

param(
    [Alias('f')]
    [switch]$Frontend,
    [Alias('b')]
    [switch]$Backend,
    [Alias('a')]
    [switch]$All,
    [Alias('c')]
    [switch]$Clean,
    [Alias('v')]
    [switch]$Verbose,
    [Alias('p')]
    [switch]$Production,
    [switch]$FTP,
    [Alias('fv')]
    [switch]$ForceVendor,
    [Alias('fs')]
    [switch]$FileSystemOnly,
    [string]$FTPProfile = "default",
    [Alias('r')]
    [switch]$RootDeploy
)

# Auto-detect project name from current directory
$PROJECT_NAME = Split-Path -Leaf $PSScriptRoot

# Load .env file for configuration
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^(\w+)=(.*)$") {
            $name = $matches[1]
            $value = $matches[2].Trim('"')  # Remove quotes if present
            Set-Variable -Name $name -Value $value -Scope Script
        }
    }
} else {
    Write-Error ".env file not found! Please create a .env file with required configuration."
    Write-Host @"
Required .env configuration:
PREVIEW_ROOT=H:\xampp\htdocs
PRODUCTION_ROOT=F:\WebHatchery

Optional FTP configuration:
FTP_SERVER=your.ftp.server.com
FTP_USERNAME=your_username
FTP_PASSWORD=your_password
FTP_PORT=21
FTP_REMOTE_ROOT=/public_html
FTP_USE_SSL=false
FTP_PASSIVE_MODE=true

Optional project configuration:
DEPLOY_TO_ROOT=false
"@ -ForegroundColor Yellow
    exit 1
}

# Determine deployment mode - check .env setting or use RootDeploy parameter
$deployToRoot = $false
if ($RootDeploy) {
    $deployToRoot = $true
} elseif ($DEPLOY_TO_ROOT -eq "true") {
    $deployToRoot = $true
}

# FTP Configuration from .env (using script variables, not $env)
$FTPConfig = @{
    Server = $FTP_SERVER
    Username = $FTP_USERNAME  
    Password = $FTP_PASSWORD
    Port = if ($FTP_PORT) { $FTP_PORT -as [int] } else { 21 }
    RemoteRoot = if ($FTP_REMOTE_ROOT) { $FTP_REMOTE_ROOT } else { "/" }
    UseSSL = ($FTP_USE_SSL -eq "true")
    PassiveMode = ($FTP_PASSIVE_MODE -ne "false")  # Default true
}

# Validate FTP configuration if FTP deployment is requested
if ($FTP -and -not $FileSystemOnly) {
    $missingFTPConfig = @()
    if (-not $FTPConfig.Server) { $missingFTPConfig += "FTP_SERVER" }
    if (-not $FTPConfig.Username) { $missingFTPConfig += "FTP_USERNAME" }
    if (-not $FTPConfig.Password) { $missingFTPConfig += "FTP_PASSWORD" }
    
    if ($missingFTPConfig.Count -gt 0) {
        Write-Error "Missing FTP configuration in .env file: $($missingFTPConfig -join ', ')"
        Write-Host @"
Add the following to your .env file:
FTP_SERVER=your.ftp.server.com
FTP_USERNAME=your_username  
FTP_PASSWORD=your_password
FTP_PORT=21
FTP_REMOTE_ROOT=/public_html
FTP_USE_SSL=false
FTP_PASSIVE_MODE=true
"@ -ForegroundColor Yellow
        exit 1
    }
}

# Set destination paths based on Production flag and deployment mode
$DEST_ROOT = if ($Production) { $PRODUCTION_ROOT } else { $PREVIEW_ROOT }

if ($deployToRoot) {
    # Root deployment (like frontpage)
    $DEST_DIR = $DEST_ROOT
    $FRONTEND_DEST = $DEST_DIR
    $BACKEND_DEST = "$DEST_DIR\backend"
} else {
    # Subfolder deployment (like other projects)
    $DEST_DIR = Join-Path $DEST_ROOT $PROJECT_NAME
    $FRONTEND_DEST = $DEST_DIR
    $BACKEND_DEST = "$DEST_DIR\backend"
}

$FRONTEND_SRC = "$PSScriptRoot\frontend"
$BACKEND_SRC = "$PSScriptRoot\backend"

# Color output functions
function Write-Success($message) {
    Write-Host $message -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host $message -ForegroundColor Cyan
}

function Write-Warning($message) {
    Write-Host $message -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host $message -ForegroundColor Red
}

function Write-Progress($message) {
    Write-Host $message -ForegroundColor Magenta
}

# FTP Helper Functions
function Test-FTPConnection {
    param($config)
    
    Write-Progress "Testing FTP connection to $($config.Server)..."
    
    try {
        $ftp = [System.Net.FtpWebRequest]::Create("ftp://$($config.Server):$($config.Port)/")
        $ftp.Credentials = New-Object System.Net.NetworkCredential($config.Username, $config.Password)
        $ftp.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
        $ftp.UseBinary = $true
        $ftp.UsePassive = $config.PassiveMode
        $ftp.EnableSsl = $config.UseSSL
        $ftp.Timeout = 10000  # 10 seconds
        
        $response = $ftp.GetResponse()
        $response.Close()
        
        Write-Success "FTP connection successful"
        return $true
    }
    catch {
        Write-Error "FTP connection failed: $($_.Exception.Message)"
        return $false
    }
}

function Upload-FileToFTP {
    param(
        [string]$LocalPath,
        [string]$RemotePath,
        [hashtable]$Config,
        [switch]$CreateDirectories
    )
    
    try {
        # Create remote directories if needed
        if ($CreateDirectories) {
            $remoteDir = Split-Path $RemotePath -Parent
            if ($remoteDir -and $remoteDir -ne "/" -and $remoteDir -ne ".") {
                Create-FTPDirectory -RemotePath $remoteDir -Config $Config
            }
        }
        
        # Normalize the remote path
        $RemotePath = $RemotePath.Replace('\', '/')
        if (-not $RemotePath.StartsWith('/')) {
            $RemotePath = '/' + $RemotePath
        }
        
        $uri = "ftp://$($Config.Server):$($Config.Port)$RemotePath"
        $ftp = [System.Net.FtpWebRequest]::Create($uri)
        $ftp.Credentials = New-Object System.Net.NetworkCredential($Config.Username, $Config.Password)
        $ftp.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $ftp.UseBinary = $true
        $ftp.UsePassive = $Config.PassiveMode
        $ftp.EnableSsl = $Config.UseSSL
        $ftp.Timeout = 30000  # 30 seconds for file uploads
        
        $fileContent = [System.IO.File]::ReadAllBytes($LocalPath)
        $ftp.ContentLength = $fileContent.Length
        
        $requestStream = $ftp.GetRequestStream()
        $requestStream.Write($fileContent, 0, $fileContent.Length)
        $requestStream.Close()
        
        $response = $ftp.GetResponse()
        $response.Close()
        
        if ($Verbose) {
            Write-Host "   $RemotePath" -ForegroundColor Gray
        }
        return $true
    }
    catch {
        Write-Warning "Failed to upload $RemotePath`: $($_.Exception.Message)"
        return $false
    }
}

function Create-FTPDirectory {
    param(
        [string]$RemotePath,
        [hashtable]$Config
    )
    
    # Normalize the remote path
    $RemotePath = $RemotePath.Replace('\', '/').TrimEnd('/')
    
    # If the path is just the root, nothing to create
    if ($RemotePath -eq $Config.RemoteRoot.TrimEnd('/') -or $RemotePath -eq '/') {
        return
    }
    
    # Split path into parts and create each directory level
    $fullPath = $RemotePath
    if (-not $fullPath.StartsWith('/')) {
        $fullPath = '/' + $fullPath
    }
    
    # Remove the remote root from the path to get relative path
    $relativePath = $fullPath
    if ($Config.RemoteRoot -ne '/') {
        $rootPath = $Config.RemoteRoot.TrimEnd('/')
        if ($fullPath.StartsWith($rootPath)) {
            $relativePath = $fullPath.Substring($rootPath.Length)
        }
    }
    
    $pathParts = $relativePath.TrimStart('/').Split('/') | Where-Object { $_ -ne '' }
    $currentPath = $Config.RemoteRoot.TrimEnd('/')
    
    foreach ($part in $pathParts) {
        $currentPath += "/$part"
        
        try {
            $uri = "ftp://$($Config.Server):$($Config.Port)$currentPath"
            $ftp = [System.Net.FtpWebRequest]::Create($uri)
            $ftp.Credentials = New-Object System.Net.NetworkCredential($Config.Username, $Config.Password)
            $ftp.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
            $ftp.UsePassive = $Config.PassiveMode
            $ftp.EnableSsl = $Config.UseSSL
            $ftp.Timeout = 10000
            
            $response = $ftp.GetResponse()
            $response.Close()
            
            if ($Verbose) {
                Write-Host "   Created directory: $currentPath" -ForegroundColor DarkGray
            }
        }
        catch {
            # Directory might already exist (550 error) or other issues
            if ($_.Exception.Message.Contains("550")) {
                # Directory already exists - this is OK
                if ($Verbose) {
                    Write-Host "   Directory exists: $currentPath" -ForegroundColor DarkGray
                }
            } else {
                # Other error - log it but continue
                Write-Verbose "Note creating directory $currentPath`: $($_.Exception.Message)"
            }
        }
    }
}

function Upload-DirectoryToFTP {
    param(
        [string]$LocalPath,
        [string]$RemotePath,
        [hashtable]$Config,
        [array]$ExcludePatterns = @()
    )
    
    Write-Progress "Uploading $LocalPath to FTP: $RemotePath"
    
    # Create the target remote directory first
    Create-FTPDirectory -RemotePath $RemotePath -Config $Config
    
    $items = Get-ChildItem -Path $LocalPath -Recurse -File
    $uploadCount = 0
    $skipCount = 0
    
    foreach ($item in $items) {
        $relativePath = $item.FullName.Substring($LocalPath.Length + 1).Replace('\', '/')
        $remoteFilePath = "$RemotePath/$relativePath".Replace('//', '/')
        
        # Check exclusion patterns
        $shouldExclude = $false
        foreach ($pattern in $ExcludePatterns) {
            if ($relativePath -like $pattern) {
                $shouldExclude = $true
                break
            }
        }
        
        # Skip vendor uploads if requested and we're in vendor directory
        if (-not $ForceVendor -and $relativePath.StartsWith("vendor/")) {
            $shouldExclude = $true
            if ($Verbose) {
                Write-Host "    Skipped (vendor): $relativePath" -ForegroundColor Yellow
            }
        }
        
        if (-not $shouldExclude) {
            if (Upload-FileToFTP -LocalPath $item.FullName -RemotePath $remoteFilePath -Config $Config -CreateDirectories) {
                $uploadCount++
            }
        } else {
            $skipCount++
        }
    }
    
    Write-Success "Uploaded $uploadCount files to FTP (skipped $skipCount)"
}

# Ensure destination directory exists
function Ensure-Directory($path) {
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Info "Created directory: $path"
    }
}

# Clean destination directory
function Clean-Directory($path) {
    if (Test-Path $path) {
        Write-Warning "Cleaning directory: $path"
        Remove-Item -Path "$path\*" -Recurse -Force
        Write-Success "Directory cleaned"
    }
}

# Copy files with exclusions
function Copy-WithExclusions($source, $destination, $excludePatterns) {
    Write-Progress "Copying from $source to $destination"
    
    Ensure-Directory $destination
    
    $items = Get-ChildItem -Path $source -Recurse
    
    foreach ($item in $items) {
        $relativePath = $item.FullName.Substring($source.Length + 1)
        $destPath = Join-Path $destination $relativePath
        
        $shouldExclude = $false
        foreach ($pattern in $excludePatterns) {
            if ($relativePath -like $pattern) {
                $shouldExclude = $true
                break
            }
        }
        
        if (-not $shouldExclude) {
            if ($item.PSIsContainer) {
                Ensure-Directory $destPath
            } else {
                $destDir = Split-Path $destPath -Parent
                Ensure-Directory $destDir
                Copy-Item $item.FullName $destPath -Force
                if ($Verbose) {
                    Write-Host "  Copied: $relativePath" -ForegroundColor Gray
                }
            }
        } else {
            if ($Verbose) {
                Write-Host "  Excluded: $relativePath" -ForegroundColor DarkGray
            }
        }
    }
}

# Build frontend
function Build-Frontend {
    Write-Progress "Building frontend..."
    
    # Check if frontend directory exists
    if (-not (Test-Path $FRONTEND_SRC)) {
        Write-Error "Frontend directory not found: $FRONTEND_SRC"
        Write-Error "This project requires a frontend directory to build"
        return $false
    }
    
    Set-Location $FRONTEND_SRC
    
    if (!(Test-Path "node_modules")) {
        Write-Info "Installing frontend dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install frontend dependencies"
            return $false
        }
    }
    
    $environment = if ($Production -or $FTP) { "production" } else { "preview" }
    Write-Info "Setting up $environment environment for frontend build..."
    $envSrc = ".env.$environment"
    $envTemp = ".env.local"
    
    if (Test-Path $envSrc) {
        Copy-Item $envSrc $envTemp -Force
        Write-Info "Using $envSrc for frontend build"
    } else {
        Write-Warning "$envSrc not found - using default environment"
    }
    
    Write-Info "Building frontend for production..."
    $env:NODE_ENV = "production"
    
    # Set base path based on deployment mode
    if ($deployToRoot) {
        Write-Info "Setting base path to root (DEPLOY_TO_ROOT=true)..."
        $env:VITE_BASE_PATH = "/"
    } else {
        if ($Production) {
            $env:VITE_BASE_PATH = "/$PROJECT_NAME/"
        } else {
            $env:VITE_BASE_PATH = "/$PROJECT_NAME/"
        }
        Write-Info "Setting base path for project subfolder: $($env:VITE_BASE_PATH)"
    }
    
    if ($Production) {
        npx vite build --mode production
    } else {
        npx vite build --mode preview
    }
    
    $buildResult = $LASTEXITCODE
    
    if (Test-Path $envTemp) {
        Remove-Item $envTemp -Force
    }
    
    if ($buildResult -ne 0) {
        Write-Error "Failed to build frontend"
        return $false
    }
    
    Write-Success "Frontend build completed"
    return $true
}

# Enhanced frontend publishing with FTP support
function Publish-Frontend {
    Write-Progress "Publishing frontend..."
    
    if (!(Build-Frontend)) {
        return $false
    }
    
    $success = $true
    $distPath = "$FRONTEND_SRC\dist"
    
    if (-not (Test-Path $distPath)) {
        Write-Error "Frontend build output not found at $distPath"
        return $false
    }
    
    # File system deployment (if not FTP-only)
    if (-not $FTP -or $FileSystemOnly) {
        if ($Clean) {
            if ($deployToRoot) {
                Write-Warning "Cleaning specific frontend files from root directory..."
                $frontendFiles = @("index.html", "assets")
                foreach ($item in $frontendFiles) {
                    $itemPath = Join-Path $FRONTEND_DEST $item
                    if (Test-Path $itemPath) {
                        Write-Info "Removing existing: $item"
                        Remove-Item -Path $itemPath -Recurse -Force -ErrorAction SilentlyContinue
                    }
                }
            } else {
                Write-Warning "Cleaning project directory (preserving backend)..."
                Get-ChildItem -Path $FRONTEND_DEST -Exclude "backend" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
        
        Write-Info "Copying built frontend files to $(if ($deployToRoot) { 'root directory' } else { 'project directory' })..."
        Get-ChildItem -Path $distPath | ForEach-Object {
            $sourceItem = $_.FullName
            $itemName = $_.Name
            $destPath = Join-Path $FRONTEND_DEST $itemName
            
            if ($itemName -ne "backend") {
                if ((Test-Path $destPath) -and (Get-Item $destPath).PSIsContainer) {
                    Remove-Item $destPath -Recurse -Force -ErrorAction SilentlyContinue
                }
                
                if ($_.PSIsContainer) {
                    Copy-Item $sourceItem $destPath -Recurse -Force
                } else {
                    Copy-Item $sourceItem $destPath -Force
                }
                
                if ($Verbose) {
                    Write-Host "  Copied: $itemName" -ForegroundColor Gray
                }
            }
        }
        Write-Success "Frontend published to file system: $FRONTEND_DEST"
    }
    
    # FTP deployment
    if ($FTP) {
        if (Test-FTPConnection -config $FTPConfig) {
            $excludePatterns = @("*.map", "*.tmp")
            
            # Set FTP destination path based on deployment mode
            $ftpDestPath = if ($deployToRoot) {
                $FTPConfig.RemoteRoot
            } else {
                "$($FTPConfig.RemoteRoot)/$PROJECT_NAME".Replace('//', '/')
            }
            
            Upload-DirectoryToFTP -LocalPath $distPath -RemotePath $ftpDestPath -Config $FTPConfig -ExcludePatterns $excludePatterns
            Write-Success "Frontend published to FTP server"
        } else {
            Write-Error "FTP connection failed - skipping FTP upload"
            $success = $false
        }
    }
    
    return $success
}

# Install PHP backend dependencies
function Install-BackendDependencies {
    Write-Progress "Installing PHP backend dependencies..."
    
    # Check if backend directory exists
    if (-not (Test-Path $BACKEND_SRC)) {
        Write-Warning "Backend directory not found: $BACKEND_SRC"
        Write-Info "Skipping backend dependency installation - this project appears to be frontend-only"
        return $true  # Return true to indicate success (no backend to install)
    }
    
    Set-Location $BACKEND_SRC
    
    try {
        composer --version | Out-Null
    } catch {
        Write-Error "Composer not found. Please install Composer first."
        return $false
    }
    
    composer install --no-dev --optimize-autoloader
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install PHP dependencies"
        return $false
    }
    
    Write-Success "PHP dependencies installed"
    return $true
}

# Enhanced backend publishing with FTP support
function Publish-Backend {
    Write-Progress "Publishing PHP backend..."
    
    # Check if backend directory exists
    if (-not (Test-Path $BACKEND_SRC)) {
        Write-Warning "Backend directory not found: $BACKEND_SRC"
        Write-Info "Skipping backend publishing - this project appears to be frontend-only"
        return $true  # Return true to indicate success (no backend to publish)
    }
    
    if (!(Install-BackendDependencies)) {
        return $false
    }
    
    $success = $true
    
    # File system deployment (if not FTP-only)
    if (-not $FTP -or $FileSystemOnly) {
        if ($Clean) {
            Clean-Directory $BACKEND_DEST
        }
        
        $excludePatterns = @(
            "node_modules\*", ".git\*", ".env", ".env.local", ".env.example",
            "tests\*", "*.log", "*.tmp", "storage\logs\*", "storage\cache\*",
            "var\cache\*", "vendor\*\tests\*", "vendor\*\test\*", "vendor\*\.git\*",
            "*.md", "composer.lock", "phpunit.xml", "*.ps1", "debug*.php",
            "test*.php", "install.php", "*.md"
        )
        
        Copy-WithExclusions $BACKEND_SRC $BACKEND_DEST $excludePatterns
        
        # Handle environment configuration
        $environment = if ($Production -or $FTP) { "production" } else { "preview" }
        Write-Info "Setting up $environment environment configuration..."
        $envSrc = "$BACKEND_SRC\.env.$environment"
        $envDest = "$BACKEND_DEST\.env"
        
        if (Test-Path $envSrc) {
            Copy-Item $envSrc $envDest -Force
            Write-Success "Copied $envSrc to .env for $environment use"
        } else {
            Write-Warning "$envSrc not found - using base .env"
            $baseEnvSrc = "$BACKEND_SRC\.env"
            if (Test-Path $baseEnvSrc) {
                Copy-Item $baseEnvSrc $envDest -Force
            }
        }
        
        # Create necessary directories
        Ensure-Directory "$BACKEND_DEST\storage\logs"
        Ensure-Directory "$BACKEND_DEST\var\cache"
        
        Write-Success "PHP backend published to file system: $BACKEND_DEST"
    }
    
    # FTP deployment
    if ($FTP) {
        if (Test-FTPConnection -config $FTPConfig) {
            $excludePatterns = @(
                "node_modules/*", ".git/*", ".env*", "tests/*", "*.log", "*.tmp",
                "storage/logs/*", "storage/cache/*", "var/cache/*", "vendor/*/tests/*",
                "vendor/*/test/*", "vendor/*/.git/*", "*.md", "composer.lock",
                "phpunit.xml", "*.ps1", "debug*.php", "test*.php", "install.php"
            )
            
            # Set FTP backend destination path based on deployment mode
            $backendRemotePath = if ($deployToRoot) {
                "$($FTPConfig.RemoteRoot)/backend".Replace('//', '/')
            } else {
                "$($FTPConfig.RemoteRoot)/$PROJECT_NAME/backend".Replace('//', '/')
            }
            
            # Note: Vendor uploads are skipped by default unless -ForceVendor is used
            # This is handled in the Upload-DirectoryToFTP function
            
            Upload-DirectoryToFTP -LocalPath $BACKEND_SRC -RemotePath $backendRemotePath -Config $FTPConfig -ExcludePatterns $excludePatterns
            
            # Upload environment file
            $environment = if ($Production -or $FTP) { "production" } else { "preview" }
            $envSrc = "$BACKEND_SRC\.env.$environment"
            if (Test-Path $envSrc) {
                $envRemotePath = "$backendRemotePath/.env"
                Upload-FileToFTP -LocalPath $envSrc -RemotePath $envRemotePath -Config $FTPConfig -CreateDirectories
                Write-Success "Uploaded environment configuration"
            }
            
            Write-Success "PHP backend published to FTP server"
        } else {
            Write-Error "FTP connection failed - skipping FTP upload"
            $success = $false
        }
    }
    
    return $success
}

# Enhanced main execution function
function Main {
    $deploymentType = if ($deployToRoot) { "Root" } else { "Subfolder" }
    $deploymentTarget = if ($FTP) { 'FTP' } else { 'File System' }
    $environmentType = if ($Production) { 'Production' } else { 'Preview' }
    
    Write-Info "$PROJECT_NAME Universal Publishing Script"
    Write-Info "============================================"
    Write-Info "Project: $PROJECT_NAME"
    Write-Info "Deployment: $deploymentType ($deploymentTarget, $environmentType)"
    
    # Check what components exist
    $hasFrontend = Test-Path $FRONTEND_SRC
    $hasBackend = Test-Path $BACKEND_SRC
    
    Write-Info "Available components:"
    Write-Info "  Frontend: $(if ($hasFrontend) { 'Found' } else { 'Missing' })"
    Write-Info "  Backend: $(if ($hasBackend) { 'Found' } else { 'Missing' })"
    
    if (-not $hasFrontend -and -not $hasBackend) {
        Write-Error "No frontend or backend directories found! Please check project structure."
        exit 1
    }
    
    if (-not $FTP -or $FileSystemOnly) {
        Ensure-Directory $DEST_DIR
    }
    
    $success = $true
    
    if ($All -or (!$Frontend -and !$Backend)) {
        Write-Info "Publishing both frontend and backend (if available)..."
        $Frontend = $hasFrontend
        $Backend = $hasBackend
    } else {
        # Check if requested components exist
        if ($Frontend -and -not $hasFrontend) {
            Write-Error "Frontend publishing requested but frontend directory not found!"
            exit 1
        }
        if ($Backend -and -not $hasBackend) {
            Write-Warning "Backend publishing requested but backend directory not found - skipping backend"
            $Backend = $false
        }
    }
    
    $originalLocation = Get-Location
    
    try {
        if ($Frontend) {
            if (!(Publish-Frontend)) {
                $success = $false
            }
        }
        
        if ($Backend) {
            if (!(Publish-Backend)) {
                $success = $false
            }
        }
        
        if ($success) {
            # Copy root .htaccess for file system deployment
            if (-not $FTP -or $FileSystemOnly) {
                $rootHtaccessSrc = "$PSScriptRoot\.htaccess"
                $rootHtaccessDest = "$DEST_DIR\.htaccess"
                if (Test-Path $rootHtaccessSrc) {
                    Copy-Item $rootHtaccessSrc $rootHtaccessDest -Force
                    Write-Info "Copied root .htaccess file"
                }
            }
            
            # Upload root .htaccess for FTP deployment
            if ($FTP) {
                $rootHtaccessSrc = "$PSScriptRoot\.htaccess"
                if (Test-Path $rootHtaccessSrc) {
                    $htaccessRemotePath = if ($deployToRoot) {
                        "$($FTPConfig.RemoteRoot)/.htaccess"
                    } else {
                        "$($FTPConfig.RemoteRoot)/$PROJECT_NAME/.htaccess".Replace('//', '/')
                    }
                    Upload-FileToFTP -LocalPath $rootHtaccessSrc -RemotePath $htaccessRemotePath -Config $FTPConfig
                    Write-Info "Uploaded root .htaccess file to FTP"
                }
            }
            
            Write-Success "`nPublishing completed successfully!"
            if (-not $FTP -or $FileSystemOnly) {
                Write-Info "File system location: $DEST_DIR"
            }
            if ($FTP) {
                $ftpLocation = if ($deployToRoot) {
                    "$($FTPConfig.Server)$($FTPConfig.RemoteRoot)"
                } else {
                    "$($FTPConfig.Server)$($FTPConfig.RemoteRoot)/$PROJECT_NAME"
                }
                Write-Info "FTP server: $ftpLocation"
            }
        } else {
            Write-Error "`nPublishing failed!"
            exit 1
        }
        
    } finally {
        Set-Location $originalLocation
    }
}

# Enhanced help function
function Show-Help {
    Write-Host @"
$PROJECT_NAME Universal Publishing Script
=========================================

Usage: .\publish.ps1 [OPTIONS]

OPTIONS:
    -Frontend, -f         Publish only the frontend
    -Backend, -b          Publish only the PHP backend  
    -All, -a              Publish both (default if no specific option given)
    -Clean, -c            Clean destination directories before publishing
    -Verbose, -v          Show detailed output during copying/uploading
    -Production, -p       Deploy to production environment
    -FTP, -ftp            Deploy to FTP server (requires FTP configuration in .env)
    -ForceVendor, -fv     Force upload of vendor directory (default: skip vendor uploads)
    -FileSystemOnly, -fs  Force file system deployment even when -FTP is specified
    -RootDeploy, -r       Force deployment to root directory (overrides .env DEPLOY_TO_ROOT)
    -FTPProfile           Use named FTP profile from .env (default: "default")
    -Help                 Show this help message

EXAMPLES:
    .\publish.ps1                           # File system deployment to preview
    .\publish.ps1 -f -p                     # Frontend only to production file system
    .\publish.ps1 -ftp -p                   # Both to production FTP server
    .\publish.ps1 -b -ftp -ForceVendor      # Backend to FTP, force vendor upload
    .\publish.ps1 -All -Clean -FTP -Verbose # Clean deploy both to FTP with details
    .\publish.ps1 -RootDeploy -p            # Force root deployment to production

REQUIRED .ENV CONFIGURATION:
File System Deployment:
    PREVIEW_ROOT=H:\xampp\htdocs
    PRODUCTION_ROOT=F:\WebHatchery

Optional Project Settings:
    DEPLOY_TO_ROOT=false                    # Set to true for root deployment (like frontpage)

Optional FTP Deployment:
    FTP_SERVER=your.server.com
    FTP_USERNAME=your_username
    FTP_PASSWORD=your_password
    FTP_PORT=21
    FTP_REMOTE_ROOT=/public_html
    FTP_USE_SSL=false
    FTP_PASSIVE_MODE=true

DEPLOYMENT MODES:
Root Deployment (DEPLOY_TO_ROOT=true or -RootDeploy):
    - Deploys directly to root directory (like frontpage project)
    - Frontend files go to root, backend to root/backend/
    
Subfolder Deployment (DEPLOY_TO_ROOT=false, default):
    - Deploys to project-named subfolder
    - All files go under <root>/<project-name>/

FEATURES:
    - Universal: Works for both root and subfolder deployments
    - Dual deployment: File system and/or FTP
    - Smart vendor skipping: Skips vendor uploads by default (use -ForceVendor to override)
    - Connection testing: Validates FTP connection before deployment
    - Selective cleaning: Cleans only relevant files, preserves others
    - Progress tracking: Detailed progress and error reporting
    - Environment support: Separate preview and production configurations
    - Auto-detection: Automatically detects project name and deployment mode

"@ -ForegroundColor White
}

# Check for help request
if ($args -contains "-Help" -or $args -contains "--help" -or $args -contains "/?" -or $args -contains "-h") {
    Show-Help
    exit 0
}

# Validate parameters
if ($FTP -and $FileSystemOnly) {
    Write-Warning "-FTP and -FileSystemOnly specified together. Will deploy to both targets."
}

# Run main function
Main
