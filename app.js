// PUTIN BIN CHECKER - JavaScript Implementation
let activeTab = 'single';
let isLoading = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeSingleBinChecker();
    initializeMultiBinChecker();
});

// Tab functionality
function initializeTabs() {
    const singleTab = document.getElementById('single-tab');
    const multiTab = document.getElementById('multi-tab');
    const singleSection = document.getElementById('single-section');
    const multiSection = document.getElementById('multi-section');

    singleTab.addEventListener('click', () => {
        activeTab = 'single';
        updateTabUI();
    });

    multiTab.addEventListener('click', () => {
        activeTab = 'multi';
        updateTabUI();
    });

    function updateTabUI() {
        // Update tab buttons
        if (activeTab === 'single') {
            singleTab.className = 'tab-button px-6 py-3 rounded-lg font-orbitron font-semibold transition-all duration-300 cursor-pointer bg-yellow-400 text-black';
            multiTab.className = 'tab-button px-6 py-3 rounded-lg font-orbitron font-semibold transition-all duration-300 cursor-pointer text-gray-400 hover:text-white hover:bg-gray-700';
            singleSection.classList.remove('hidden');
            multiSection.classList.add('hidden');
        } else {
            multiTab.className = 'tab-button px-6 py-3 rounded-lg font-orbitron font-semibold transition-all duration-300 cursor-pointer bg-yellow-400 text-black';
            singleTab.className = 'tab-button px-6 py-3 rounded-lg font-orbitron font-semibold transition-all duration-300 cursor-pointer text-gray-400 hover:text-white hover:bg-gray-700';
            multiSection.classList.remove('hidden');
            singleSection.classList.add('hidden');
        }
    }
}

// Single BIN Checker
function initializeSingleBinChecker() {
    const form = document.getElementById('single-form');
    const binInput = document.getElementById('single-bin');
    const resultDiv = document.getElementById('single-result');

    // Input validation
    binInput.addEventListener('input', (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
        e.target.value = value;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bin = binInput.value.trim();

        if (!bin) {
            showToast('Please enter a BIN number', 'error');
            return;
        }

        if (bin.length < 6) {
            showToast('BIN must be at least 6 digits', 'error');
            return;
        }

        await checkSingleBin(bin, resultDiv);
    });
}

// Multi BIN Checker
function initializeMultiBinChecker() {
    const form = document.getElementById('multi-form');
    const binsInput = document.getElementById('multi-bins');
    const resultsDiv = document.getElementById('multi-results');
    const binCountSpan = document.getElementById('bin-count');
    const progressSection = document.getElementById('progress-section');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // Update bin count
    binsInput.addEventListener('input', () => {
        const bins = getBinList(binsInput.value);
        binCountSpan.textContent = `${bins.length}/100`;
        binCountSpan.className = bins.length > 100 ? 'text-red-400' : '';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bins = getBinList(binsInput.value);

        if (bins.length === 0) {
            showToast('Please enter valid BIN numbers (at least 6 digits each)', 'error');
            return;
        }

        if (bins.length > 100) {
            showToast('Maximum 100 BINs allowed. Processing first 100 entries.', 'warning');
        }

        await checkMultipleBins(bins.slice(0, 100), resultsDiv, progressSection, progressBar, progressText);
    });
}

