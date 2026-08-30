# Debloat Windows

## Overview
- **ID/URL**: `debloat-windows`
- **Description**: Choose between Sparkle Debloat script or Raphire's Win11Debloat script to remove built-in Windows apps and bloatware.
- **Risk Level**: <span style="color:#4caf50">Safe</span>

!!! info "Irreversible"
    This tweak cannot be reversed and must be undone manually.


!!! note 
    This tweak was last updated in 2.14.0
  

## Details

## The user can choose between two methods to debloat Windows:

## 1. Sparkle Custom Selective Script:

- This method allows users to select which apps they want to keep. A WPF Window is presented where users can check or uncheck apps from a list.

##  2. Raphire's Win11Debloat Script:

- This method uses a well-known script that removes a wide range of built-in Windows apps and features. It is comprehensive and suitable for users who want a quick and effective way to debloat their system.

 Both remove bloatware and improve privacy by removing unnecessary Microsoft components, but they cater to different user preferences regarding control and convenience.



!!! tip "Recommended"
    This tweak is recommended.


## Apply

```powershell { .no-copy }  
# Sparkle Debloat Script
# This script provides options for different debloat methods
# Made by Parcoil
# Credits to Raphire for his debloat script: https://github.com/Raphire

param(
    [string]$ScriptChoice = "",
    [string[]]$AppsToRemove = @()
)

$version = "1.2.0"

function Test-IsAdmin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
    Write-Host "[Sparkle Debloat] This script must be run as Administrator." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# list of apps to remove
$appDefinitions = @(
    @{ Package = "Clipchamp.Clipchamp"; FriendlyName = "Clipchamp Video Editor" },
    @{ Package = "Microsoft.3DBuilder"; FriendlyName = "3D Builder" },
    @{ Package = "Microsoft.549981C3F5F10"; FriendlyName = "Cortana" },
    @{ Package = "Microsoft.BingFinance"; FriendlyName = "Bing Finance" },
    @{ Package = "Microsoft.BingFoodAndDrink"; FriendlyName = "Bing Food & Drink" },
    @{ Package = "Microsoft.BingHealthAndFitness"; FriendlyName = "Bing Health & Fitness" },
    @{ Package = "Microsoft.BingNews"; FriendlyName = "Bing News" },
    @{ Package = "Microsoft.BingSports"; FriendlyName = "Bing Sports" },
    @{ Package = "Microsoft.BingTranslator"; FriendlyName = "Bing Translator" },
    @{ Package = "Microsoft.BingTravel"; FriendlyName = "Bing Travel" },
    @{ Package = "Microsoft.BingWeather"; FriendlyName = "Bing Weather" },
    @{ Package = "Microsoft.Windows.DevHome"; FriendlyName = "Dev Home" },
    @{ Package = "Microsoft.Copilot"; FriendlyName = "Microsoft Copilot" },
    @{ Package = "Microsoft.Getstarted"; FriendlyName = "Get Started (Tips)" },
    @{ Package = "Microsoft.Messaging"; FriendlyName = "Microsoft Messaging" },
    @{ Package = "Microsoft.Microsoft3DViewer"; FriendlyName = "3D Viewer" },
    @{ Package = "Microsoft.MicrosoftJournal"; FriendlyName = "Microsoft Journal" },
    @{ Package = "Microsoft.MicrosoftOfficeHub"; FriendlyName = "Office Hub" },
    @{ Package = "Microsoft.MicrosoftPowerBIForWindows"; FriendlyName = "Power BI" },
    @{ Package = "Microsoft.PowerAutomateDesktop"; FriendlyName = "Power Automate" },
    @{ Package = "Microsoft.MicrosoftSolitaireCollection"; FriendlyName = "Solitaire Collection" },
    @{ Package = "Microsoft.MicrosoftStickyNotes"; FriendlyName = "Sticky Notes" },
    @{ Package = "Microsoft.MixedReality.Portal"; FriendlyName = "Mixed Reality Portal" },
    @{ Package = "Microsoft.News"; FriendlyName = "Microsoft News" },
    @{ Package = "Microsoft.Office.OneNote"; FriendlyName = "OneNote" },
    @{ Package = "Microsoft.Office.Sway"; FriendlyName = "Office Sway" },
    @{ Package = "Microsoft.OneConnect"; FriendlyName = "OneConnect" },
    @{ Package = "Microsoft.Paint"; FriendlyName = "Paint" },
    @{ Package = "Microsoft.Print3D"; FriendlyName = "Print 3D" },
    @{ Package = "Microsoft.SkypeApp"; FriendlyName = "Skype" },
    @{ Package = "Microsoft.Todos"; FriendlyName = "Microsoft To Do" },
    @{ Package = "Microsoft.WindowsAlarms"; FriendlyName = "Alarms & Clock" },
    @{ Package = "Microsoft.WindowsCamera"; FriendlyName = "Camera" },
    @{ Package = "Microsoft.WindowsFeedbackHub"; FriendlyName = "Feedback Hub" },
    @{ Package = "Microsoft.WindowsMaps"; FriendlyName = "Maps" },
    @{ Package = "Microsoft.WindowsNotepad"; FriendlyName = "Notepad" },
    @{ Package = "Microsoft.WindowsSoundRecorder"; FriendlyName = "Sound Recorder" },
    @{ Package = "Microsoft.XboxApp"; FriendlyName = "Xbox Console Companion" },
    @{ Package = "Microsoft.ZuneVideo"; FriendlyName = "Movies & TV" },
    @{ Package = "MicrosoftCorporationII.MicrosoftFamily"; FriendlyName = "Microsoft Family" },
    @{ Package = "MicrosoftTeams"; FriendlyName = "Microsoft Teams" },
    @{ Package = "MSTeams"; FriendlyName = "Teams" },
    @{ Package = "Microsoft.WindowsCalculator"; FriendlyName = "Calculator" },
    @{ Package = "Microsoft.Windows.Photos"; FriendlyName = "Photos" },
    @{ Package = "microsoft.windowscommunicationsapps"; FriendlyName = "Mail & Calendar" },
    @{ Package = "Microsoft.XboxGamingOverlay"; FriendlyName = "Xbox Game Bar" },
    @{ Package = "Microsoft.XboxIdentityProvider"; FriendlyName = "Xbox Identity Provider" },
    @{ Package = "Microsoft.XboxSpeechToTextOverlay"; FriendlyName = "Xbox Speech to Text" },
    @{ Package = "Microsoft.OneDrive"; FriendlyName = "OneDrive" },
    @{ Package = "Amazon.com.Amazon"; FriendlyName = "Amazon" },
    @{ Package = "9P1J8S7CCWWT"; FriendlyName = "Clipchamp (Store)" },
    @{ Package = "AmazonVideo.PrimeVideo"; FriendlyName = "Prime Video" },
    @{ Package = "Disney"; FriendlyName = "Disney+" },
    @{ Package = "Duolingo-LearnLanguagesforFree"; FriendlyName = "Duolingo" },
    @{ Package = "Facebook"; FriendlyName = "Facebook" },
    @{ Package = "FarmVille2CountryEscape"; FriendlyName = "FarmVille 2" },
    @{ Package = "Instagram"; FriendlyName = "Instagram" },
    @{ Package = "Netflix"; FriendlyName = "Netflix" },
    @{ Package = "PandoraMediaInc.Pandora"; FriendlyName = "Pandora" },
    @{ Package = "Spotify"; FriendlyName = "Spotify" },
    @{ Package = "Twitter"; FriendlyName = "Twitter" },
    @{ Package = "TwitterUniversal"; FriendlyName = "Twitter (Universal)" },
    @{ Package = "YouTube"; FriendlyName = "YouTube" },
    @{ Package = "Plex"; FriendlyName = "Plex" },
    @{ Package = "TikTok"; FriendlyName = "TikTok" },
    @{ Package = "TuneInRadio"; FriendlyName = "TuneIn Radio" },
    @{ Package = "king.com.BubbleWitch3Saga"; FriendlyName = "Bubble Witch 3 Saga" },
    @{ Package = "king.com.CandyCrushSaga"; FriendlyName = "Candy Crush Saga" },
    @{ Package = "king.com.CandyCrushSodaSaga"; FriendlyName = "Candy Crush Soda Saga" },
    @{ Package = "9NBLGGH4QGHW"; FriendlyName = "Microsoft Sticky Notes" },
    @{ Package = "Phone Link"; FriendlyName = "Phone Link" }   
)

$recommendedApps = @(
    "Microsoft.3DBuilder",
    "Microsoft.549981C3F5F10",
    "Microsoft.BingFinance",
    "Microsoft.BingFoodAndDrink",
    "Microsoft.BingHealthAndFitness",
    "Microsoft.BingNews",
    "Microsoft.BingSports",
    "Microsoft.BingTranslator",
    "Microsoft.BingTravel",
    "Microsoft.BingWeather",
    "Microsoft.Windows.DevHome",
    "Microsoft.Copilot",
    "Microsoft.Getstarted",
    "Microsoft.Messaging",
    "Microsoft.Microsoft3DViewer",
    "Microsoft.MicrosoftJournal",
    "Microsoft.MicrosoftOfficeHub",
    "Microsoft.MicrosoftPowerBIForWindows",
    "Microsoft.PowerAutomateDesktop",
    "Microsoft.MicrosoftSolitaireCollection",
    "Microsoft.MixedReality.Portal",
    "Microsoft.News",
    "Microsoft.Office.OneNote",
    "Microsoft.Office.Sway",
    "Microsoft.OneConnect",
    "Microsoft.Print3D",
    "Microsoft.SkypeApp",
    "Microsoft.Todos",
    "Microsoft.WindowsFeedbackHub",
    "Microsoft.WindowsMaps",
    "Microsoft.WindowsSoundRecorder",
    "Microsoft.XboxApp",
    "Microsoft.ZuneVideo",
    "MicrosoftTeams",
    "MSTeams",
    "MicrosoftCorporationII.MicrosoftFamily",
    "Clipchamp.Clipchamp",
    "9P1J8S7CCWWT",
    "Amazon.com.Amazon",
    "AmazonVideo.PrimeVideo",
    "Disney",
    "Duolingo-LearnLanguagesforFree",
    "Facebook",
    "FarmVille2CountryEscape",
    "Instagram",
    "Netflix",
    "PandoraMediaInc.Pandora",
    "Spotify",
    "Twitter",
    "TwitterUniversal",
    "YouTube",
    "Plex",
    "TikTok",
    "TuneInRadio",
    "king.com.BubbleWitch3Saga",
    "king.com.CandyCrushSaga",
    "king.com.CandyCrushSodaSaga",
    "Phone Link"
)

function Get-FriendlyName {
    param([string]$PackageName)
    
    $def = $appDefinitions | Where-Object { $_.Package -eq $PackageName }
    if ($def) {
        return $def.FriendlyName
    }
    
    # fallback to auto-generated name
    return $PackageName -replace "MicrosoftCorporationII\.", "" -replace "Microsoft\.", "" -replace "\.", " "
}

function Show-ScriptSelectionDialog {
    [xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Sparkle Debloat v$version" 
        Height="300" Width="650" 
        WindowStartupLocation="CenterScreen"
        Topmost="True"
        ResizeMode="NoResize"
        Background="#0c121f">
    <Window.Resources>
        <Style TargetType="RadioButton">
            <Setter Property="Foreground" Value="#f0f4f8"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="Padding" Value="8,6"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Style.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                    <Setter Property="Foreground" Value="#4f90e6"/>
                </Trigger>
            </Style.Triggers>
        </Style>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#243144"/>
            <Setter Property="Foreground" Value="#f0f4f8"/>
            <Setter Property="BorderBrush" Value="#1f2a3d"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="18,8"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}" 
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="6"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#4f90e6"/>
                                <Setter Property="Foreground" Value="#ffffff"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter Property="Background" Value="#4f90e6"/>
                                <Setter Property="Foreground" Value="#ffffff"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>
    
    <Grid Margin="24">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>
        
        <TextBlock Grid.Row="0" 
                   Text="Choose your debloat approach:" 
                   FontSize="16" 
                   FontWeight="SemiBold" 
                   Foreground="#f0f4f8"
                   Margin="0,0,0,20"/>
        
        <Border Grid.Row="1" 
                Background="#131c2c" 
                BorderBrush="#1f2a3d" 
                BorderThickness="1" 
                CornerRadius="8"
                Padding="20"
                Margin="0,0,0,20">
            <StackPanel>
                <RadioButton x:Name="RadioSparkle" 
                            Content="Sparkle Debloat (Choose which apps to remove) - Recommended" 
                            Margin="0,0,0,16" 
                            IsChecked="True"/>
                <RadioButton x:Name="RadioRaphire" 
                            Content="Raphire's Win11Debloat (Comprehensive - read docs for details)"/>
            </StackPanel>
        </Border>
        
        <StackPanel Grid.Row="2" 
                    Orientation="Horizontal" 
                    HorizontalAlignment="Right" 
                    Margin="0,20,0,0">
            <Button x:Name="BtnOK" Content="Continue" Width="100" Margin="0,0,12,0" IsDefault="True"/>
            <Button x:Name="BtnCancel" Content="Cancel" Width="100" IsCancel="True"/>
        </StackPanel>
    </Grid>
</Window>
"@

    $reader = New-Object System.Xml.XmlNodeReader $xaml
    $window = [Windows.Markup.XamlReader]::Load($reader)
    
    $radioRaphire = $window.FindName("RadioRaphire")
    $btnOK = $window.FindName("BtnOK")
    $btnCancel = $window.FindName("BtnCancel")
    
    $script:dialogResult = $null
    
    $btnOK.Add_Click({
            if ($radioRaphire.IsChecked) {
                $script:dialogResult = "raphire"
            }
            else {
                $script:dialogResult = "custom"
            }
            $window.Close()
        })
    
    $btnCancel.Add_Click({
            $script:dialogResult = "cancel"
            $window.Close()
        })
    
    $window.ShowDialog() | Out-Null
    return $script:dialogResult
}

function Show-BehaviorChangeWarning {
    [xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Sparkle Debloat - Important Change" 
        Height="420" Width="550" 
        WindowStartupLocation="CenterScreen"
        Topmost="True"
        ResizeMode="NoResize"
        Background="#0c121f">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#4f90e6"/>
            <Setter Property="Foreground" Value="#ffffff"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Padding" Value="24,10"/>
            <Setter Property="FontSize" Value="14"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}" 
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="6"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#4f90e6"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter Property="Background" Value="#4f90e6"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>
    
    <Grid Margin="28">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>
        
        <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="0,0,0,16">
            <TextBlock Text="!" FontSize="24" FontWeight="Bold" Foreground="#f59e0b" Margin="0,0,10,0" VerticalAlignment="Center"/>
            <TextBlock Text="Behavior Has Changed!"
                       FontSize="18" 
                       FontWeight="SemiBold" 
                       Foreground="#f0f4f8"
                       VerticalAlignment="Center"/>
        </StackPanel>
        
        <Border Grid.Row="1" 
                Background="#131c2c" 
                BorderBrush="#f59e0b" 
                BorderThickness="1" 
                CornerRadius="8"
                Padding="16"
                Margin="0,0,0,20">
            <StackPanel>
                <TextBlock Text="The app selection has been inverted:" 
                           FontSize="14" 
                           FontWeight="SemiBold" 
                           Foreground="#aab4c3"
                           Margin="0,0,0,10"/>
                <TextBlock Text="- Previously: You selected apps to KEEP"
                           FontSize="13" 
                           Foreground="#aab4c3"
                           Margin="0,0,0,4"/>
                <TextBlock Text="- Now: Select apps to REMOVE"
                           FontSize="13" 
                           FontWeight="SemiBold"
                           Foreground="#b91c1c"
                           Margin="0,0,0,10"/>
                <TextBlock Text="This change gives you more direct control over what gets removed from your system, and allows us to set recommended defaults for removal. It also lets us add more features to this script in the future."
                           FontSize="13" 
                           Foreground="#aab4c3"
                           TextWrapping="Wrap"/>
            </StackPanel>
        </Border>
        
        <StackPanel Grid.Row="2" 
                    Orientation="Horizontal" 
                    HorizontalAlignment="Right">
            <Button x:Name="BtnCancel" Content="Cancel" Width="100" Margin="0,0,12,0" IsCancel="True"/>
            <Button x:Name="BtnUnderstand" Content="I Understand, Continue" Width="195"/>
        </StackPanel>
    </Grid>
</Window>
"@

    $reader = New-Object System.Xml.XmlNodeReader $xaml
    $window = [Windows.Markup.XamlReader]::Load($reader)
    
    $btnUnderstand = $window.FindName("BtnUnderstand")
    $btnCancel = $window.FindName("BtnCancel")
    
    $script:dialogResult = $true
    
    $btnUnderstand.Add_Click({
        $script:dialogResult = $true
        $window.Close()
    })
    
    $btnCancel.Add_Click({
        $script:dialogResult = $false
        $window.Close()
    })
    
    $window.ShowDialog() | Out-Null
    return $script:dialogResult
}

function Show-AppSelectionDialog {
    # generate apps list with friendly names
    # apps are unchecked by default (meaning they won't be removed)
    # users check apps they want to remove
    $apps = @()
    foreach ($appDef in $appDefinitions) {
        $apps += @{ 
            Name      = $appDef.FriendlyName
            Package   = $appDef.Package
            IsChecked = $false
        }
    }
    
    # sort by friendly name for better UX
    $apps = $apps | Sort-Object { $_.Name }
    
    [xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="Sparkle Debloat v$version" 
    Height="750" Width="650" 
    WindowStartupLocation="CenterScreen"
    ResizeMode="NoResize"
    Background="#0c121f">
    <Window.Resources>
        <Style TargetType="CheckBox">
            <Setter Property="Foreground" Value="#f0f4f8"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="Padding" Value="8,5"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Style.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                    <Setter Property="Foreground" Value="#f0f4f8"/>
                </Trigger>
            </Style.Triggers>
        </Style>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#243144"/>
            <Setter Property="Foreground" Value="#f0f4f8"/>
            <Setter Property="BorderBrush" Value="#1f2a3d"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="16,8"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}" 
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="6"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#4f90e6"/>
                                <Setter Property="Foreground" Value="#ffffff"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter Property="Background" Value="#4f90e6"/>
                                <Setter Property="Foreground" Value="#ffffff"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
        <Style x:Key="SecondaryButton" TargetType="Button" BasedOn="{StaticResource {x:Type Button}}">
            <Setter Property="Background" Value="#131c2c"/>
        </Style>
    </Window.Resources>
    
    <Grid Margin="24">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>
        
        <TextBlock Grid.Row="0" 
                   Text="Select apps to remove" 
                   FontSize="18" 
                   FontWeight="SemiBold" 
                   Foreground="#f0f4f8"
                   Margin="0,0,0,6"/>
        
        <TextBlock Grid.Row="1" 
                   Text="Check the apps you want to remove. Unchecked apps will remain installed." 
                   FontSize="13" 
                   Foreground="#7e92a9"
                   TextWrapping="Wrap"
                   Margin="0,0,0,12"/>

        <Border Grid.Row="2" 
                Background="#131c2c" 
                BorderBrush="#1f2a3d" 
                BorderThickness="1" 
                CornerRadius="8"
                Margin="0,0,0,12">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
                <ItemsControl x:Name="AppsList" Margin="12">
                    <ItemsControl.ItemTemplate>
                        <DataTemplate>
                            <CheckBox Content="{Binding Name}" 
                                     IsChecked="{Binding IsChecked}" 
                                     Margin="4,3"/>
                        </DataTemplate>
                    </ItemsControl.ItemTemplate>
                </ItemsControl>
            </ScrollViewer>
        </Border>
        
        <StackPanel Grid.Row="3" 
                    Orientation="Horizontal" 
                    Margin="0,0,0,12">
            <Button x:Name="BtnSelectAll" 
                    Content="Select All" 
                    Width="110" 
                    Margin="0,0,12,0"
                    Style="{StaticResource SecondaryButton}"/>
            <Button x:Name="BtnDeselectAll" 
                    Content="Deselect All" 
                    Width="110"
                    Margin="0,0,12,0"
                    Style="{StaticResource SecondaryButton}"/>
            <Button x:Name="BtnSelectRecommended" 
                    Content="Select Recommended" 
                    Width="165"
                    Background="#243144"
                    Foreground="#f0f4f8"/>
        </StackPanel>
        
        <StackPanel Grid.Row="4" 
                    Orientation="Horizontal" 
                    HorizontalAlignment="Right">
            <Button x:Name="BtnOK" Content="Start Debloat" Width="120" Margin="0,0,12,0" IsDefault="True"/>
            <Button x:Name="BtnCancel" Content="Cancel" Width="100" IsCancel="True"/>
        </StackPanel>
    </Grid>
</Window>
"@

    $reader = New-Object System.Xml.XmlNodeReader $xaml
    $window = [Windows.Markup.XamlReader]::Load($reader)
    
    $appsList = $window.FindName("AppsList")
    $btnSelectAll = $window.FindName("BtnSelectAll")
    $btnDeselectAll = $window.FindName("BtnDeselectAll")
    $btnSelectRecommended = $window.FindName("BtnSelectRecommended")
    $btnOK = $window.FindName("BtnOK")
    $btnCancel = $window.FindName("BtnCancel")
    
    # create observable collection for data binding
    $observableApps = New-Object System.Collections.ObjectModel.ObservableCollection[Object]
    foreach ($app in $apps) {
        $observableApps.Add((New-Object PSObject -Property $app))
    }
    $appsList.ItemsSource = $observableApps
    
    $script:dialogResult = $null
    
    $btnSelectAll.Add_Click({
            foreach ($item in $observableApps) {
                $item.IsChecked = $true
            }
            $appsList.Items.Refresh()
        })
    
    $btnDeselectAll.Add_Click({
            foreach ($item in $observableApps) {
                $item.IsChecked = $false
            }
            $appsList.Items.Refresh()
        })
    
    $btnSelectRecommended.Add_Click({
            foreach ($item in $observableApps) {
                if ($recommendedApps -contains $item.Package) {
                    $item.IsChecked = $true
                }
            }
            $appsList.Items.Refresh()
        })
    
    $btnOK.Add_Click({
            $script:dialogResult = @()
            foreach ($item in $observableApps) {
                if ($item.IsChecked) {
                    $script:dialogResult += $item.Package
                }
            }
            $window.DialogResult = $true
            $window.Close()
        })
    
    $btnCancel.Add_Click({
            $script:dialogResult = $null
            $window.DialogResult = $false
            $window.Close()
        })
    
    $window.Add_Closing({
            if ($null -eq $script:dialogResult) {
                $script:dialogResult = $null
            }
        })
    
    $result = $window.ShowDialog()
    if ($result -eq $false) {
        return $null
    }
    return $script:dialogResult
}

function Remove-SelectedApps {
    param([string[]]$AppsToRemove)

    Write-Host "Starting Sparkle debloat..." -ForegroundColor Green

    # display friendly names in console output
    $removeNames = $AppsToRemove | ForEach-Object { Get-FriendlyName $_ }
    Write-Host "Apps that will be removed: $($removeNames -join ', ')" -ForegroundColor Yellow
    Write-Host "Number of apps to remove: $($AppsToRemove.Count)" -ForegroundColor Red
    
    foreach ($app in $AppsToRemove) {
        try {
            $friendlyName = Get-FriendlyName $app
            Write-Host "Checking for $friendlyName ($app)..." -ForegroundColor Yellow

            $pkg = Get-AppxPackage -Name *$app* -ErrorAction SilentlyContinue
            if ($pkg) {
                $pkg | ForEach-Object {
                    Write-Host "Removing Appx package $($_.Name)..." -ForegroundColor Yellow
                    Remove-AppxPackage -Package $_.PackageFullName -ErrorAction SilentlyContinue
                }
                Write-Host "Removed $friendlyName" -ForegroundColor Green
            }
            else {
                Write-Host "$friendlyName is not installed" -ForegroundColor Gray
            }

            $prov = Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like "*$app*"
            if ($prov) {
                $prov | ForEach-Object {
                    Write-Host "Removing provisioned package $($_.DisplayName)..." -ForegroundColor Yellow
                    Remove-AppxProvisionedPackage -Online -PackageName $_.PackageName -ErrorAction SilentlyContinue
                }
            }
        }
        catch {
            Write-Host "Could not remove $friendlyName : $_" -ForegroundColor Red
        }
    }

    Write-Host "Sparkle debloat completed!" -ForegroundColor Green
}

try {
    $script:appsWereRemoved = $false
    
    Write-Host "Starting Sparkle Debloat script..." -ForegroundColor Green
    Write-Host "Script Choice: '$ScriptChoice'" -ForegroundColor Yellow
    Write-Host "Apps to Remove Count: $($AppsToRemove.Count)" -ForegroundColor Yellow
    
    # get the ui params 
    if ($ScriptChoice -eq "raphire") {
        Write-Host "Running Raphire's Win11Debloat script..." -ForegroundColor Green
        & ([scriptblock]::Create((Invoke-RestMethod 'https://debloat.raphi.re/'))) -Silent -RemoveApps
        Write-Host "Raphire's script completed!" -ForegroundColor Green
        $script:appsWereRemoved = $true
    }
    elseif ($ScriptChoice -eq "custom") {
        if ($AppsToRemove.Count -gt 0) {
            Write-Host "Running Sparkle debloat to remove $($AppsToRemove.Count) apps..." -ForegroundColor Green
            Remove-SelectedApps -AppsToRemove $AppsToRemove
            $script:appsWereRemoved = $true
        }
        else {
            Write-Host "Custom debloat selected but no apps specified. Showing dialog..." -ForegroundColor Yellow
            $warningResult = Show-BehaviorChangeWarning
            if (-not $warningResult) {
                Write-Host "Operation cancelled by user." -ForegroundColor Yellow
                exit 0
            }
            $appsToRemove = Show-AppSelectionDialog
            
            if ($null -eq $appsToRemove -or $appsToRemove.Count -eq 0) {
                Write-Host "No apps selected for removal. Operation cancelled." -ForegroundColor Yellow
                exit 0
            }
            
            Remove-SelectedApps -AppsToRemove $appsToRemove
            $script:appsWereRemoved = $true
        }
    }
    elseif ($ScriptChoice -eq "" -or $null -eq $ScriptChoice) {
        Write-Host "No script choice provided, entering interactive mode..." -ForegroundColor Yellow
        
        try {
            $choice = Show-ScriptSelectionDialog
            
            if ($choice -eq "cancel") {
                Write-Host "Operation cancelled by user." -ForegroundColor Yellow
                exit 0
            }
            
            if ($choice -eq "raphire") {
                Write-Host "Running Raphire's Win11Debloat script..." -ForegroundColor Green
                & ([scriptblock]::Create((Invoke-RestMethod 'https://debloat.raphi.re/'))) -Silent -RemoveApps
                Write-Host "Debloat completed!" -ForegroundColor Green
                $script:appsWereRemoved = $true
            }
            elseif ($choice -eq "custom") {
                $warningResult = Show-BehaviorChangeWarning
                if (-not $warningResult) {
                    Write-Host "Operation cancelled by user." -ForegroundColor Yellow
                    exit 0
                }
                $appsToRemove = Show-AppSelectionDialog
                
                if ($null -eq $appsToRemove -or $appsToRemove.Count -eq 0) {
                    Write-Host "No apps selected for removal. Operation cancelled." -ForegroundColor Yellow
                    exit 0
                }
                
                Remove-SelectedApps -AppsToRemove $appsToRemove
                $script:appsWereRemoved = $true
            }
        }
        catch {
            Write-Host "Interactive mode failed, falling back to Raphire's script: $_" -ForegroundColor Yellow
            & ([scriptblock]::Create((Invoke-RestMethod 'https://debloat.raphi.re/'))) -Silent -RemoveApps
        }
    }
    else {
        Write-Host "Unknown script choice '$ScriptChoice', defaulting to Raphire's script..." -ForegroundColor Yellow
        & ([scriptblock]::Create((Invoke-RestMethod 'https://debloat.raphi.re/'))) -Silent -RemoveApps
    }
    Write-Host "Debloat Script From https://getsparkle.net" -ForegroundColor Cyan

    if ($script:appsWereRemoved -and -not (Get-Process -Name "Sparkle" -ErrorAction SilentlyContinue)) {
        [xml]$xaml = @"
<Window 
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="Sparkle Debloat" 
    Height="200" 
    Width="480"
    WindowStartupLocation="CenterScreen"
    Background="#0c121f"
    ResizeMode="NoResize">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#4f90e6"/>
            <Setter Property="Foreground" Value="#ffffff"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Padding" Value="24,10"/>
            <Setter Property="FontSize" Value="14"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}" 
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="6"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#4f90e6"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter Property="Background" Value="#4f90e6"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>
    
    <Grid Margin="30">
        <Grid.RowDefinitions>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>
        
        <StackPanel Grid.Row="0" VerticalAlignment="Center">
            <TextBlock Text="Debloat Complete" 
                      FontSize="20"
                      FontWeight="SemiBold"
                      Foreground="#3db58a"
                      HorizontalAlignment="Center"
                      Margin="0,0,0,10"/>
            <TextBlock Text="Your system has been successfully optimized." 
                      FontSize="14"
                      Foreground="#7e92a9"
                      HorizontalAlignment="Center"
                      TextAlignment="Center"
                      TextWrapping="Wrap"
                      Margin="0,0,0,5"/>
        </StackPanel>
                  
        <Button Grid.Row="1" 
               x:Name="BtnOK" 
               Content="Done" 
               Width="100"
               HorizontalAlignment="Center"/>
    </Grid>
</Window>
"@

        $reader = New-Object System.Xml.XmlNodeReader $xaml
        $window = [Windows.Markup.XamlReader]::Load($reader)
        
        $btnOK = $window.FindName("BtnOK")
        $btnOK.Add_Click({ $window.Close() })
        
        $window.ShowDialog() | Out-Null
    }

}
catch {
    Write-Host "Error during debloat process: $_" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
```



## Links
- [Debloat Windows Script (Raphire)](https://github.com/Raphire/Win11Debloat)
- [Use Sparkle Debloat Script without Sparkle](https://getsparkle.net/debloat)
- [Sparkle Debloat Script](https://github.com/Parcoil/Sparkle/blob/v2/resources/tweaks/debloat-windows/apply.ps1)
