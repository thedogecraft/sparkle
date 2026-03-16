<div align="center">
  <a href="https://github.com/Parcoil/Sparkle">
    <img src="./resources/sparklelogo.png" alt="Sparkle Logo" width="80" height="80">
  </a>

  <h3>Sparkle</h3>
  <p>A Windows app to debloat and optimize your PC</p>

  <p>
    <img alt="React" src="https://img.shields.io/badge/React-000000?style=for-the-badge&logo=react&labelColor=0c121f&color=0c121f">
    <img alt="Electron" src="https://img.shields.io/badge/Electron-000000?style=for-the-badge&logo=electron&labelColor=0c121f&color=0c121f">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-000000?style=for-the-badge&logo=typescript&labelColor=0c121f&color=0c121f">
    <img alt="PowerShell" src="https://img.shields.io/badge/PowerShell-000000?style=for-the-badge&logo=gnometerminal&labelColor=0c121f&color=0c121f">
  </p>

Install with Powershell:

```powershell
irm https://raw.githubusercontent.com/Parcoil/Sparkle/v2/get.ps1 | iex
```

<a href="https://github.com/Parcoil/Sparkle/releases/latest">Download Installer/Portable</a>
<a href="https://sourceforge.net/projects/sparkle-debloater">Download From Sourceforge</a>

  <br/>
  <br/>

  <img src="./images/appshowcase.png" alt="Sparkle App Screenshot" width="90%">

</div>
  
  > [!WARNING]
  > Sparkle is currently in beta. While we've tested it extensively, you may encounter some bugs. Please back up your system before applying tweaks and report any issues you find.

<div align="center">
  <h3>🚀 Features</h3>

  <ul align="left">
    <li>📈 Apply Tweaks to Optimize your system</li>
    <li>🗑️ Manage All Temp files in one place</li>
    <li>🎛️ Install apps with the built-in Winget integration</li>
    <li>📁 Backup and Revert changes</li>
  </ul>
</div>

<div>
  <h2>📃 Docs</h2>
  <p>You can find the docs <a href="https://docs.getsparkle.net">here</a></p>
  the docs cover all the tweaks how they work what they do and all of sparkles pages
</div>

<div>
  <h3>💖 Credits</h3>
  <ul>
    <li>
      <a href="https://github.com/ChrisTitusTech/winutil">CTT's WinUtil (Some of the tweaks & part of the inspo for making this v2 of this project)</a>
    </li>
    <li>
      <a href="https://github.com/Raphire/Win11Debloat">Raphire Win11Debloat ( Debloat script offered in Sparkle debloat script)</a>
    </li>
  </ul>

  <h3>👥 Contributing</h3>

  <h4>Adding New Tweaks</h4>
  <ul>
    <li>Tweaks are located in <code>/tweaks</code></li>
  </ul>

Refer to the <a href="https://docs.getsparkle.net">docs</a> for more info on how to add new tweaks

  <h4>Other Ways to Contribute</h4>
  <ul>
    <li>🐛 Report bugs and issues</li>
    <li>💡 Suggest new features or improvements</li>
    <li>📝 Improve documentation</li>
    <li>🎨 Enhance the UI/UX</li>
    <li>🧪 Improve code quality</li>
  </ul>

<h4>🛠️ Building Sparkle</h4>

<p>To build sparkle you will need the following</p>
<ul>
  <li><b>Node.js</b> v22 or higher</li>
  <li><b>Windows 10/11</b></li>
</ul>

<details>
  <summary><h2>🤧 What if I’m allergic to Electron?</h2></summary>

That’s totally fine, this project probably isn’t for you.  
 You might want to check out [CTT WinUtil](https://github.com/ChrisTitusTech/winutil),  
 A PowerShell based alternative that keeps things nice and lightweight.

this message is inspired by [this](https://github.com/nukeop/nuclear/blob/master/docs/electron.md)

</details>

---

</div>

> [!IMPORTANT]
> The version of sparkle in the repo is most likely newer than the latest release. expect bugs and unreleased features

<ol>
  <li>
    <b>Clone the repository:</b>
    <pre><code>git clone https://github.com/Parcoil/Sparkle
cd Sparkle</code></pre>
  </li>
  <li>
    <b>Install dependencies:</b>
    <pre><code>npm i</code></pre>
  </li>
  <li>
    <b>Start the app in development mode:</b>
    <pre><code>npm run dev</code></pre>
    <i>This will launch Sparkle with hot reload for both the Electron main and renderer processes.</i>
  </li>
  <br/>
  <li>
    <b>Build for production:</b>
    <pre><code>npm build</code></pre>
    <i>This will generate optimized production builds.</i>
  </li>
</ol>
 <br/>
  <p align="center">Made with ❤️ by Parcoil</p>

## Star History

<a href="https://www.star-history.com/#Parcoil/Sparkle&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Parcoil/Sparkle&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Parcoil/Sparkle&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Parcoil/Sparkle&type=Date" />
 </picture>
</a>