// API Functions
async function checkSingleBin(bin, resultDiv) {
    setLoading(true);
    
    try {
        const response = await fetch(`/api/bin/${bin}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('BIN not found. Please check the number and try again.');
            }
            if (response.status === 429) {
                throw new Error('Too many requests. Please wait a moment and try again.');
            }
            throw new Error('Failed to check BIN. Please try again.');
        }
        
        const data = await response.json();
        displaySingleResult(data, resultDiv);
        showToast('BIN information retrieved successfully', 'success');
    } catch (error) {
        showToast(error.message, 'error');
        displaySingleResult(null, resultDiv);
    } finally {
        setLoading(false);
    }
}

async function checkMultipleBins(bins, resultsDiv, progressSection, progressBar, progressText) {
    setLoading(true);
    progressSection.classList.remove('hidden');
    
    const results = bins.map(bin => ({ bin, status: 'pending' }));
    displayMultiResults(results, resultsDiv);
    
    for (let i = 0; i < bins.length; i++) {
        const bin = bins[i];
        
        try {
            const response = await fetch(`/api/bin/${bin}`);
            
            if (response.ok) {
                const data = await response.json();
                results[i] = { bin, result: data, status: 'success' };
            } else {
                results[i] = { bin, error: 'BIN not found', status: 'error' };
            }
        } catch (error) {
            results[i] = { bin, error: 'Network error', status: 'error' };
        }
        
        // Update progress
        const progress = ((i + 1) / bins.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${i + 1}/${bins.length}`;
        
        displayMultiResults(results, resultsDiv);
        
        // Rate limiting delay
        if (i < bins.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    setLoading(false);
    showToast('All BINs have been processed', 'success');
}

// Display Functions
function displaySingleResult(data, resultDiv) {
    if (!data) {
        resultDiv.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-search text-4xl mb-4"></i>
                <p>Enter a BIN number to see detailed information</p>
            </div>
        `;
        return;
    }

    const countryFlag = getCountryFlag(data.country_code);
    
    resultDiv.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
                <span class="text-gray-400">BIN:</span>
                <span class="font-mono text-yellow-400">${data.bin}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
                <span class="text-gray-400">Brand:</span>
                <span class="font-semibold text-green-400">${data.brand}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
                <span class="text-gray-400">Type:</span>
                <span class="text-yellow-300">${data.type}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
                <span class="text-gray-400">Level:</span>
                <span class="text-yellow-200">${data.level}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
                <span class="text-gray-400">Bank:</span>
                <span class="text-orange-400 text-sm">${data.bank}</span>
            </div>
            ${data.phone ? `
                <div class="flex justify-between items-center py-2 border-b border-gray-700">
                    <span class="text-gray-400">Phone:</span>
                    <span class="text-cyan-400">${data.phone}</span>
                </div>
            ` : ''}
            ${data.website ? `
                <div class="flex justify-between items-center py-2 border-b border-gray-700">
                    <span class="text-gray-400">Website:</span>
                    <span class="text-cyan-400">${data.website}</span>
                </div>
            ` : ''}
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
                <span class="text-gray-400">Country:</span>
                <div class="flex items-center gap-2">
                    <span class="text-red-400">${countryFlag}</span>
                    <span class="text-gray-200">${data.country_name}</span>
                </div>
            </div>
        </div>
    `;
}

function displayMultiResults(results, resultsDiv) {
    if (results.length === 0) {
        resultsDiv.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-list text-4xl mb-4"></i>
                <p>Enter BIN numbers to see bulk results</p>
            </div>
        `;
        return;
    }

    resultsDiv.innerHTML = results.map(item => {
        const statusClass = item.status === 'success' ? 'text-green-400' : 
                           item.status === 'error' ? 'text-red-400' : 'text-gray-400';
        const statusText = item.status === 'success' ? '✓ Valid' :
                          item.status === 'error' ? '✗ Error' : '⏳ Processing';

        let detailsHtml = '';
        if (item.result) {
            detailsHtml = `
                <div class="space-y-1 text-xs">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Brand:</span>
                        <span class="text-green-400">${item.result.brand}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Type:</span>
                        <span class="text-yellow-300">${item.result.type}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Level:</span>
                        <span class="text-yellow-200">${item.result.level}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Bank:</span>
                        <span class="text-orange-400 text-xs truncate max-w-32" title="${item.result.bank}">${item.result.bank}</span>
                    </div>
                    ${item.result.phone ? `
                        <div class="flex justify-between">
                            <span class="text-gray-400">Phone:</span>
                            <span class="text-cyan-400">${item.result.phone}</span>
                        </div>
                    ` : ''}
                    ${item.result.website ? `
                        <div class="flex justify-between">
                            <span class="text-gray-400">Website:</span>
                            <span class="text-cyan-400 truncate max-w-24" title="${item.result.website}">${item.result.website}</span>
                        </div>
                    ` : ''}
                    <div class="flex justify-between">
                        <span class="text-gray-400">Country:</span>
                        <span class="text-gray-200">${item.result.country_name} (${item.result.country_code})</span>
                    </div>
                </div>
            `;
        } else if (item.error) {
            detailsHtml = `<div class="text-sm text-red-400">${item.error}</div>`;
        }

        return `
            <div class="bg-black p-4 rounded-lg border border-gray-700 hover:border-yellow-400 transition-colors duration-300">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-mono text-yellow-400 text-lg font-bold">${item.bin}</span>
                    <span class="text-sm font-semibold ${statusClass}">${statusText}</span>
                </div>
                ${detailsHtml}
            </div>
        `;
    }).join('');
}

// Utility Functions
function getBinList(input) {
    return input
        .split('\n')
        .map(line => line.trim().replace(/\D/g, ''))
        .filter(bin => bin.length >= 6);
}

function getCountryFlag(countryCode) {
    const flagMap = {
        'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷',
        'JP': '🇯🇵', 'AU': '🇦🇺', 'IN': '🇮🇳', 'BR': '🇧🇷', 'CN': '🇨🇳',
        'AE': '🇦🇪', 'SA': '🇸🇦', 'EG': '🇪🇬', 'TR': '🇹🇷', 'RU': '🇷🇺'
    };
    return flagMap[countryCode] || '🏳️';
}

function setLoading(loading) {
    isLoading = loading;
    const overlay = document.getElementById('loading-overlay');
    if (loading) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white font-semibold ${
        type === 'success' ? 'bg-green-600' :
        type === 'error' ? 'bg-red-600' :
        type === 'warning' ? 'bg-yellow-600' :
        'bg-gray-600'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}
