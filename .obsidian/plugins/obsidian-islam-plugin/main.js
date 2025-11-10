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
	quranProgress: {
		readingSessions: [], // Current reading sessions
		completions: [], // Array of {id, startDate, endDate, sessions: []}
		currentCompletionId: null
	},
	progressHistory: []
};

class IslamPlugin extends Plugin {
	async onload() {
		await this.loadSettings();
		
		this.addSettingTab(new IslamSettingTab(this.app, this));
		
		// === SALAH COMPLETION ===
		this.addCommand({
			id: 'bulk-complete',
			name: 'Complete Salahs',
			callback: () => new BulkCompleteModal(this).open()
		});
		
		// === SALAH MANAGEMENT ===
		this.addCommand({
			id: 'manage-salahs',
			name: 'Add/Edit Active Salahs',
			callback: () => new ManageSalahModal(this).open()
		});
		
		this.addCommand({
			id: 'reset-salahs',
			name: 'Delete/Reset Salahs',
			callback: () => new ResetModal(this).open()
		});
		
		// === DASHBOARD & TRACKING ===
		this.addCommand({
			id: 'show-dashboard',
			name: 'View Salah Dashboard',
			callback: () => new DashboardModal(this).open()
		});
		
		this.addCommand({
			id: 'progress-history',
			name: 'View Progress History',
			callback: () => new ProgressHistoryModal(this).open()
		});
		
		// === PRAYER TIMES ===
		this.addCommand({
			id: 'prayer-times',
			name: 'View Prayer Times',
			callback: () => new PrayerTimesModal(this).open()
		});
		
		// === QURAN TRACKING ===
		this.addCommand({
			id: 'add-quran-reading',
			name: 'Add Quran Reading',
			callback: () => new QuranReadingModal(this).open()
		});
		
		this.addCommand({
			id: 'quran-dashboard',
			name: 'View Quran Dashboard',
			callback: () => new QuranDashboardModal(this).open()
		});
		

		
		this.addCommand({
			id: 'edit-quran-readings',
			name: 'Edit Quran Readings',
			callback: () => new EditQuranModal(this).open()
		});
		
		this.addCommand({
			id: 'quran-completions',
			name: 'View Quran Completions',
			callback: () => new QuranCompletionsModal(this).open()
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
	
	calculateQuranProgress() {
		const sessions = this.settings.quranProgress.readingSessions || [];
		const totalTumun = sessions.reduce((sum, session) => sum + session.totalTumun, 0);
		const fullQuranTumun = 480; // 30 Juz * 2 Hizb * 4 Rubu * 2 Tumun
		
		return {
			tumun: totalTumun,
			rubu: Math.floor(totalTumun / 2),
			hizb: Math.floor(totalTumun / 8),
			juz: Math.floor(totalTumun / 16),
			percentage: Math.round((totalTumun / fullQuranTumun) * 100),
			fullQuranTumun,
			sessions: sessions.length
		};
	}
	
	convertToTumun(juz, hizb, rubu, tumun) {
		// Convert reading input to total tumun
		return (juz * 16) + (hizb * 8) + (rubu * 2) + tumun;
	}
	
	checkAndHandleCompletion() {
		const sessions = this.settings.quranProgress.readingSessions || [];
		const totalTumun = sessions.reduce((sum, session) => sum + session.totalTumun, 0);
		
		if (totalTumun >= 480) {
			this.completeQuran();
			return true;
		}
		return false;
	}
	
	async completeQuran() {
		const sessions = this.settings.quranProgress.readingSessions || [];
		const completionId = Date.now();
		
		const completion = {
			id: completionId,
			startDate: sessions[0]?.date || new Date().toISOString(),
			endDate: new Date().toISOString(),
			sessions: [...sessions]
		};
		
		if (!this.settings.quranProgress.completions) {
			this.settings.quranProgress.completions = [];
		}
		this.settings.quranProgress.completions.push(completion);
		this.settings.quranProgress.readingSessions = [];
		this.settings.quranProgress.currentCompletionId = null;
		
		await this.saveSettings();
		new Notice('🎉 Alhamdulillah! Quran completed! Starting new Khatm.');
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
		
		// Tab Navigation
		const tabContainer = containerEl.createEl('div');
		tabContainer.style.cssText = 'display: flex; border-bottom: 1px solid var(--background-modifier-border); margin-bottom: 20px;';
		
		const salahTab = tabContainer.createEl('button', { text: 'Salah' });
		salahTab.style.cssText = 'padding: 10px 20px; border: none; background: var(--interactive-accent); color: var(--text-on-accent); cursor: pointer; border-radius: 4px 4px 0 0;';
		
		const quranTab = tabContainer.createEl('button', { text: 'Quran' });
		quranTab.style.cssText = 'padding: 10px 20px; border: none; background: var(--background-secondary); color: var(--text-muted); cursor: pointer; border-radius: 4px 4px 0 0; margin-left: 2px;';
		
		// Tab Content
		const salahContent = containerEl.createEl('div');
		const quranContent = containerEl.createEl('div');
		quranContent.style.display = 'none';
		
		// Tab Switching
		salahTab.onclick = () => {
			salahTab.style.background = 'var(--interactive-accent)';
			salahTab.style.color = 'var(--text-on-accent)';
			quranTab.style.background = 'var(--background-secondary)';
			quranTab.style.color = 'var(--text-muted)';
			salahContent.style.display = 'block';
			quranContent.style.display = 'none';
		};
		
		quranTab.onclick = () => {
			quranTab.style.background = 'var(--interactive-accent)';
			quranTab.style.color = 'var(--text-on-accent)';
			salahTab.style.background = 'var(--background-secondary)';
			salahTab.style.color = 'var(--text-muted)';
			quranContent.style.display = 'block';
			salahContent.style.display = 'none';
		};
		
		// SALAH TAB CONTENT
		salahContent.createEl('h4', { text: 'Old Salahs Time Period' });
		
		new Setting(salahContent)
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
		
		new Setting(salahContent)
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
		
		new Setting(salahContent)
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
		salahContent.createEl('h4', { text: 'Calculated Old Salahs (Read-only)' });
		const calculatedOld = this.plugin.calculateOldSalahs();
		const salahTypes = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
		
		salahTypes.forEach(salah => {
			new Setting(salahContent)
				.setName(salah.charAt(0).toUpperCase() + salah.slice(1))
				.setDesc(`${calculatedOld[salah]} prayers`);
		});
		
		// Active Salahs
		salahContent.createEl('h4', { text: 'Active Salahs' });
		salahTypes.forEach(salah => {
			new Setting(salahContent)
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
		
		// QURAN TAB CONTENT
		quranContent.createEl('h4', { text: 'Quran Reading Progress' });
		
		const quranProgress = this.plugin.calculateQuranProgress();
		
		new Setting(quranContent)
			.setName('Total Progress')
			.setDesc(`${quranProgress.percentage}% complete (${quranProgress.tumun}/${quranProgress.fullQuranTumun} tumun)`);
		
		new Setting(quranContent)
			.setName('Juz Completed')
			.setDesc(`${quranProgress.juz} out of 30 Juz`);
		
		new Setting(quranContent)
			.setName('Hizb Completed')
			.setDesc(`${quranProgress.hizb} Hizb total`);
		
		new Setting(quranContent)
			.setName('Rubu Completed')
			.setDesc(`${quranProgress.rubu} Rubu (1/4) total`);
		
		quranContent.createEl('h4', { text: 'Reading Units' });
		quranContent.createEl('p', { text: '• 1 Juz = 2 Hizb = 8 Rubu = 16 Tumun' }).style.color = 'var(--text-muted)';
		quranContent.createEl('p', { text: '• 1 Hizb = 4 Rubu = 8 Tumun' }).style.color = 'var(--text-muted)';
		quranContent.createEl('p', { text: '• 1 Rubu = 2 Tumun' }).style.color = 'var(--text-muted)';
	}
}

class ManageSalahModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Edit Active Salahs' });
		
		const form = contentEl.createEl('form');
		
		const actionSelect = form.createEl('select');
		['add', 'remove', 'set'].forEach(action => {
			const option = actionSelect.createEl('option');
			option.value = action;
			option.text = {
				'add': 'Add to Active Salahs',
				'remove': 'Remove from Active Salahs',
				'set': 'Set Active Salahs Count'
			}[action];
		});
		
		const checkboxContainer = form.createEl('div');
		checkboxContainer.style.cssText = 'margin: 15px 0; display: grid; gap: 10px;';
		
		const salahCheckboxes = {};
		['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
			const label = checkboxContainer.createEl('label');
			label.style.cssText = 'display: flex; align-items: center; gap: 8px;';
			
			const checkbox = label.createEl('input');
			checkbox.type = 'checkbox';
			salahCheckboxes[salah] = checkbox;
			
			const nameSpan = label.createEl('span', { text: salah.charAt(0).toUpperCase() + salah.slice(1) });
			nameSpan.style.cssText = 'min-width: 80px;';
			
			const currentSpan = label.createEl('span');
			currentSpan.style.cssText = 'color: var(--text-muted); font-size: 12px; min-width: 60px;';
			currentSpan.textContent = `(${this.plugin.settings.activeSalahs[salah]})`;
			
			const countInput = label.createEl('input');
			countInput.type = 'number';
			countInput.placeholder = 'Count';
			countInput.min = '0';
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
		submitBtn.textContent = 'Execute';
		submitBtn.type = 'submit';
		submitBtn.style.cssText = 'background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 4px;';
		
		form.onsubmit = async (e) => {
			e.preventDefault();
			const action = actionSelect.value;
			const results = [];
			
			for (const [salah, checkbox] of Object.entries(salahCheckboxes)) {
				if (checkbox.checked) {
					const count = parseInt(checkbox.countInput.value) || 0;
					const current = this.plugin.settings.activeSalahs[salah];
					
					if (action === 'add') {
						this.plugin.settings.activeSalahs[salah] += count;
						results.push(`${salah}: ${current} → ${current + count}`);
					} else if (action === 'remove') {
						const newValue = Math.max(0, current - count);
						this.plugin.settings.activeSalahs[salah] = newValue;
						results.push(`${salah}: ${current} → ${newValue}`);
					} else if (action === 'set') {
						this.plugin.settings.activeSalahs[salah] = count;
						results.push(`${salah}: ${current} → ${count}`);
					}
				}
			}
			
			await this.plugin.saveSettings();
			if (results.length > 0) {
				new Notice(`${action.charAt(0).toUpperCase() + action.slice(1)}: ${results.join(', ')}`);
			} else {
				new Notice('No salahs selected');
			}
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

class QuranReadingModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Add Quran Reading' });
		
		const form = contentEl.createEl('form');
		
		const juzInput = form.createEl('input');
		juzInput.type = 'number';
		juzInput.placeholder = 'Juz (0-30)';
		juzInput.min = '0';
		juzInput.max = '30';
		
		const hizbInput = form.createEl('input');
		hizbInput.type = 'number';
		hizbInput.placeholder = 'Hizb (0-1)';
		hizbInput.min = '0';
		hizbInput.max = '1';
		
		const rubuInput = form.createEl('input');
		rubuInput.type = 'number';
		rubuInput.placeholder = 'Rubu (0-3)';
		rubuInput.min = '0';
		rubuInput.max = '3';
		
		const tumunInput = form.createEl('input');
		tumunInput.type = 'number';
		tumunInput.placeholder = 'Tumun (0-1)';
		tumunInput.min = '0';
		tumunInput.max = '1';
		
		const noteInput = form.createEl('textarea');
		noteInput.placeholder = 'Optional note (e.g., "Morning reading after Fajr")';
		noteInput.style.cssText = 'width: 100%; height: 60px; resize: vertical; margin: 10px 0;';
		
		form.createEl('p', { text: 'Enter the amount you read (e.g., 1 Juz 2 Hizb 1 Rubu 0 Tumun)' }).style.cssText = 'font-size: 12px; color: var(--text-muted); margin: 10px 0;';
		
		const submitBtn = form.createEl('button');
		submitBtn.textContent = 'Add Reading';
		submitBtn.type = 'submit';
		submitBtn.style.cssText = 'background: #22c55e; color: white; padding: 10px 20px; border: none; border-radius: 4px;';
		
		form.onsubmit = async (e) => {
			e.preventDefault();
			const juz = parseInt(juzInput.value) || 0;
			const hizb = parseInt(hizbInput.value) || 0;
			const rubu = parseInt(rubuInput.value) || 0;
			const tumun = parseInt(tumunInput.value) || 0;
			const note = noteInput.value.trim();
			
			const totalTumun = this.plugin.convertToTumun(juz, hizb, rubu, tumun);
			
			if (totalTumun > 0) {
				// Check if this would exceed completion
				const sessions = this.plugin.settings.quranProgress.readingSessions || [];
				const currentTotal = sessions.reduce((sum, s) => sum + s.totalTumun, 0);
				if (currentTotal + totalTumun > 480) {
					const remaining = 480 - currentTotal;
					new Notice(`Only ${remaining} tumun remaining to complete current Khatm`);
					return;
				}
				
				const session = {
					id: Date.now(),
					date: new Date().toISOString(),
					juz,
					hizb,
					rubu,
					tumun,
					note,
					totalTumun
				};
				
				if (!this.plugin.settings.quranProgress.readingSessions) {
					this.plugin.settings.quranProgress.readingSessions = [];
				}
				this.plugin.settings.quranProgress.readingSessions.push(session);
				this.plugin.trackProgress('read', 'quran', totalTumun, 'tumun');
				
				// Check for completion
				const completed = this.plugin.checkAndHandleCompletion();
				if (!completed) {
					await this.plugin.saveSettings();
					new Notice(`Added ${totalTumun} tumun of Quran reading`);
				}
				this.close();
			} else {
				new Notice('Please enter a valid reading amount');
			}
		};
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class QuranDashboardModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.style.cssText = 'padding: 20px; max-width: 600px;';
		
		const title = contentEl.createEl('h2', { text: 'Quran Reading Dashboard' });
		title.style.cssText = 'text-align: center; margin-bottom: 20px; color: var(--text-accent);';
		
		const progress = this.plugin.calculateQuranProgress();
		
		// Progress Circle
		const circleContainer = contentEl.createEl('div');
		circleContainer.style.cssText = 'text-align: center; margin-bottom: 30px;';
		
		const circle = circleContainer.createEl('div');
		circle.style.cssText = `
			position: relative;
			display: inline-block;
			width: 150px;
			height: 150px;
			border-radius: 50%;
			background: conic-gradient(
				${progress.percentage >= 80 ? '#22c55e' : progress.percentage >= 50 ? '#f59e0b' : '#3b82f6'} ${progress.percentage * 3.6}deg,
				#333 ${progress.percentage * 3.6}deg
			);
			padding: 15px;
		`;
		
		const innerCircle = circle.createEl('div');
		innerCircle.style.cssText = `
			width: 120px;
			height: 120px;
			border-radius: 50%;
			background: var(--background-secondary);
			display: flex;
			align-items: center;
			justify-content: center;
			flex-direction: column;
		`;
		
		innerCircle.createEl('div', { text: `${progress.percentage}%` }).style.cssText = 'font-size: 24px; font-weight: bold; color: var(--text-accent);';
		innerCircle.createEl('div', { text: 'Complete' }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
		
		// Progress Stats
		const statsContainer = contentEl.createEl('div');
		statsContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;';
		
		const juzCard = statsContainer.createEl('div');
		juzCard.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 8px; text-align: center;';
		juzCard.createEl('div', { text: progress.juz.toString() }).style.cssText = 'font-size: 28px; font-weight: bold; color: var(--text-accent);';
		juzCard.createEl('div', { text: 'Juz Completed' }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
		
		const hizbCard = statsContainer.createEl('div');
		hizbCard.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 8px; text-align: center;';
		hizbCard.createEl('div', { text: progress.hizb.toString() }).style.cssText = 'font-size: 28px; font-weight: bold; color: var(--text-accent);';
		hizbCard.createEl('div', { text: 'Total Hizb' }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
		
		const rubuCard = statsContainer.createEl('div');
		rubuCard.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 8px; text-align: center;';
		rubuCard.createEl('div', { text: progress.rubu.toString() }).style.cssText = 'font-size: 28px; font-weight: bold; color: var(--text-accent);';
		rubuCard.createEl('div', { text: 'Total Rubu' }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
		
		const tumunCard = statsContainer.createEl('div');
		tumunCard.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 8px; text-align: center;';
		tumunCard.createEl('div', { text: progress.tumun.toString() }).style.cssText = 'font-size: 28px; font-weight: bold; color: var(--text-accent);';
		tumunCard.createEl('div', { text: 'Total Tumun' }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
		
		// Remaining
		const remaining = progress.fullQuranTumun - progress.tumun;
		const remainingJuz = Math.floor(remaining / 16);
		const remainingHizb = Math.floor((remaining % 16) / 8);
		
		contentEl.createEl('h3', { text: 'Remaining' });
		if (remainingJuz > 0 || remainingHizb > 0) {
			contentEl.createEl('p', { text: `${remainingJuz} Juz and ${remainingHizb} Hizb remaining to complete the Quran` });
		} else {
			contentEl.createEl('p', { text: 'Alhamdulillah! Quran completed!' }).style.color = '#22c55e';
		}
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class EditQuranModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.style.cssText = 'padding: 20px; max-width: 600px;';
		
		const title = contentEl.createEl('h2', { text: 'Edit Quran Readings' });
		title.style.cssText = 'text-align: center; margin-bottom: 20px; color: var(--text-accent);';
		
		const sessions = this.plugin.settings.quranProgress.readingSessions || [];
		
		if (sessions.length === 0) {
			contentEl.createEl('p', { text: 'No reading sessions to edit.' });
			return;
		}
		
		const sessionsContainer = contentEl.createEl('div');
		sessionsContainer.style.cssText = 'display: grid; gap: 10px; max-height: 400px; overflow-y: auto;';
		
		sessions.slice().reverse().forEach((session, index) => {
			const card = sessionsContainer.createEl('div');
			card.style.cssText = `
				background: var(--background-secondary);
				border-radius: 8px;
				padding: 15px;
				border-left: 4px solid #3b82f6;
				display: flex;
				justify-content: space-between;
				align-items: center;
			`;
			
			const info = card.createEl('div');
			info.createEl('div', { text: `${session.juz}J ${session.hizb}H ${session.rubu}R ${session.tumun}T` }).style.cssText = 'font-weight: 600; color: var(--text-normal);';
			info.createEl('div', { text: new Date(session.date).toLocaleString() }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
			if (session.note) {
				info.createEl('div', { text: `"${session.note}"` }).style.cssText = 'font-size: 12px; color: var(--text-muted); font-style: italic;';
			}
			
			const actions = card.createEl('div');
			actions.style.cssText = 'display: flex; gap: 8px;';
			
			const editBtn = actions.createEl('button', { text: 'Edit' });
			editBtn.style.cssText = 'padding: 5px 10px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer;';
			editBtn.onclick = () => this.editSession(session);
			
			const deleteBtn = actions.createEl('button', { text: 'Delete' });
			deleteBtn.style.cssText = 'padding: 5px 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;';
			deleteBtn.onclick = () => this.deleteSession(session.id);
		});
	}
	
	editSession(session) {
		this.close();
		new EditSingleQuranModal(this.plugin, session).open();
	}
	
	async deleteSession(sessionId) {
		const sessions = this.plugin.settings.quranProgress.readingSessions;
		const index = sessions.findIndex(s => s.id === sessionId);
		if (index !== -1) {
			sessions.splice(index, 1);
			await this.plugin.saveSettings();
			new Notice('Reading session deleted');
			this.display();
		}
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class EditSingleQuranModal extends Modal {
	constructor(plugin, session) {
		super(plugin.app);
		this.plugin = plugin;
		this.session = session;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Edit Reading Session' });
		
		const form = contentEl.createEl('form');
		
		const juzInput = form.createEl('input');
		juzInput.type = 'number';
		juzInput.placeholder = 'Juz (0-30)';
		juzInput.value = this.session.juz.toString();
		juzInput.min = '0';
		juzInput.max = '30';
		
		const hizbInput = form.createEl('input');
		hizbInput.type = 'number';
		hizbInput.placeholder = 'Hizb (0-1)';
		hizbInput.value = this.session.hizb.toString();
		hizbInput.min = '0';
		hizbInput.max = '1';
		
		const rubuInput = form.createEl('input');
		rubuInput.type = 'number';
		rubuInput.placeholder = 'Rubu (0-3)';
		rubuInput.value = this.session.rubu.toString();
		rubuInput.min = '0';
		rubuInput.max = '3';
		
		const tumunInput = form.createEl('input');
		tumunInput.type = 'number';
		tumunInput.placeholder = 'Tumun (0-1)';
		tumunInput.value = this.session.tumun.toString();
		tumunInput.min = '0';
		tumunInput.max = '1';
		
		const noteInput = form.createEl('textarea');
		noteInput.placeholder = 'Optional note';
		noteInput.value = this.session.note || '';
		noteInput.style.cssText = 'width: 100%; height: 60px; resize: vertical; margin: 10px 0;';
		
		const submitBtn = form.createEl('button');
		submitBtn.textContent = 'Update Reading';
		submitBtn.type = 'submit';
		submitBtn.style.cssText = 'background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 4px;';
		
		form.onsubmit = async (e) => {
			e.preventDefault();
			const juz = parseInt(juzInput.value) || 0;
			const hizb = parseInt(hizbInput.value) || 0;
			const rubu = parseInt(rubuInput.value) || 0;
			const tumun = parseInt(tumunInput.value) || 0;
			const note = noteInput.value.trim();
			
			const totalTumun = this.plugin.convertToTumun(juz, hizb, rubu, tumun);
			
			if (totalTumun > 0) {
				const sessions = this.plugin.settings.quranProgress.readingSessions;
				const index = sessions.findIndex(s => s.id === this.session.id);
				if (index !== -1) {
					sessions[index] = {
						...this.session,
						juz,
						hizb,
						rubu,
						tumun,
						note,
						totalTumun
					};
					await this.plugin.saveSettings();
					new Notice('Reading session updated');
					this.close();
				}
			} else {
				new Notice('Please enter a valid reading amount');
			}
		};
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class QuranCompletionsModal extends Modal {
	constructor(plugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.currentPage = 0;
		this.itemsPerPage = 5;
	}
	
	display() {
		const { contentEl } = this;
		contentEl.empty();
		
		const title = contentEl.createEl('h2', { text: 'Quran Completions' });
		title.style.cssText = 'text-align: center; margin-bottom: 20px; color: var(--text-accent);';
		
		const completions = this.plugin.settings.quranProgress.completions || [];
		
		if (completions.length === 0) {
			contentEl.createEl('p', { text: 'No Quran completions yet. Keep reading to complete your first Khatm!' });
			return;
		}
		
		// Summary
		const summaryCard = contentEl.createEl('div');
		summaryCard.style.cssText = 'background: var(--background-secondary); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border-left: 4px solid #22c55e;';
		summaryCard.createEl('div', { text: completions.length.toString() }).style.cssText = 'font-size: 32px; font-weight: bold; color: var(--text-accent);';
		summaryCard.createEl('div', { text: 'Total Completions' }).style.cssText = 'font-size: 14px; color: var(--text-muted);';
		
		// Pagination
		const totalPages = Math.ceil(completions.length / this.itemsPerPage);
		const startIndex = this.currentPage * this.itemsPerPage;
		const endIndex = startIndex + this.itemsPerPage;
		const currentCompletions = completions.slice(startIndex, endIndex);
		
		// Pagination Controls
		if (totalPages > 1) {
			const paginationTop = contentEl.createEl('div');
			paginationTop.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 15px;';
			
			const prevBtn = paginationTop.createEl('button', { text: '← Previous' });
			prevBtn.style.cssText = 'padding: 8px 12px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 4px; cursor: pointer;';
			prevBtn.disabled = this.currentPage === 0;
			if (prevBtn.disabled) prevBtn.style.opacity = '0.5';
			prevBtn.onclick = () => {
				this.currentPage--;
				this.display();
			};
			
			const pageInfo = paginationTop.createEl('span');
			pageInfo.textContent = `Page ${this.currentPage + 1} of ${totalPages}`;
			pageInfo.style.cssText = 'font-weight: 500; color: var(--text-normal);';
			
			const nextBtn = paginationTop.createEl('button', { text: 'Next →' });
			nextBtn.style.cssText = 'padding: 8px 12px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 4px; cursor: pointer;';
			nextBtn.disabled = this.currentPage === totalPages - 1;
			if (nextBtn.disabled) nextBtn.style.opacity = '0.5';
			nextBtn.onclick = () => {
				this.currentPage++;
				this.display();
			};
		}
		
		// Completions List
		const completionsContainer = contentEl.createEl('div');
		completionsContainer.style.cssText = 'display: grid; gap: 10px;';
		
		currentCompletions.forEach((completion, pageIndex) => {
			const actualIndex = startIndex + pageIndex;
			const card = completionsContainer.createEl('div');
			card.style.cssText = `
				background: var(--background-secondary);
				border-radius: 8px;
				padding: 15px;
				border-left: 4px solid #22c55e;
				cursor: pointer;
				transition: transform 0.2s ease;
			`;
			
			card.onmouseover = () => card.style.transform = 'translateY(-2px)';
			card.onmouseout = () => card.style.transform = 'translateY(0)';
			card.onclick = () => {
				this.close();
				new CompletionDetailModal(this.plugin, completion, actualIndex + 1).open();
			};
			
			const header = card.createEl('div');
			header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
			
			const titleEl = header.createEl('div');
			titleEl.style.cssText = 'font-weight: 600; color: var(--text-normal);';
			titleEl.textContent = `Completion ${actualIndex + 1}`;
			
			const sessionsCount = header.createEl('div');
			sessionsCount.style.cssText = 'font-size: 12px; color: var(--text-muted);';
			sessionsCount.textContent = `${completion.sessions.length} sessions`;
			
			const dateRange = card.createEl('div');
			dateRange.style.cssText = 'font-size: 14px; color: var(--text-muted);';
			const startDate = new Date(completion.startDate).toLocaleDateString();
			const endDate = new Date(completion.endDate).toLocaleDateString();
			dateRange.textContent = `${startDate} → ${endDate}`;
			
			// Duration
			const duration = Math.ceil((new Date(completion.endDate) - new Date(completion.startDate)) / (1000 * 60 * 60 * 24));
			const durationEl = card.createEl('div');
			durationEl.style.cssText = 'font-size: 12px; color: var(--text-accent); margin-top: 5px;';
			durationEl.textContent = `${duration} days`;
		});
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.style.cssText = 'padding: 20px; max-width: 600px;';
		this.display();
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class CompletionDetailModal extends Modal {
	constructor(plugin, completion, completionNumber) {
		super(plugin.app);
		this.plugin = plugin;
		this.completion = completion;
		this.completionNumber = completionNumber;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.style.cssText = 'padding: 20px; max-width: 700px;';
		
		const title = contentEl.createEl('h2', { text: `Completion ${this.completionNumber} Details` });
		title.style.cssText = 'text-align: center; margin-bottom: 20px; color: var(--text-accent);';
		
		// Summary
		const summaryContainer = contentEl.createEl('div');
		summaryContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;';
		
		const startCard = summaryContainer.createEl('div');
		startCard.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 8px; text-align: center;';
		startCard.createEl('div', { text: new Date(this.completion.startDate).toLocaleDateString() }).style.cssText = 'font-weight: bold; color: var(--text-accent);';
		startCard.createEl('div', { text: 'Start Date' }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
		
		const endCard = summaryContainer.createEl('div');
		endCard.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 8px; text-align: center;';
		endCard.createEl('div', { text: new Date(this.completion.endDate).toLocaleDateString() }).style.cssText = 'font-weight: bold; color: var(--text-accent);';
		endCard.createEl('div', { text: 'End Date' }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
		
		const durationCard = summaryContainer.createEl('div');
		durationCard.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 8px; text-align: center;';
		const duration = Math.ceil((new Date(this.completion.endDate) - new Date(this.completion.startDate)) / (1000 * 60 * 60 * 24));
		durationCard.createEl('div', { text: `${duration} days` }).style.cssText = 'font-weight: bold; color: var(--text-accent);';
		durationCard.createEl('div', { text: 'Duration' }).style.cssText = 'font-size: 12px; color: var(--text-muted);';
		
		// Reading Sessions
		contentEl.createEl('h3', { text: 'Reading Sessions' }).style.cssText = 'margin-bottom: 15px;';
		
		const sessionsContainer = contentEl.createEl('div');
		sessionsContainer.style.cssText = 'display: grid; gap: 8px; max-height: 300px; overflow-y: auto;';
		
		this.completion.sessions.forEach(session => {
			const sessionCard = sessionsContainer.createEl('div');
			sessionCard.style.cssText = `
				background: var(--background-secondary);
				border-radius: 6px;
				padding: 12px;
				border-left: 3px solid #22c55e;
			`;
			
			const sessionHeader = sessionCard.createEl('div');
			sessionHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;';
			
			const readingText = sessionHeader.createEl('div');
			readingText.style.cssText = 'font-weight: 500; color: var(--text-normal);';
			readingText.textContent = `${session.juz}J ${session.hizb}H ${session.rubu}R ${session.tumun}T`;
			
			const dateText = sessionHeader.createEl('div');
			dateText.style.cssText = 'font-size: 12px; color: var(--text-muted);';
			dateText.textContent = new Date(session.date).toLocaleString();
			
			if (session.note) {
				const noteText = sessionCard.createEl('div');
				noteText.style.cssText = 'font-size: 12px; color: var(--text-muted); font-style: italic;';
				noteText.textContent = `"${session.note}"`;
			}
			
			const tumunText = sessionCard.createEl('div');
			tumunText.style.cssText = 'font-size: 11px; color: var(--text-accent); margin-top: 3px;';
			tumunText.textContent = `${session.totalTumun} tumun`;
		});
		
		// Back button
		const backBtn = contentEl.createEl('button', { text: 'Back to Completions' });
		backBtn.style.cssText = 'margin-top: 20px; padding: 10px 20px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 4px; cursor: pointer;';
		backBtn.onclick = () => {
			this.close();
			new QuranCompletionsModal(this.plugin).open();
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