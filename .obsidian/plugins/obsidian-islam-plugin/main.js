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
	},
	progressHistory: []
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
		
		this.addCommand({
			id: 'reset-salahs',
			name: 'Delete/Reset Salahs',
			callback: () => new ResetModal(this).open()
		});
		
		this.addCommand({
			id: 'bulk-complete',
			name: 'Bulk Complete Salahs',
			callback: () => new BulkCompleteModal(this).open()
		});
		
		this.addCommand({
			id: 'prayer-times',
			name: 'Show Prayer Times',
			callback: () => new PrayerTimesModal(this).open()
		});
		
		this.addCommand({
			id: 'progress-history',
			name: 'Show Progress History',
			callback: () => new ProgressHistoryModal(this).open()
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
	
	trackProgress(action, salah, count, type) {
		const entry = {
			date: new Date().toISOString(),
			action,
			salah,
			count,
			type
		};
		this.settings.progressHistory.push(entry);
		
		// Keep only last 100 entries
		if (this.settings.progressHistory.length > 100) {
			this.settings.progressHistory = this.settings.progressHistory.slice(-100);
		}
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
						this.plugin.trackProgress('completed', salah, count, 'old');
						await this.plugin.saveSettings();
						new Notice(`Completed ${count} old ${salah} salah(s)`);
						this.close();
					} else {
						new Notice(`Only ${calculatedOld[salah]} old ${salah} salahs available`);
					}
				} else {
					if (this.plugin.settings.activeSalahs[salah] >= count) {
						this.plugin.settings.activeSalahs[salah] -= count;
						this.plugin.trackProgress('completed', salah, count, 'active');
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

class ProgressHistoryModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.style.cssText = 'padding: 20px; max-width: 600px;';
		
		const title = contentEl.createEl('h2', { text: 'Progress History' });
		title.style.cssText = 'text-align: center; margin-bottom: 20px; color: var(--text-accent);';
		
		const history = this.plugin.settings.progressHistory.slice(-20).reverse(); // Last 20 entries
		
		if (history.length === 0) {
			contentEl.createEl('p', { text: 'No progress history yet. Complete some salahs to see your progress!' });
			return;
		}
		
		const historyContainer = contentEl.createEl('div');
		historyContainer.style.cssText = 'display: grid; gap: 10px; max-height: 400px; overflow-y: auto;';
		
		history.forEach(entry => {
			const card = historyContainer.createEl('div');
			card.style.cssText = `
				background: var(--background-secondary);
				border-radius: 6px;
				padding: 12px;
				border-left: 3px solid ${entry.action === 'completed' ? '#22c55e' : '#3b82f6'};
				display: flex;
				justify-content: space-between;
				align-items: center;
			`;
			
			const actionEl = card.createEl('div');
			actionEl.style.cssText = 'font-weight: 500; color: var(--text-normal);';
			actionEl.textContent = `${entry.action.charAt(0).toUpperCase() + entry.action.slice(1)} ${entry.count} ${entry.salah} (${entry.type})`;
			
			const dateEl = card.createEl('div');
			dateEl.style.cssText = 'font-size: 12px; color: var(--text-muted);';
			dateEl.textContent = new Date(entry.date).toLocaleString();
		});
		
		// Statistics
		const statsTitle = contentEl.createEl('h3', { text: 'Statistics' });
		statsTitle.style.cssText = 'margin-top: 20px; margin-bottom: 10px; color: var(--text-normal);';
		
		const completedToday = history.filter(entry => {
			const entryDate = new Date(entry.date);
			const today = new Date();
			return entryDate.toDateString() === today.toDateString() && entry.action === 'completed';
		}).reduce((sum, entry) => sum + entry.count, 0);
		
		const totalCompleted = history.filter(entry => entry.action === 'completed')
			.reduce((sum, entry) => sum + entry.count, 0);
		
		const statsContainer = contentEl.createEl('div');
		statsContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px;';
		
		const todayCard = statsContainer.createEl('div');
		todayCard.style.cssText = `
			background: var(--background-secondary);
			border-radius: 6px;
			padding: 15px;
			text-align: center;
			border-left: 3px solid #22c55e;
		`;
		todayCard.createEl('div', { text: completedToday.toString() }).style.cssText = 'font-size: 24px; font-weight: bold; color: var(--text-accent);';
		todayCard.createEl('div', { text: 'Completed Today' }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
		
		const totalCard = statsContainer.createEl('div');
		totalCard.style.cssText = `
			background: var(--background-secondary);
			border-radius: 6px;
			padding: 15px;
			text-align: center;
			border-left: 3px solid #3b82f6;
		`;
		totalCard.createEl('div', { text: totalCompleted.toString() }).style.cssText = 'font-size: 24px; font-weight: bold; color: var(--text-accent);';
		totalCard.createEl('div', { text: 'Total Completed' }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class PrayerTimesModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	calculatePrayerTimes() {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		
		// Basic prayer times (simplified calculation)
		return {
			fajr: new Date(today.getTime() + 5 * 60 * 60 * 1000), // 5:00 AM
			dhuhr: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM
			asr: new Date(today.getTime() + 15.5 * 60 * 60 * 1000), // 3:30 PM
			maghrib: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6:00 PM
			isha: new Date(today.getTime() + 19.5 * 60 * 60 * 1000) // 7:30 PM
		};
	}
	
	getTimeStatus(prayerTime) {
		const now = new Date();
		const diff = prayerTime.getTime() - now.getTime();
		
		if (diff < 0) {
			return { status: 'passed', color: '#ef4444' };
		} else if (diff < 30 * 60 * 1000) { // 30 minutes
			return { status: 'soon', color: '#f59e0b' };
		} else {
			return { status: 'upcoming', color: '#22c55e' };
		}
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.style.cssText = 'padding: 20px; max-width: 500px;';
		
		const title = contentEl.createEl('h2', { text: 'Prayer Times' });
		title.style.cssText = 'text-align: center; margin-bottom: 20px; color: var(--text-accent);';
		
		const currentTime = contentEl.createEl('div');
		currentTime.style.cssText = 'text-align: center; margin-bottom: 20px; font-size: 18px; color: var(--text-normal);';
		currentTime.textContent = `Current Time: ${new Date().toLocaleTimeString()}`;
		
		const prayerTimes = this.calculatePrayerTimes();
		const timesContainer = contentEl.createEl('div');
		timesContainer.style.cssText = 'display: grid; gap: 15px;';
		
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const prayerTime = prayerTimes[salah];
			const timeStatus = this.getTimeStatus(prayerTime);
			
			const card = timesContainer.createEl('div');
			card.style.cssText = `
				background: var(--background-secondary);
				border-radius: 8px;
				padding: 15px;
				border-left: 4px solid ${timeStatus.color};
				display: flex;
				justify-content: space-between;
				align-items: center;
			`;
			
			const nameEl = card.createEl('div');
			nameEl.style.cssText = 'font-weight: 600; font-size: 16px; color: var(--text-normal);';
			nameEl.textContent = salah.charAt(0).toUpperCase() + salah.slice(1);
			
			const timeEl = card.createEl('div');
			timeEl.style.cssText = 'font-size: 14px; color: var(--text-muted);';
			timeEl.textContent = prayerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			
			const statusEl = card.createEl('div');
			statusEl.style.cssText = `font-size: 12px; color: ${timeStatus.color}; font-weight: 500;`;
			statusEl.textContent = timeStatus.status.toUpperCase();
		});
		
		const note = contentEl.createEl('p');
		note.style.cssText = 'text-align: center; margin-top: 20px; font-size: 12px; color: var(--text-muted);';
		note.textContent = 'Note: These are approximate times. Please verify with local mosque or Islamic calendar.';
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class BulkCompleteModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Bulk Complete Salahs' });
		
		const form = contentEl.createEl('form');
		
		const typeSelect = form.createEl('select');
		const oldOption = typeSelect.createEl('option');
		oldOption.value = 'old';
		oldOption.text = 'Old Salahs';
		const activeOption = typeSelect.createEl('option');
		activeOption.value = 'active';
		activeOption.text = 'Active Salahs';
		
		const checkboxContainer = form.createEl('div');
		checkboxContainer.style.cssText = 'margin: 15px 0; display: grid; gap: 10px;';
		
		const salahCheckboxes = {};
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const label = checkboxContainer.createEl('label');
			label.style.cssText = 'display: flex; align-items: center; gap: 8px;';
			
			const checkbox = label.createEl('input');
			checkbox.type = 'checkbox';
			salahCheckboxes[salah] = checkbox;
			
			label.createEl('span', { text: salah.charAt(0).toUpperCase() + salah.slice(1) });
			
			const countInput = label.createEl('input');
			countInput.type = 'number';
			countInput.placeholder = 'Count';
			countInput.min = '1';
			countInput.style.cssText = 'width: 80px; margin-left: auto;';
			salahCheckboxes[salah].countInput = countInput;
		});
		
		const selectAllBtn = form.createEl('button');
		selectAllBtn.textContent = 'Select All';
		selectAllBtn.type = 'button';
		selectAllBtn.style.cssText = 'margin: 10px 0; padding: 5px 10px;';
		selectAllBtn.onclick = () => {
			Object.values(salahCheckboxes).forEach(cb => cb.checked = true);
		};
		
		const submitBtn = form.createEl('button');
		submitBtn.textContent = 'Complete Selected';
		submitBtn.type = 'submit';
		submitBtn.style.cssText = 'background: #22c55e; color: white; padding: 10px 20px; border: none; border-radius: 4px;';
		
		form.onsubmit = async (e) => {
			e.preventDefault();
			const type = typeSelect.value;
			let totalCompleted = 0;
			const results = [];
			
			const calculatedOld = this.plugin.calculateOldSalahs();
			
			for (const [salah, checkbox] of Object.entries(salahCheckboxes)) {
				if (checkbox.checked) {
					const count = parseInt(checkbox.countInput.value) || 1;
					
					if (type === 'old') {
						const totalOld = calculatedOld[salah];
						const alreadyCompleted = this.plugin.settings.oldSalahs[salah];
						const remaining = Math.max(0, totalOld - alreadyCompleted);
						const toComplete = Math.min(count, remaining);
						
						if (toComplete > 0) {
							this.plugin.settings.oldSalahs[salah] += toComplete;
							this.plugin.trackProgress('completed', salah, toComplete, 'old');
							totalCompleted += toComplete;
							results.push(`${toComplete} ${salah}`);
						} else if (count > remaining) {
							results.push(`${salah}: only ${remaining} available`);
						}
					} else {
						const available = this.plugin.settings.activeSalahs[salah];
						const toComplete = Math.min(count, available);
						
						if (toComplete > 0) {
							this.plugin.settings.activeSalahs[salah] -= toComplete;
							this.plugin.trackProgress('completed', salah, toComplete, 'active');
							totalCompleted += toComplete;
							results.push(`${toComplete} ${salah}`);
						} else if (count > available) {
							results.push(`${salah}: only ${available} available`);
						}
					}
				}
			}
			
			await this.plugin.saveSettings();
			if (totalCompleted > 0) {
				new Notice(`Completed: ${results.join(', ')}`);
			} else {
				new Notice('No salahs were completed');
			}
			this.close();
		};
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ResetModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Delete/Reset Salahs' });
		
		const form = contentEl.createEl('form');
		
		const actionSelect = form.createEl('select');
		['reset-all-old', 'reset-all-active', 'reduce-old', 'reduce-active', 'reset-specific-old', 'reset-specific-active', 'clear-all'].forEach(action => {
			const option = actionSelect.createEl('option');
			option.value = action;
			option.text = {
				'reset-all-old': 'Reset All Old Salahs',
				'reset-all-active': 'Reset All Active Salahs',
				'reduce-old': 'Bulk Reduce Old Salahs',
				'reduce-active': 'Bulk Reduce Active Salahs',
				'reset-specific-old': 'Reset Specific Old Salah',
				'reset-specific-active': 'Reset Specific Active Salah',
				'clear-all': 'Clear All Data'
			}[action];
		});
		
		const salahSelect = form.createEl('select');
		salahSelect.style.display = 'none';
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const option = salahSelect.createEl('option');
			option.value = salah;
			option.text = salah.charAt(0).toUpperCase() + salah.slice(1);
		});
		
		const bulkContainer = form.createEl('div');
		bulkContainer.style.cssText = 'margin: 15px 0; display: none;';
		
		const salahCheckboxes = {};
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const label = bulkContainer.createEl('label');
			label.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';
			
			const checkbox = label.createEl('input');
			checkbox.type = 'checkbox';
			salahCheckboxes[salah] = checkbox;
			
			label.createEl('span', { text: salah.charAt(0).toUpperCase() + salah.slice(1) });
			
			const countInput = label.createEl('input');
			countInput.type = 'number';
			countInput.placeholder = 'Count';
			countInput.min = '1';
			countInput.style.cssText = 'width: 80px; margin-left: auto;';
			salahCheckboxes[salah].countInput = countInput;
		});
		
		const selectAllBtn = bulkContainer.createEl('button');
		selectAllBtn.textContent = 'Select All';
		selectAllBtn.type = 'button';
		selectAllBtn.style.cssText = 'margin: 10px 0; padding: 5px 10px;';
		selectAllBtn.onclick = () => {
			Object.values(salahCheckboxes).forEach(cb => cb.checked = true);
		};
		
		actionSelect.onchange = () => {
			const action = actionSelect.value;
			if (action.includes('specific')) {
				salahSelect.style.display = 'block';
				bulkContainer.style.display = 'none';
			} else if (action.includes('reduce')) {
				salahSelect.style.display = 'none';
				bulkContainer.style.display = 'block';
			} else {
				salahSelect.style.display = 'none';
				bulkContainer.style.display = 'none';
			}
		};
		
		const warningEl = form.createEl('p');
		warningEl.style.cssText = 'color: #ef4444; font-weight: bold; margin: 10px 0;';
		warningEl.textContent = '⚠️ This action cannot be undone!';
		
		const submitBtn = form.createEl('button');
		submitBtn.textContent = 'Reset';
		submitBtn.type = 'submit';
		submitBtn.style.cssText = 'background: #ef4444; color: white; padding: 10px 20px; border: none; border-radius: 4px;';
		
		form.onsubmit = async (e) => {
			e.preventDefault();
			const action = actionSelect.value;
			const salah = salahSelect.value;
			
			if (action === 'reset-all-old') {
				['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(s => {
					this.plugin.settings.oldSalahs[s] = 0;
				});
				new Notice('All old salahs reset to 0');
			} else if (action === 'reset-all-active') {
				['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(s => {
					this.plugin.settings.activeSalahs[s] = 0;
				});
				new Notice('All active salahs reset to 0');
			} else if (action === 'reduce-old') {
				const results = [];
				for (const [salah, checkbox] of Object.entries(salahCheckboxes)) {
					if (checkbox.checked) {
						const count = parseInt(checkbox.countInput.value) || 0;
						if (count > 0) {
							const current = this.plugin.settings.oldSalahs[salah];
							const newValue = Math.max(0, current - count);
							this.plugin.settings.oldSalahs[salah] = newValue;
							this.plugin.trackProgress('reduced', salah, count, 'old');
							results.push(`${salah}: ${current} → ${newValue}`);
						}
					}
				}
				if (results.length > 0) {
					new Notice(`Reduced old salahs: ${results.join(', ')}`);
				} else {
					new Notice('No salahs selected or valid counts entered');
					return;
				}
			} else if (action === 'reduce-active') {
				const results = [];
				for (const [salah, checkbox] of Object.entries(salahCheckboxes)) {
					if (checkbox.checked) {
						const count = parseInt(checkbox.countInput.value) || 0;
						if (count > 0) {
							const current = this.plugin.settings.activeSalahs[salah];
							const newValue = Math.max(0, current - count);
							this.plugin.settings.activeSalahs[salah] = newValue;
							this.plugin.trackProgress('reduced', salah, count, 'active');
							results.push(`${salah}: ${current} → ${newValue}`);
						}
					}
				}
				if (results.length > 0) {
					new Notice(`Reduced active salahs: ${results.join(', ')}`);
				} else {
					new Notice('No salahs selected or valid counts entered');
					return;
				}
			} else if (action === 'reset-specific-old') {
				const current = this.plugin.settings.oldSalahs[salah];
				this.plugin.settings.oldSalahs[salah] = 0;
				new Notice(`Reset ${salah} old salahs (${current} → 0)`);
			} else if (action === 'reset-specific-active') {
				const current = this.plugin.settings.activeSalahs[salah];
				this.plugin.settings.activeSalahs[salah] = 0;
				new Notice(`Reset ${salah} active salahs (${current} → 0)`);
			} else if (action === 'clear-all') {
				this.plugin.settings.oldSalahPeriod = { days: 0, months: 0, years: 0 };
				['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(s => {
					this.plugin.settings.oldSalahs[s] = 0;
					this.plugin.settings.activeSalahs[s] = 0;
				});
				new Notice('All data cleared');
			}
			
			await this.plugin.saveSettings();
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