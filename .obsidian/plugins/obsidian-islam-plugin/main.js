const { Plugin, Setting, Modal, Notice, PluginSettingTab } = require('obsidian');

const DEFAULT_SETTINGS = {
	oldSalahs: {
		fajr: 0,
		dhuhr: 0,
		asr: 0,
		maghrib: 0,
		isha: 0
	},
	activeSalahs: {
		fajr: 0,
		dhuhr: 0,
		asr: 0,
		maghrib: 0,
		isha: 0
	}
};

class IslamPlugin extends Plugin {
	async onload() {
		await this.loadSettings();
		
		this.addSettingTab(new IslamSettingTab(this.app, this));
		
		this.addCommand({
			id: 'add-old-salah',
			name: 'Add Old Salah',
			callback: () => new SalahModal(this, 'old').open()
		});
		
		this.addCommand({
			id: 'add-active-salah',
			name: 'Add Active Salah',
			callback: () => new SalahModal(this, 'active').open()
		});
		
		this.addCommand({
			id: 'show-dashboard',
			name: 'Show Salah Dashboard',
			callback: () => new DashboardModal(this).open()
		});
		
		this.addCommand({
			id: 'calculate-old-salahs',
			name: 'Calculate Old Salahs by Time Period',
			callback: () => new CalculateModal(this).open()
		});
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class IslamSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	
	display() {
		const { containerEl } = this;
		containerEl.empty();
		
		containerEl.createEl('h2', { text: 'Islam Plugin Settings' });
		
		containerEl.createEl('h3', { text: 'Salah Settings' });
		
		const salahTypes = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
		
		containerEl.createEl('h4', { text: 'Old Salahs' });
		salahTypes.forEach(salah => {
			new Setting(containerEl)
				.setName(salah.charAt(0).toUpperCase() + salah.slice(1))
				.addText(text => text
					.setPlaceholder('0')
					.setValue(this.plugin.settings.oldSalahs[salah].toString())
					.onChange(async (value) => {
						this.plugin.settings.oldSalahs[salah] = parseInt(value) || 0;
						await this.plugin.saveSettings();
					}));
		});
		
		containerEl.createEl('h4', { text: 'Active Salahs' });
		salahTypes.forEach(salah => {
			new Setting(containerEl)
				.setName(salah.charAt(0).toUpperCase() + salah.slice(1))
				.addText(text => text
					.setPlaceholder('0')
					.setValue(this.plugin.settings.activeSalahs[salah].toString())
					.onChange(async (value) => {
						this.plugin.settings.activeSalahs[salah] = parseInt(value) || 0;
						await this.plugin.saveSettings();
					}));
		});
		
		containerEl.createEl('h3', { text: 'Quran Settings' });
		containerEl.createEl('p', { text: 'Quran features will be available in future updates.' });
	}
}

class SalahModal extends Modal {
	constructor(plugin, type) {
		super(plugin.app);
		this.plugin = plugin;
		this.type = type;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: `Add ${this.type.charAt(0).toUpperCase() + this.type.slice(1)} Salah` });
		
		const form = contentEl.createEl('form');
		
		const salahSelect = form.createEl('select');
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const option = salahSelect.createEl('option');
			option.value = salah;
			option.text = salah.charAt(0).toUpperCase() + salah.slice(1);
		});
		
		const countInput = form.createEl('input');
		countInput.type = 'number';
		countInput.placeholder = 'Count';
		countInput.min = '1';
		
		const submitBtn = form.createEl('button');
		submitBtn.textContent = 'Add';
		submitBtn.type = 'submit';
		
		form.onsubmit = async (e) => {
			e.preventDefault();
			const salah = salahSelect.value;
			const count = parseInt(countInput.value) || 0;
			
			if (count > 0) {
				this.plugin.settings[`${this.type}Salahs`][salah] += count;
				await this.plugin.saveSettings();
				new Notice(`Added ${count} ${salah} ${this.type} salah(s)`);
				this.close();
			}
		};
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class CalculateModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Calculate Old Salahs by Time Period' });
		
		const form = contentEl.createEl('form');
		
		const daysInput = form.createEl('input');
		daysInput.type = 'number';
		daysInput.placeholder = 'Days';
		daysInput.min = '0';
		
		const monthsInput = form.createEl('input');
		monthsInput.type = 'number';
		monthsInput.placeholder = 'Months';
		monthsInput.min = '0';
		
		const yearsInput = form.createEl('input');
		yearsInput.type = 'number';
		yearsInput.placeholder = 'Years';
		yearsInput.min = '0';
		
		const submitBtn = form.createEl('button');
		submitBtn.textContent = 'Calculate & Add';
		submitBtn.type = 'submit';
		
		form.onsubmit = async (e) => {
			e.preventDefault();
			const days = parseInt(daysInput.value) || 0;
			const months = parseInt(monthsInput.value) || 0;
			const years = parseInt(yearsInput.value) || 0;
			
			const totalDays = days + (months * 30) + (years * 365);
			
			if (totalDays > 0) {
				['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
					this.plugin.settings.oldSalahs[salah] += totalDays;
				});
				await this.plugin.saveSettings();
				new Notice(`Added ${totalDays * 5} old salahs (${totalDays} days)`);
				this.close();
			}
		};
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class DashboardModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Salah Dashboard' });
		
		const { oldSalahs, activeSalahs } = this.plugin.settings;
		
		contentEl.createEl('h3', { text: 'Old Salahs (Pending)' });
		const oldTable = contentEl.createEl('table');
		oldTable.style.width = '100%';
		oldTable.style.borderCollapse = 'collapse';
		
		const oldHeader = oldTable.createEl('tr');
		oldHeader.createEl('th', { text: 'Prayer' }).style.border = '1px solid #ccc';
		oldHeader.createEl('th', { text: 'Count' }).style.border = '1px solid #ccc';
		
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const row = oldTable.createEl('tr');
			const nameCell = row.createEl('td', { text: salah.charAt(0).toUpperCase() + salah.slice(1) });
			const countCell = row.createEl('td', { text: oldSalahs[salah].toString() });
			nameCell.style.border = '1px solid #ccc';
			countCell.style.border = '1px solid #ccc';
		});
		
		contentEl.createEl('h3', { text: 'Active Salahs (Recent Missed)' });
		const activeTable = contentEl.createEl('table');
		activeTable.style.width = '100%';
		activeTable.style.borderCollapse = 'collapse';
		
		const activeHeader = activeTable.createEl('tr');
		activeHeader.createEl('th', { text: 'Prayer' }).style.border = '1px solid #ccc';
		activeHeader.createEl('th', { text: 'Count' }).style.border = '1px solid #ccc';
		
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const row = activeTable.createEl('tr');
			const nameCell = row.createEl('td', { text: salah.charAt(0).toUpperCase() + salah.slice(1) });
			const countCell = row.createEl('td', { text: activeSalahs[salah].toString() });
			nameCell.style.border = '1px solid #ccc';
			countCell.style.border = '1px solid #ccc';
		});
		
		const totalOld = Object.values(oldSalahs).reduce((sum, count) => sum + count, 0);
		const totalActive = Object.values(activeSalahs).reduce((sum, count) => sum + count, 0);
		
		contentEl.createEl('h3', { text: 'Summary' });
		contentEl.createEl('p', { text: `Total Old Salahs: ${totalOld}` });
		contentEl.createEl('p', { text: `Total Active Salahs: ${totalActive}` });
		contentEl.createEl('p', { text: `Grand Total: ${totalOld + totalActive}` });
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

module.exports = IslamPlugin;