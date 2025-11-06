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
	
	createCircularProgress(container, salah, completed, total, type) {
		const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
		const remaining = Math.max(0, total - completed);
		
		const card = container.createEl('div');
		card.style.cssText = `
			background: var(--background-secondary);
			border-radius: 12px;
			padding: 20px;
			text-align: center;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
			border: 1px solid var(--background-modifier-border);
			transition: transform 0.2s ease;
			min-width: 150px;
		`;
		
		const circle = card.createEl('div');
		circle.style.cssText = `
			position: relative;
			display: inline-block;
			margin-bottom: 15px;
			width: 120px;
			height: 120px;
			border-radius: 50%;
			background: conic-gradient(
				${percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444'} ${percentage * 3.6}deg,
				#333 ${percentage * 3.6}deg
			);
			padding: 10px;
		`;
		
		const innerCircle = circle.createEl('div');
		innerCircle.style.cssText = `
			width: 100px;
			height: 100px;
			border-radius: 50%;
			background: var(--background-secondary);
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
		`;
		
		const centerText = innerCircle.createEl('div');
		centerText.style.cssText = `
			text-align: center;
		`;
		
		const percentageEl = centerText.createEl('div', { text: `${percentage}%` });
		percentageEl.style.cssText = `
			font-size: 16px;
			font-weight: bold;
			color: var(--text-accent);
			line-height: 1;
		`;
		
		const fractionEl = centerText.createEl('div', { text: `${completed}/${total}` });
		fractionEl.style.cssText = `
			font-size: 10px;
			color: var(--text-muted);
			margin-top: 2px;
		`;
		
		const nameEl = card.createEl('h4', { text: salah.charAt(0).toUpperCase() + salah.slice(1) });
		nameEl.style.cssText = `
			font-size: 16px;
			font-weight: 600;
			margin: 0 0 8px 0;
			color: var(--text-normal);
		`;
		
		const remainingEl = card.createEl('p', { text: `${remaining} remaining` });
		remainingEl.style.cssText = `
			font-size: 14px;
			color: var(--text-muted);
			margin: 0 0 8px 0;
		`;
		
		const typeEl = card.createEl('span', { text: type });
		typeEl.style.cssText = `
			display: inline-block;
			padding: 4px 8px;
			border-radius: 12px;
			font-size: 11px;
			font-weight: 500;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			background: ${type === 'Old' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)'};
			color: ${type === 'Old' ? '#3b82f6' : '#a855f7'};
		`;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.style.cssText = `
			padding: 20px;
			max-width: 800px;
		`;
		
		const title = contentEl.createEl('h2', { text: 'Salah Dashboard' });
		title.style.cssText = `
			text-align: center;
			margin-bottom: 30px;
			color: var(--text-accent);
			font-size: 28px;
			font-weight: 600;
		`;
		
		const calculatedOld = this.plugin.calculateOldSalahs();
		const { activeSalahs, oldSalahs } = this.plugin.settings;
		
		const oldTitle = contentEl.createEl('h3', { text: 'Old Salahs Progress' });
		oldTitle.style.cssText = `
			margin: 25px 0 15px 0;
			color: var(--text-normal);
			font-size: 20px;
			font-weight: 500;
			border-bottom: 2px solid var(--background-modifier-border);
			padding-bottom: 8px;
		`;
		
		const oldGrid = contentEl.createEl('div');
		oldGrid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 20px;
			margin-bottom: 30px;
		`;
		
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const total = calculatedOld[salah];
			const completed = oldSalahs[salah];
			this.createCircularProgress(oldGrid, salah, completed, total, 'Old');
		});
		
		const activeTitle = contentEl.createEl('h3', { text: 'Active Salahs Status' });
		activeTitle.style.cssText = `
			margin: 25px 0 15px 0;
			color: var(--text-normal);
			font-size: 20px;
			font-weight: 500;
			border-bottom: 2px solid var(--background-modifier-border);
			padding-bottom: 8px;
		`;
		
		const activeGrid = contentEl.createEl('div');
		activeGrid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 20px;
			margin-bottom: 30px;
		`;
		
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const remaining = activeSalahs[salah];
			this.createCircularProgress(activeGrid, salah, 0, remaining, 'Active');
		});
		
		const totalOldRemaining = Object.keys(calculatedOld).reduce((sum, salah) => 
			sum + Math.max(0, calculatedOld[salah] - oldSalahs[salah]), 0);
		const totalActiveRemaining = Object.values(activeSalahs).reduce((sum, count) => sum + count, 0);
		
		const summary = contentEl.createEl('div');
		summary.style.cssText = `margin-top: 40px;`;
		
		const summaryTitle = summary.createEl('h3', { text: 'Summary' });
		summaryTitle.style.cssText = `
			margin: 25px 0 15px 0;
			color: var(--text-normal);
			font-size: 20px;
			font-weight: 500;
			border-bottom: 2px solid var(--background-modifier-border);
			padding-bottom: 8px;
		`;
		
		const summaryGrid = summary.createEl('div');
		summaryGrid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 15px;
		`;
		
		const oldSummary = summaryGrid.createEl('div');
		oldSummary.style.cssText = `
			background: var(--background-secondary);
			border-radius: 10px;
			padding: 20px;
			text-align: center;
			border: 1px solid var(--background-modifier-border);
			border-left: 4px solid #3b82f6;
		`;
		const oldNumber = oldSummary.createEl('div', { text: totalOldRemaining.toString() });
		oldNumber.style.cssText = `font-size: 32px; font-weight: bold; color: var(--text-accent);`;
		const oldLabel = oldSummary.createEl('div', { text: 'Old Salahs Remaining' });
		oldLabel.style.cssText = `font-size: 14px; color: var(--text-muted); margin-top: 8px;`;
		
		const activeSummary = summaryGrid.createEl('div');
		activeSummary.style.cssText = `
			background: var(--background-secondary);
			border-radius: 10px;
			padding: 20px;
			text-align: center;
			border: 1px solid var(--background-modifier-border);
			border-left: 4px solid #a855f7;
		`;
		const activeNumber = activeSummary.createEl('div', { text: totalActiveRemaining.toString() });
		activeNumber.style.cssText = `font-size: 32px; font-weight: bold; color: var(--text-accent);`;
		const activeLabel = activeSummary.createEl('div', { text: 'Active Salahs Remaining' });
		activeLabel.style.cssText = `font-size: 14px; color: var(--text-muted); margin-top: 8px;`;
		
		const totalSummary = summaryGrid.createEl('div');
		totalSummary.style.cssText = `
			background: var(--background-secondary);
			border-radius: 10px;
			padding: 20px;
			text-align: center;
			border: 1px solid var(--background-modifier-border);
			border-left: 4px solid #f59e0b;
		`;
		const totalNumber = totalSummary.createEl('div', { text: (totalOldRemaining + totalActiveRemaining).toString() });
		totalNumber.style.cssText = `font-size: 32px; font-weight: bold; color: var(--text-accent);`;
		const totalLabel = totalSummary.createEl('div', { text: 'Total Remaining' });
		totalLabel.style.cssText = `font-size: 14px; color: var(--text-muted); margin-top: 8px;`;
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

module.exports = IslamPlugin;