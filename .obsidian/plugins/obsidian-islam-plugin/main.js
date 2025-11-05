const { Plugin, Setting, Modal, Notice, PluginSettingTab } = require('obsidian');

const DEFAULT_SETTINGS = {
	oldSalahPeriod: {
		days: 0,
		months: 0,
		years: 0
	},
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
			id: 'complete-salah',
			name: 'Complete Salah',
			callback: () => new CompleteSalahModal(this).open()
		});
		
		this.addCommand({
			id: 'manage-salahs',
			name: 'Manage Salahs (CRUD)',
			callback: () => new ManageSalahModal(this).open()
		});
		
		this.addCommand({
			id: 'show-dashboard',
			name: 'Show Salah Dashboard',
			callback: () => new DashboardModal(this).open()
		});
	}
	
	calculateOldSalahs() {
		const { days, months, years } = this.settings.oldSalahPeriod;
		const totalDays = days + (months * 30) + (years * 365);
		return {
			fajr: totalDays,
			dhuhr: totalDays,
			asr: totalDays,
			maghrib: totalDays,
			isha: totalDays
		};
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
		
		// Old Salahs Period Input
		containerEl.createEl('h4', { text: 'Old Salahs Time Period' });
		
		new Setting(containerEl)
			.setName('Days')
			.addText(text => {
				text.setPlaceholder('0')
					.setValue(this.plugin.settings.oldSalahPeriod.days.toString())
					.onChange(async (value) => {
						this.plugin.settings.oldSalahPeriod.days = parseInt(value) || 0;
						await this.plugin.saveSettings();
						this.display();
					});
				text.inputEl.type = 'number';
			});
		
		new Setting(containerEl)
			.setName('Months')
			.addText(text => {
				text.setPlaceholder('0')
					.setValue(this.plugin.settings.oldSalahPeriod.months.toString())
					.onChange(async (value) => {
						this.plugin.settings.oldSalahPeriod.months = parseInt(value) || 0;
						await this.plugin.saveSettings();
						this.display();
					});
				text.inputEl.type = 'number';
			});
		
		new Setting(containerEl)
			.setName('Years')
			.addText(text => {
				text.setPlaceholder('0')
					.setValue(this.plugin.settings.oldSalahPeriod.years.toString())
					.onChange(async (value) => {
						this.plugin.settings.oldSalahPeriod.years = parseInt(value) || 0;
						await this.plugin.saveSettings();
						this.display();
					});
				text.inputEl.type = 'number';
			});
		
		// Calculated Old Salahs (Read-only)
		containerEl.createEl('h4', { text: 'Calculated Old Salahs (Read-only)' });
		const calculatedOld = this.plugin.calculateOldSalahs();
		const salahTypes = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
		
		salahTypes.forEach(salah => {
			new Setting(containerEl)
				.setName(salah.charAt(0).toUpperCase() + salah.slice(1))
				.setDesc(`${calculatedOld[salah]} prayers`);
		});
		
		// Active Salahs
		containerEl.createEl('h4', { text: 'Active Salahs' });
		salahTypes.forEach(salah => {
			new Setting(containerEl)
				.setName(salah.charAt(0).toUpperCase() + salah.slice(1))
				.addText(text => {
					text.setPlaceholder('0')
						.setValue(this.plugin.settings.activeSalahs[salah].toString())
						.onChange(async (value) => {
							this.plugin.settings.activeSalahs[salah] = parseInt(value) || 0;
							await this.plugin.saveSettings();
						});
					text.inputEl.type = 'number';
				});
		});
		
		containerEl.createEl('h3', { text: 'Quran Settings' });
		containerEl.createEl('p', { text: 'Quran features will be available in future updates.' });
	}
}

class CompleteSalahModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Complete Salah' });
		
		const form = contentEl.createEl('form');
		
		const typeSelect = form.createEl('select');
		const oldOption = typeSelect.createEl('option');
		oldOption.value = 'old';
		oldOption.text = 'Old Salah';
		const activeOption = typeSelect.createEl('option');
		activeOption.value = 'active';
		activeOption.text = 'Active Salah';
		
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
		submitBtn.textContent = 'Complete';
		submitBtn.type = 'submit';
		
		form.onsubmit = async (e) => {
			e.preventDefault();
			const type = typeSelect.value;
			const salah = salahSelect.value;
			const count = parseInt(countInput.value) || 0;
			
			if (count > 0) {
				if (type === 'old') {
					const calculatedOld = this.plugin.calculateOldSalahs();
					if (calculatedOld[salah] >= count) {
						this.plugin.settings.oldSalahs[salah] += count;
						await this.plugin.saveSettings();
						new Notice(`Completed ${count} old ${salah} salah(s)`);
						this.close();
					} else {
						new Notice(`Only ${calculatedOld[salah]} old ${salah} salahs available`);
					}
				} else {
					if (this.plugin.settings.activeSalahs[salah] >= count) {
						this.plugin.settings.activeSalahs[salah] -= count;
						await this.plugin.saveSettings();
						new Notice(`Completed ${count} active ${salah} salah(s)`);
						this.close();
					} else {
						new Notice(`Only ${this.plugin.settings.activeSalahs[salah]} active ${salah} salahs available`);
					}
				}
			}
		};
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ManageSalahModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Manage Salahs (CRUD)' });
		
		const form = contentEl.createEl('form');
		
		const actionSelect = form.createEl('select');
		['add', 'remove', 'set'].forEach(action => {
			const option = actionSelect.createEl('option');
			option.value = action;
			option.text = action.charAt(0).toUpperCase() + action.slice(1);
		});
		
		const typeSelect = form.createEl('select');
		const activeOption = typeSelect.createEl('option');
		activeOption.value = 'active';
		activeOption.text = 'Active Salah';
		
		const salahSelect = form.createEl('select');
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const option = salahSelect.createEl('option');
			option.value = salah;
			option.text = salah.charAt(0).toUpperCase() + salah.slice(1);
		});
		
		const countInput = form.createEl('input');
		countInput.type = 'number';
		countInput.placeholder = 'Count';
		countInput.min = '0';
		
		const submitBtn = form.createEl('button');
		submitBtn.textContent = 'Execute';
		submitBtn.type = 'submit';
		
		form.onsubmit = async (e) => {
			e.preventDefault();
			const action = actionSelect.value;
			const salah = salahSelect.value;
			const count = parseInt(countInput.value) || 0;
			
			if (action === 'add') {
				this.plugin.settings.activeSalahs[salah] += count;
			} else if (action === 'remove') {
				this.plugin.settings.activeSalahs[salah] = Math.max(0, this.plugin.settings.activeSalahs[salah] - count);
			} else if (action === 'set') {
				this.plugin.settings.activeSalahs[salah] = count;
			}
			
			await this.plugin.saveSettings();
			new Notice(`${action.charAt(0).toUpperCase() + action.slice(1)} ${count} active ${salah} salah(s)`);
			this.close();
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
		
		const calculatedOld = this.plugin.calculateOldSalahs();
		const { activeSalahs, oldSalahs } = this.plugin.settings;
		
		contentEl.createEl('h3', { text: 'Old Salahs Status' });
		const oldTable = contentEl.createEl('table');
		oldTable.style.width = '100%';
		oldTable.style.borderCollapse = 'collapse';
		
		const oldHeader = oldTable.createEl('tr');
		oldHeader.createEl('th', { text: 'Prayer' }).style.border = '1px solid #ccc';
		oldHeader.createEl('th', { text: 'Total' }).style.border = '1px solid #ccc';
		oldHeader.createEl('th', { text: 'Completed' }).style.border = '1px solid #ccc';
		oldHeader.createEl('th', { text: 'Remaining' }).style.border = '1px solid #ccc';
		
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const row = oldTable.createEl('tr');
			const total = calculatedOld[salah];
			const completed = oldSalahs[salah];
			const remaining = Math.max(0, total - completed);
			
			row.createEl('td', { text: salah.charAt(0).toUpperCase() + salah.slice(1) }).style.border = '1px solid #ccc';
			row.createEl('td', { text: total.toString() }).style.border = '1px solid #ccc';
			row.createEl('td', { text: completed.toString() }).style.border = '1px solid #ccc';
			row.createEl('td', { text: remaining.toString() }).style.border = '1px solid #ccc';
		});
		
		contentEl.createEl('h3', { text: 'Active Salahs Status' });
		const activeTable = contentEl.createEl('table');
		activeTable.style.width = '100%';
		activeTable.style.borderCollapse = 'collapse';
		
		const activeHeader = activeTable.createEl('tr');
		activeHeader.createEl('th', { text: 'Prayer' }).style.border = '1px solid #ccc';
		activeHeader.createEl('th', { text: 'Remaining' }).style.border = '1px solid #ccc';
		
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const row = activeTable.createEl('tr');
			row.createEl('td', { text: salah.charAt(0).toUpperCase() + salah.slice(1) }).style.border = '1px solid #ccc';
			row.createEl('td', { text: activeSalahs[salah].toString() }).style.border = '1px solid #ccc';
		});
		
		const totalOldRemaining = Object.keys(calculatedOld).reduce((sum, salah) => 
			sum + Math.max(0, calculatedOld[salah] - oldSalahs[salah]), 0);
		const totalActiveRemaining = Object.values(activeSalahs).reduce((sum, count) => sum + count, 0);
		
		contentEl.createEl('h3', { text: 'Summary' });
		contentEl.createEl('p', { text: `Total Old Salahs Remaining: ${totalOldRemaining}` });
		contentEl.createEl('p', { text: `Total Active Salahs Remaining: ${totalActiveRemaining}` });
		contentEl.createEl('p', { text: `Grand Total Remaining: ${totalOldRemaining + totalActiveRemaining}` });
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

module.exports = IslamPlugin;