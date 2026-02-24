@description('The location for all resources. Defaults to the Resource Group location.')
param location string = resourceGroup().location

@description('The base name for the resources.')
param baseName string = 'sonicspirit'

@description('The SQL Server administrator login.')
param sqlAdminLogin string = 'sqladmin'

@secure()
@description('The SQL Server administrator password.')
param sqlAdminPassword string

// --- STORAGE ACCOUNT ---
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${baseName}store'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
  }
}

// --- SQL DATABASE ---
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: '${baseName}-sqlserver'
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: '${baseName}-sqldb'
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
    capacity: 5
  }
}

// Allow Azure Services to access SQL Server
resource sqlFirewallRule 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// --- APP SERVICE (API) ---
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${baseName}-asp'
  location: location
  sku: {
    name: 'F1'
    tier: 'Free'
  }
  properties: {
    reserved: true // Required for Linux
  }
}

resource webApi 'Microsoft.Web/sites@2022-09-01' = {
  name: '${baseName}-api'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      appSettings: [
        {
          name: 'StorageAccountConnectionString'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'SqlConnectionString'
          value: 'Server=tcp:${sqlServer.name}${environment().suffixes.sqlServerHostname},1433;Initial Catalog=${sqlDatabase.name};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
        }
      ]
    }
  }
}

// --- STATIC WEB APP (UI) ---
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: '${baseName}-ui'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

output apiUrl string = webApi.properties.defaultHostName
output uiUrl string = staticWebApp.properties.defaultHostname
