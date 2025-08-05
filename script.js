class KittenGenerator {
    constructor() {
        this.catWords = null;
        this.catColors = null;
        this.catHistory = [];
        this.currentIndex = -1;
        this.isGenerating = false;
        this.kittenNames = [
            "Whiskers", "Mittens", "Shadow", "Luna", "Simba", "Bella", "Charlie", "Lucy",
            "Oliver", "Milo", "Tiger", "Smokey", "Princess", "Boots", "Ginger", "Patches",
            "Snowball", "Midnight", "Cocoa", "Peanut", "Buttercup", "Cuddles", "Snuggles", "Fluffy",
            "Pepper", "Cinnamon", "Honey", "Marble", "Oreo", "Cookie", "Biscuit", "Muffin",
            "Pumpkin", "Autumn", "Willow", "Jasmine", "Rose", "Daisy", "Lily", "Violet",
            "Ruby", "Sapphire", "Diamond", "Pearl", "Angel", "Star", "Comet", "Nova",
            "Storm", "Thunder", "Lightning", "Rain", "Sunshine", "Rainbow", "Cloud", "Sky",
            "Ocean", "River", "Forest", "Meadow", "Blossom", "Petal", "Leaf", "Fern",
            "Magic", "Wonder", "Dream", "Hope", "Joy", "Love", "Peace", "Harmony",
            "Sparkle", "Glitter", "Shimmer", "Twinkle", "Dazzle", "Glow", "Shine", "Bright"
        ];
        
        // Audio system
        this.audioContext = null;
        this.sounds = [];
        this.isAudioInitialized = false;
        
        this.initializeElements();
        this.loadFromStorage();
        this.loadData();
        this.bindEvents();
        this.initializeAudio();
    }
    
    initializeElements() {
        this.catImage = document.getElementById('cat-image');
        this.catPrompt = document.getElementById('cat-prompt');
        this.catName = document.getElementById('cat-name');
        this.loading = document.getElementById('loading');
        this.backBtn = document.getElementById('back-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.currentIndexEl = document.getElementById('current-index');
        this.totalCatsEl = document.getElementById('total-cats');
    }
    
    initializeAudio() {
        // Preload all cat sounds
        for (let i = 0; i < 10; i++) {
            const audio = new Audio(`cat-sound-${i}.mp3`);
            audio.preload = 'auto';
            this.sounds.push(audio);
        }
    }
    
    async initAudioContext() {
        if (!this.isAudioInitialized) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isAudioInitialized = true;
        }
    }
    
    playCatSound(soundId) {
        // Ensure we have sounds loaded
        if (!this.sounds[soundId]) return;
        
        // Initialize audio context on first interaction
        this.initAudioContext();
        
        // Stop any currently playing sound
        this.sounds.forEach(sound => {
            if (!sound.paused) {
                sound.pause();
                sound.currentTime = 0;
            }
        });
        
        // Play the new sound
        try {
            this.sounds[soundId].play();
        } catch (error) {
            console.error('Error playing cat sound:', error);
        }
    }
    
    loadFromStorage() {
        const stored = localStorage.getItem('kittenHistory');
        if (stored) {
            try {
                this.catHistory = JSON.parse(stored);
                this.currentIndex = this.catHistory.length - 1;
                console.log('Loaded', this.catHistory.length, 'kittens from storage');
            } catch (error) {
                console.error('Error loading from storage:', error);
                this.catHistory = [];
                this.currentIndex = -1;
            }
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('kittenHistory', JSON.stringify(this.catHistory));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }
    
    generateUniqueName() {
        const usedNames = new Set(this.catHistory.map(cat => cat.name));
        const availableNames = this.kittenNames.filter(name => !usedNames.has(name));
        
        if (availableNames.length === 0) {
            // If all names are used, start adding numbers
            const baseName = this.getRandomItem(this.kittenNames);
            let counter = 2;
            let newName = `${baseName}${counter}`;
            while (usedNames.has(newName)) {
                counter++;
                newName = `${baseName}${counter}`;
            }
            return newName;
        }
        
        return this.getRandomItem(availableNames);
    }
    
    async loadData() {
        try {
            // Load both cat words and colors
            const [catWordsResponse, colorsResponse] = await Promise.all([
                fetch('cat-words.json'),
                fetch('colors.json')
            ]);
            
            this.catWords = await catWordsResponse.json();
            this.catColors = await colorsResponse.json();
            
            console.log('Cat words loaded:', Object.keys(this.catWords).length, 'categories');
            console.log('Cat colors loaded:', Object.keys(this.catColors).length, 'color categories');
            
            // If we have stored cats, display the current one, otherwise generate first
            if (this.catHistory.length > 0) {
                this.displayCat(this.catHistory[this.currentIndex]);
                this.updateControls();
            } else {
                await this.generateNextCat();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to basic generation
            if (this.catHistory.length === 0) {
                await this.generateNextCat();
            }
        }
    }
    
    bindEvents() {
        this.nextBtn.addEventListener('click', () => this.handleNext());
        this.backBtn.addEventListener('click', () => this.handleBack());
        this.downloadBtn.addEventListener('click', () => this.downloadCurrentCat());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.handleNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.handleBack();
            } else if (e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                this.downloadCurrentCat();
            }
        });
    }
    
    generateRandomPrompt() {
        if (!this.catWords) {
            // Fallback prompts - ensure all contain cat/kitten words
            const fallbackPrompts = [
                "cute little kitten adorable fluffy cat",
                "cute little kitten orange tabby",
                "cute little kitten playful black and white cat",
                "cute little kitten sleepy grey cat",
                "cute little kitten majestic long-haired cat"
            ];
            return fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
        }
        
        // Always start with "cute little kitten"
        let prompt = "cute little kitten ";
        
        // Build a complex prompt using multiple categories
        const usedWords = new Set();
        
        // Add 1-2 adjectives
        if (Math.random() > 0.3) {
            const adjectives = this.catWords.adjectives || [];
            const adj = this.getRandomUnique(adjectives, usedWords);
            if (adj) prompt += adj + " ";
        }
        
        // Add detailed color from colors.json (prioritize this over cat-words colors)
        if (Math.random() > 0.2 && this.catColors) {
            const allColorCategories = Object.values(this.catColors).flat();
            const color = this.getRandomItem(allColorCategories);
            if (color) prompt += color + " ";
        } else if (Math.random() > 0.4) {
            // Fallback to original colors/patterns if colors.json not loaded
            const colors = this.catWords.colors || [];
            const patterns = this.catWords.patterns || [];
            const colorPattern = [...colors, ...patterns];
            const color = this.getRandomUnique(colorPattern, usedWords);
            if (color) prompt += color + " ";
        }
        
        // Add breed or type
        if (Math.random() > 0.6) {
            const breeds = this.catWords.breeds || [];
            const breed = this.getRandomUnique(breeds, usedWords);
            if (breed) prompt += breed + " ";
        }
        
        // Add another cat/kitten word for emphasis
        const bases = this.catWords.bases || ["cat", "kitten", "kitty", "feline"];
        const additionalBase = this.getRandomItem(bases);
        prompt += additionalBase + " ";
        
        // Add pose/action
        if (Math.random() > 0.5) {
            const poses = this.catWords.poses || [];
            const pose = this.getRandomUnique(poses, usedWords);
            if (pose) prompt += pose + " ";
        }
        
        // Add environment
        if (Math.random() > 0.7) {
            const environments = this.catWords.environments || [];
            const env = this.getRandomUnique(environments, usedWords);
            if (env) prompt += "in " + env + " ";
        }
        
        // Add style
        if (Math.random() > 0.8) {
            const styles = this.catWords.styles || [];
            const style = this.getRandomUnique(styles, usedWords);
            if (style) prompt += ", " + style + " style";
        }
        
        return prompt.trim();
    }
    
    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    getRandomUnique(array, usedSet) {
        const available = array.filter(item => !usedSet.has(item));
        if (available.length === 0) return null;
        
        const selected = this.getRandomItem(available);
        usedSet.add(selected);
        return selected;
    }
    
    async handleNext() {
        if (this.currentIndex < this.catHistory.length - 1) {
            // Navigate to existing cat
            this.currentIndex++;
            this.displayCat(this.catHistory[this.currentIndex]);
        } else {
            // Generate new cat
            await this.generateNextCat();
        }
        this.updateControls();
    }
    
    handleBack() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCat(this.catHistory[this.currentIndex]);
            this.updateControls();
        }
    }
    
    async generateNextCat() {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.showLoading();
        
        try {
            const prompt = this.generateRandomPrompt();
            const name = this.generateUniqueName();
            const soundId = Math.floor(Math.random() * 10); // Assign random sound ID 0-9
            
            console.log('Generating kitten with name:', name, 'sound ID:', soundId, 'prompt:', prompt);
            
            const result = await websim.imageGen({
                prompt: prompt + ", high quality, detailed, adorable, photorealistic",
                aspect_ratio: "1:1"
            });
            
            const catData = {
                name: name,
                url: result.url,
                prompt: prompt,
                timestamp: Date.now(),
                soundId: soundId // Add sound ID to cat data
            };
            
            this.catHistory.push(catData);
            this.currentIndex = this.catHistory.length - 1;
            this.saveToStorage();
            
            this.displayCat(catData);
            this.updateControls();
            
        } catch (error) {
            console.error('Error generating kitten:', error);
            alert('Failed to generate kitten. Please try again!');
        } finally {
            this.isGenerating = false;
            this.hideLoading();
        }
    }
    
    displayCat(catData) {
        this.catName.textContent = catData.name;
        this.catImage.src = catData.url;
        this.catPrompt.textContent = catData.prompt;
        this.catImage.classList.add('fade-in');
        
        // Add sound ID as data attribute for tap functionality
        this.catImage.dataset.soundId = catData.soundId || 0;
        
        // Remove animation class after animation completes
        setTimeout(() => {
            this.catImage.classList.remove('fade-in');
        }, 500);
    }
    
    updateControls() {
        this.backBtn.disabled = this.currentIndex <= 0;
        this.currentIndexEl.textContent = this.currentIndex + 1;
        this.totalCatsEl.textContent = this.catHistory.length;
        
        // Update next button text
        if (this.currentIndex < this.catHistory.length - 1) {
            this.nextBtn.innerHTML = 'Next <span>→</span>';
        } else {
            this.nextBtn.innerHTML = 'Generate <span>✨</span>';
        }
    }
    
    async downloadCurrentCat() {
        if (!this.catHistory[this.currentIndex]) return;
        
        try {
            const catData = this.catHistory[this.currentIndex];
            const response = await fetch(catData.url);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${catData.name}-kitten-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log('Kitten downloaded successfully');
        } catch (error) {
            console.error('Error downloading kitten:', error);
            alert('Failed to download kitten. Please try again!');
        }
    }
    
    showLoading() {
        this.loading.classList.remove('hidden');
        this.nextBtn.disabled = true;
    }
    
    hideLoading() {
        this.loading.classList.add('hidden');
        this.nextBtn.disabled = false;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const generator = new KittenGenerator();
    
    // Add tap event listener to cat image for sound
    document.addEventListener('click', (e) => {
        if (e.target.id === 'cat-image') {
            const soundId = parseInt(e.target.dataset.soundId || '0');
            generator.playCatSound(soundId);
        }
    });
});