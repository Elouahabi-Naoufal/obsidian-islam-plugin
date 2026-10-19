<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT TITLE BLOCK -->
<br />
<div align="center">
  <a href="https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin">
    <h3 align="center">Islam Practice Tracker</h3>
  </a>

  <p align="center">
    An Obsidian plugin for tracking missed and active Salahs, Quran reading, and daily progress.
    <br />
    <a href="https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin"><strong>Explore the source »</strong></a>
    <br />
    <br />
    <a href="https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin/issues">Report Bug</a>
    &middot;
    <a href="https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

Islam Practice Tracker keeps two related logs inside your vault: missed prayers (Salah) and Quran
reading. It is a local plugin — all data lives in Obsidian's plugin data, with no network requests and no
account.

### Salah tracking

Salah is split into two buckets:

* **Old Salahs** — a historical backlog. You set a period in days, months and years; the plugin converts
  it with `days + months × 30 + years × 365` and applies the resulting day count to each of the five
  prayers. This is a simple estimate, not a prayer-time or lunar-calendar calculation.
* **Active Salahs** — recent missed prayers, stored as a count per prayer.

You can add, edit, reduce, complete or reset counts for individual prayers or for all five at once.
Completed prayers are recorded in a progress history that can be viewed from the command palette.

### Quran tracking

Reading is measured in **tumun** (plural of thumn, one eighth of a Juz). The plugin assumes a full Quran
is 480 tumun, which matches its own unit table:

| Unit | Equivalent |
|------|------------|
| 1 Juz | 2 Hizb = 8 Rubu = 16 Tumun |
| 1 Hizb | 4 Rubu = 8 Tumun |
| 1 Rubu | 2 Tumun |

Reading sessions record an amount and an optional note. The Quran dashboard shows total progress, Juz,
Hizb and Rubu completed, and the list of completed Khatms. Starting a new Khatm after completing one is
handled by the plugin.

### Prayer times

**View Prayer Times** shows fixed, approximate times (05:00, 12:00, 15:30, 18:00 and 19:30) for today and
marks each as passed, soon or upcoming. It does **not** calculate astronomical prayer times from your
location, and the modal says so. Verify times with your local mosque or calendar.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![Obsidian][Obsidian.com]][Obsidian-url]
* [![JavaScript][JavaScript.com]][JavaScript-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

* Obsidian 0.15.0 or newer — the `minAppVersion` declared in `manifest.json`.
* No build step. `main.js`, `manifest.json` and `styles.css` are shipped as-is.

### Installation

**From a release**

1. Download `main.js`, `manifest.json` and `styles.css` from the latest GitHub release.
2. Create `<vault>/.obsidian/plugins/islam-practice-tracker/`.
3. Copy the three files into that folder.
4. Reload Obsidian, then enable **Islam Practice Tracker** under **Settings → Community plugins**.

**From source**

```sh
git clone https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin.git
cd obsidian-islam-plugin
```

Copy `main.js`, `manifest.json` and `styles.css` into the plugin folder and reload Obsidian. `src/main.js`
and `main.js` are currently identical.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

### Commands

| Command | Purpose |
|---------|---------|
| Complete Salahs | Select prayers and mark a number as completed |
| Add/Edit Active Salahs | Change the active count for each prayer |
| Delete/Reset Salahs | Reset one prayer, all old Salahs, all active Salahs, or everything |
| View Salah Dashboard | Overview of old and active counts with totals |
| View Progress History | Completed-prayer history |
| View Prayer Times | Approximate fixed times for today |
| Add Quran Reading | Record a reading amount in tumun |
| View Quran Dashboard | Total progress and unit breakdown |
| Edit Quran Readings | Edit or delete individual reading sessions |
| View Quran Completions | List completed Khatms and their sessions |

### Settings

The settings tab has two pages:

* **Salah** — the old-Salah period (days/months/years), the calculated old counts (read-only), and the
  active count for each prayer.
* **Quran** — read-only progress summary and the unit reference table.

### First run

1. Open **Settings → Islam Practice Tracker → Salah** and enter your backlog period.
2. Enter the active counts you want to track.
3. Open the command palette and run **View Salah Dashboard** to confirm the numbers.
4. For Quran reading, run **Add Quran Reading** and enter an amount such as `1` (Juz) or `1/8` (one
   thumn), depending on the units you want to record.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

Working today:

- [x] Old-Salah backlog calculation from a days/months/years period
- [x] Active Salah counts with add, edit, complete, reduce and reset flows
- [x] Salah dashboard and progress history
- [x] Approximate daily prayer-time display with passed/soon/upcoming status
- [x] Quran reading sessions measured in tumun
- [x] Quran dashboard with Juz/Hizb/Rubu breakdown and Khatm completions
- [x] Editing and deleting Quran reading sessions
- [x] Settings tab with Salah and Quran pages

Open items:

- [ ] Prayer times are fixed constants, not location-aware calculations
- [ ] The old-Salah conversion uses 30-day months and 365-day years, so it is approximate
- [ ] No import/export of the plugin data
- [ ] No automated tests
- [ ] No notifications or reminder scheduling

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create.
Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You
can also simply open an issue with the tag "enhancement". Don't forget to give the project a star!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Test in a throwaway vault: copy the three plugin files into `.obsidian/plugins/islam-practice-tracker/`,
reload, and check both the Salah and Quran flows. The data schema is stored in `data.json`, so a schema
change needs a migration path for existing users.

### Top contributors:

<a href="https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Elouahabi-Naoufal/obsidian-islam-plugin" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Naoufal Elouahabi - [LinkedIn](https://www.linkedin.com/in/elouahabi-naoufal/) - elouahabi-naoufal1@gmail.com

Project Link: [https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin](https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Obsidian](https://obsidian.md/) and the [Obsidian sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
* [Img Shields](https://shields.io)
* [Choose an Open Source License](https://choosealicense.com)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/Elouahabi-Naoufal/obsidian-islam-plugin.svg?style=for-the-badge
[contributors-url]: https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Elouahabi-Naoufal/obsidian-islam-plugin.svg?style=for-the-badge
[forks-url]: https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin/network/members
[stars-shield]: https://img.shields.io/github/stars/Elouahabi-Naoufal/obsidian-islam-plugin.svg?style=for-the-badge
[stars-url]: https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin/stargazers
[issues-shield]: https://img.shields.io/github/issues/Elouahabi-Naoufal/obsidian-islam-plugin.svg?style=for-the-badge
[issues-url]: https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin/issues
[license-shield]: https://img.shields.io/github/license/Elouahabi-Naoufal/obsidian-islam-plugin.svg?style=for-the-badge
[license-url]: https://github.com/Elouahabi-Naoufal/obsidian-islam-plugin/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/elouahabi-naoufal/
[Obsidian.com]: https://img.shields.io/badge/Obsidian-7C3AED?style=for-the-badge&logo=obsidian&logoColor=white
[Obsidian-url]: https://obsidian.md/
[JavaScript.com]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JavaScript-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript
