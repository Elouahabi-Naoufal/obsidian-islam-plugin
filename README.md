# Islam Practice Tracker

Track Salah (prayer) debts and Islamic practices inside Obsidian. Record missed prayers, calculate catch-up obligations by time period, and monitor your progress through a dedicated dashboard.

## Features

### Salah Tracking
- Track missed historical Salahs (old prayers).
- Track active Salahs (recently missed prayers).
- Calculate old Salahs by time period (days, months, years).
- Individual or multiple prayer tracking.
- Full CRUD operations for all Salah data.

### Commands
- **Add Old Salah**: Add historical missed prayers.
- **Add Active Salah**: Add recently missed prayers.
- **Show Salah Dashboard**: View complete prayer status.
- **Calculate Old Salahs by Time Period**: Bulk add based on time periods.

### Dashboard
- Complete overview of pending prayers.
- Separate sections for old and active Salahs.
- Summary statistics.
- Tabular display of all prayer counts.

### Settings
- **Salah Tab**: Configure old and active Salah counts.
- **Quran Tab**: Reserved for future features.

## Usage

1. Install the plugin in your Obsidian vault.
2. Configure initial Salah counts in Settings > Islam Practice Tracker.
3. Use commands to add and update missed prayers.
4. View the dashboard for a complete status overview.

## Data Storage

All data is stored in JSON format within Obsidian's plugin data system.

## Future Features

- Quran reading tracker.
- Prayer time notifications.
- Progress analytics.
- Export and import functionality.

## Installation

### From the Community Plugins directory
1. Open Obsidian Settings.
2. Go to Community Plugins and disable Safe Mode if needed.
3. Click Browse and search for "Islam Practice Tracker".
4. Click Install, then Enable.

### Manual installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Create a folder named `islam-practice-tracker` inside `.obsidian/plugins/`.
3. Copy the downloaded files into that folder.
4. Reload Obsidian and enable the plugin in Settings > Community Plugins.

## License

MIT License. See [LICENSE](LICENSE) for details.
