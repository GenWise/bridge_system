// Uma + PS Bridge System - Interactive Reference
class BridgeSystem {
    constructor() {
        this.isEditMode = false;
        this.currentSection = '1m-opening';
        this.levelBActive = false;
        this.navigationStack = []; // Track navigation history for breadcrumbs
        this.data = {
            sections: {},
            definitions: {},
            sequences: {}
        };

        this.init();
        this.loadSampleData();
    }

    init() {
        this.bindEvents();
        this.setupKeyboardShortcuts();
        // Initialize navigation state
        this.updateLevelANavigation();
        this.loadSection(this.currentSection);
    }

    bindEvents() {
        // Edit mode toggle
        document.getElementById('edit-toggle').addEventListener('click', () => {
            this.toggleEditMode();
        });

        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            const query = document.getElementById('search-input').value;
            this.handleSearch(query);
        });

        // TOC navigation
        document.querySelectorAll('.toc-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.loadSection(section);
            });
        });

        // Panel collapse/expand
        document.querySelectorAll('.collapse-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.closest('.panel');
                this.togglePanel(panel);
            });
        });

        // Close overlay buttons
        document.getElementById('level-a-close')?.addEventListener('click', () => {
            this.clearLevelA();
        });

        document.getElementById('level-b-close')?.addEventListener('click', () => {
            this.closeLevelB();
        });

        document.getElementById('definitions-close')?.addEventListener('click', () => {
            this.closeDefinitions();
        });

        // Back button event listeners
        document.getElementById('level-a-back')?.addEventListener('click', () => {
            this.goBackFromLevelA();
        });

        document.getElementById('level-b-back')?.addEventListener('click', () => {
            this.goBackFromLevelB();
        });

        // Floating overlay click to close definitions
        document.getElementById('floating-overlay')?.addEventListener('click', () => {
            this.closeDefinitions();
        });

        // Edit toolbar buttons
        document.getElementById('add-section')?.addEventListener('click', () => {
            this.openEditModal('section');
        });

        document.getElementById('add-definition')?.addEventListener('click', () => {
            this.openEditModal('definition');
        });

        document.getElementById('import-data')?.addEventListener('click', () => {
            this.importData();
        });

        document.getElementById('export-data')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('save-changes')?.addEventListener('click', () => {
            this.saveChanges();
        });

        // Modal events
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('save-content')?.addEventListener('click', () => {
            this.saveModalContent();
        });

        document.getElementById('cancel-edit')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Bridge notation buttons
        document.querySelectorAll('.notation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.insertNotation(e.target.dataset.suit || e.target.dataset.notation);
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'e':
                        e.preventDefault();
                        this.toggleEditMode();
                        break;
                    case 's':
                        e.preventDefault();
                        if (this.isEditMode) {
                            this.saveChanges();
                        }
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('search-input').focus();
                        break;
                }
            }

            if (e.key === 'Escape') {
                if (document.getElementById('edit-modal').style.display !== 'none') {
                    this.closeModal();
                } else if (document.getElementById('definitions-panel').style.display !== 'none') {
                    this.closeDefinitions();
                } else if (this.levelBActive) {
                    this.goBackFromLevelB();
                } else if (this.navigationStack.length > 0) {
                    this.goBackFromLevelA();
                } else if (this.isEditMode) {
                    this.toggleEditMode();
                }
            }
        });
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        const editBtn = document.getElementById('edit-toggle');
        const editOverlay = document.getElementById('edit-overlay');

        if (this.isEditMode) {
            editBtn.textContent = 'Exit Edit';
            editBtn.classList.add('active');
            editOverlay.style.display = 'block';
            this.enableInlineEditing();
        } else {
            editBtn.textContent = 'Edit Mode';
            editBtn.classList.remove('active');
            editOverlay.style.display = 'none';
            this.disableInlineEditing();
        }
    }

    enableInlineEditing() {
        document.querySelectorAll('.panel-content').forEach(content => {
            content.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        });
    }

    disableInlineEditing() {
        document.querySelectorAll('.panel-content').forEach(content => {
            content.removeEventListener('dblclick', this.handleDoubleClick.bind(this));
        });
    }

    handleDoubleClick(e) {
        if (!this.isEditMode) return;

        const element = e.target.closest('.editable');
        if (element) {
            this.editInline(element);
        }
    }

    loadSection(sectionId) {
        this.currentSection = sectionId;

        // Update active TOC item
        document.querySelectorAll('.toc-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');

        // Update navigation stack - Level A is first level after TOC
        this.navigationStack = [{
            level: 'toc',
            title: 'TOC'
        }, {
            level: 'level-a',
            sectionId: sectionId,
            title: this.data.sections[sectionId]?.title || sectionId
        }];

        // Update breadcrumb and back button for Level A
        this.updateLevelANavigation();

        // Close Level B if it was open
        if (this.levelBActive) {
            this.closeLevelB();
        }

        // Load section data
        const sectionData = this.data.sections[sectionId];
        if (sectionData) {
            this.displaySection(sectionData);
        } else {
            this.displayLoadingMessage();
        }
    }

    displaySection(sectionData) {
        const levelAContent = document.getElementById('level-a-content');
        const title = document.getElementById('level-a-title');

        // Set title with smart truncation for better readability
        const fullTitle = sectionData.title || 'Bridge System Content';
        const smartTitle = this.getSmartTitle(fullTitle);
        title.textContent = smartTitle;
        title.title = fullTitle; // Tooltip shows full title on hover

        // Generate HTML from structured data
        const htmlContent = this.generateSectionHTML(sectionData);
        levelAContent.innerHTML = htmlContent;

        // Bind click events to colored text
        this.bindColoredTextEvents(levelAContent);

        // Add tooltips to truncated elements
        this.addTooltips(levelAContent);
    }

    truncateTitle(title, maxLength) {
        if (title.length <= maxLength) return title;

        // Smart truncation - try to break at word boundaries
        const truncated = title.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');

        if (lastSpace > maxLength * 0.7) {
            return truncated.substring(0, lastSpace) + '...';
        }

        return truncated + '...';
    }

    getSmartTitle(fullTitle, context = 'general') {
        // Part 1/Part 2 architecture to reduce repetition
        if (context === 'breadcrumb' && this.navigationStack.length >= 2) {
            const parentTitle = this.navigationStack[0]?.title || '';

            // If current title contains parent title, create Part 1/Part 2 structure
            if (parentTitle && fullTitle.includes(parentTitle.split(' ')[0])) {
                return this.createPartTitle(fullTitle, parentTitle);
            }
        }

        // Extract the key part of the title for display
        // Pattern: "1♣ Opening: longer clubs or..." → "1♣ Opening"
        if (fullTitle.includes(': ')) {
            const mainPart = fullTitle.split(': ')[0];
            return mainPart;
        }

        // For other titles, use standard truncation
        return this.truncateTitle(fullTitle, 40);
    }

    createPartTitle(fullTitle, parentTitle) {
        // Create Part 1/Part 2 structure to reduce repetition
        const baseTerm = parentTitle.split(' ')[0]; // e.g., "1♣" from "1♣ Opening"

        if (fullTitle.toLowerCase().includes('rebid')) {
            return `${baseTerm} Part 2`; // Rebids are Part 2
        } else if (fullTitle.toLowerCase().includes('response')) {
            return `${baseTerm} Part 1`; // Responses are Part 1
        } else if (fullTitle.toLowerCase().includes('continuation')) {
            return `${baseTerm} Part 2`; // Continuations are Part 2
        }

        // Default: extract meaningful part
        return this.truncateTitle(fullTitle, 35);
    }

    generateSectionHTML(sectionData) {
        const content = sectionData.content;
        if (!content) return '<div class="loading-message">No content available</div>';

        let html = [];

        // Add subtitle if available
        if (sectionData.subtitle) {
            html.push(`<div class="section-subtitle">${sectionData.subtitle}</div>`);
        }

        // Add overview
        if (content.overview) {
            html.push(`<div class="overview">${this.convertBridgeNotation(content.overview)}</div>`);
        }

        // Process sections (new structure)
        if (content.sections) {
            for (const section of content.sections) {
                html.push(`<h4>${section.title}</h4>`);

                if (section.type === 'auction_table' && section.data) {
                    html.push(this.generateAuctionTable(section.data));
                } else if ((section.type === 'table' || section.type === 'hierarchical_table') && section.data) {
                    const isHierarchical = section.type === 'hierarchical_table';
                    html.push(this.generateBridgeTable(section.data, isHierarchical));
                }
            }
        }

        return html.join('\n');
    }

    formatContent(content) {
        if (!content) return '<div class="loading-message">No content available</div>';

        // Convert bridge notation
        content = this.convertBridgeNotation(content);

        // Add appropriate classes for colored text
        content = content.replace(/(\w+\s+[Rr]ebids?)/g, '<span class="red-text">$1</span>');
        content = content.replace(/(Walsh|Artificial reverse|Natural reverse|Super splinter|Reverse Flannery)/gi, '<span class="green-text">$1</span>');
        content = content.replace(/(\d+[CDHSNT]+)/g, '<span class="blue-text">$1</span>');

        return content;
    }

    generateBridgeTable(tableData, isHierarchical = false) {
        // Bridge table rendering with color validation: opener #dbeafe, responder #d1fae5
        let html = ['<table class="bridge-table">'];

        if (isHierarchical) {
            // Use hierarchical rendering
            html.push(...this.renderHierarchicalRows(tableData));
        } else {
            // Use original flat rendering
            for (const row of tableData) {
                const cellClass = row.cellType === 'opener' ? 'opener-cell' : 'responder-cell';

                html.push('<tr>');
                html.push(`<td class="bid-cell ${cellClass}">${this.convertBridgeNotation(row.bid)}</td>`);

                let description = row.description;

                // Process links
                if (row.links) {
                    for (const link of row.links) {
                        const colorClass = link.type === 'green' ? 'green-text' :
                                         link.type === 'red' ? 'red-text' : 'blue-text';
                        const dataAttr = link.type === 'green' ? `data-definition="${link.target}"` :
                                       `data-reference="${link.target}"`;

                        description = description.replace(
                            new RegExp(this.escapeRegExp(link.text), 'g'),
                            `<span class="${colorClass}" ${dataAttr}>${link.text}</span>`
                        );
                    }
                }

                description = this.convertBridgeNotation(description);
                html.push(`<td class="description-cell ${cellClass}">${description}</td>`);
                html.push('</tr>');
            }
        }

        html.push('</table>');
        return html.join('\n');
    }

    renderHierarchicalRows(rows) {
        let html = [];

        for (const row of rows) {
            html.push(...this.renderSingleHierarchicalRow(row));
        }

        return html;
    }

    renderSingleHierarchicalRow(row) {
        let html = [];

        // Get cell class and indentation - responder #d1fae5, opener #dbeafe
        const cellClass = row.cellType === 'opener' ? 'opener-cell' : 'responder-cell';
        const level = row.level || 1;
        const indentClass = level > 1 ? `indent-${level - 1}` : '';

        // Render current row
        html.push('<tr>');
        html.push(`<td class="bid-cell ${cellClass} ${indentClass}">${this.convertBridgeNotation(row.bid)}</td>`);

        let description = row.description;

        // Process links
        if (row.links) {
            for (const link of row.links) {
                const colorClass = link.type === 'green' ? 'green-text' :
                                 link.type === 'red' ? 'red-text' : 'blue-text';
                const dataAttr = link.type === 'green' ? `data-definition="${link.target}"` :
                               `data-reference="${link.target}"`;

                description = description.replace(
                    new RegExp(this.escapeRegExp(link.text), 'g'),
                    `<span class="${colorClass}" ${dataAttr}>${link.text}</span>`
                );
            }
        }

        description = this.convertBridgeNotation(description);

        // Add tooltip if description is long
        const tooltipAttr = row.description && row.description.length > 50 ?
            `title="${this.escapeHtml(row.description)}"` : '';
        html.push(`<td class="description-cell ${cellClass} ${indentClass} truncated-text" ${tooltipAttr}>${description}</td>`);
        html.push('</tr>');

        // Render children recursively
        if (row.children && row.children.length > 0) {
            for (const child of row.children) {
                html.push(...this.renderSingleHierarchicalRow(child));
            }
        }

        return html;
    }

    generateAuctionTable(auctionData) {
        // Multi-column auction table rendering - Opener cells BLUE (#dbeafe), Responder cells GREEN (#d1fae5)
        let html = ['<table class="auction-table">'];

        // Add colgroup to define column widths - flexible for varying column counts
        const maxCols = Math.max(...auctionData.rows.map(row => row.bids.length));
        html.push('<colgroup>');
        for (let i = 0; i < maxCols - 1; i++) {
            html.push('<col style="width:50px">'); // Bid/empty columns
        }
        html.push('<col>'); // Description column - takes remaining space
        html.push('</colgroup>');

        // Add header row if present
        if (auctionData.header) {
            html.push('<tr class="auction-header">');
            html.push(`<td colspan="10" class="auction-title">${this.convertBridgeNotation(auctionData.header)}</td>`);
            html.push('</tr>');
        }

        // Process auction rows
        for (const row of auctionData.rows) {
            html.push('<tr class="auction-row">');

            for (const bid of row.bids) {
                let cellClass = '';
                let cellContent = bid.text;

                // Determine cell styling - Opener BLUE, Responder GREEN
                switch (bid.type) {
                    case 'opener':
                        cellClass = 'opener-cell'; // Blue background #dbeafe
                        break;
                    case 'responder':
                        cellClass = 'responder-cell'; // Green background #d1fae5
                        break;
                    case 'description':
                        cellClass = 'description-cell';
                        break;
                    case 'empty':
                        cellClass = 'empty-cell';
                        cellContent = '';
                        break;
                }

                // Convert bridge notation and apply cell styling
                const convertedContent = this.convertBridgeNotation(cellContent);
                html.push(`<td class="auction-cell ${cellClass}">${convertedContent}</td>`);
            }

            html.push('</tr>');
        }

        html.push('</table>');
        return html.join('\n');
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    addTooltips(container) {
        // Add tooltips to all elements with title attributes
        const elementsWithTitles = container.querySelectorAll('[title]');
        elementsWithTitles.forEach(element => {
            element.classList.add('has-tooltip');
        });

        // Add tooltips to truncated text elements
        const truncatedElements = container.querySelectorAll('.truncated-text');
        truncatedElements.forEach(element => {
            if (element.scrollWidth > element.clientWidth) {
                element.title = element.textContent.trim();
                element.classList.add('has-tooltip');
            }
        });

        // Add tooltips to table cells with ellipsis
        const cellsWithEllipsis = container.querySelectorAll('.description-cell');
        cellsWithEllipsis.forEach(cell => {
            if (cell.scrollWidth > cell.clientWidth) {
                const textContent = cell.textContent.trim();
                if (textContent && !cell.title) {
                    cell.title = textContent;
                    cell.classList.add('has-tooltip');
                }
            }
        });

        // Add tooltips to auction table description cells
        const auctionDescCells = container.querySelectorAll('.auction-table .description-cell');
        auctionDescCells.forEach(cell => {
            const textContent = cell.textContent.trim();
            if (textContent && textContent.length > 30 && !cell.title) {
                cell.title = textContent;
                cell.classList.add('has-tooltip');
            }
        });

        // Add tooltips to definition text elements
        const definitionElements = container.querySelectorAll('.definition-text');
        definitionElements.forEach(element => {
            if (element.scrollWidth > element.clientWidth) {
                element.title = element.textContent.trim();
                element.classList.add('has-tooltip');
            }
        });
    }

    addTOCTooltips() {
        document.querySelectorAll('.toc-item').forEach(item => {
            const sectionId = item.dataset.section;
            const sectionData = this.data.sections[sectionId];

            if (sectionData && sectionData.subtitle) {
                const fullDescription = `${sectionData.title}\n\n${sectionData.subtitle}`;
                item.title = fullDescription;
                item.classList.add('has-tooltip');
            }
        });
    }

    convertBridgeNotation(text) {
        // Convert suit symbols - be more specific to avoid over-matching
        text = text.replace(/\b([1-7]?)c\b/g, '$1<span class="suit clubs">♣</span>');
        text = text.replace(/\b([1-7]?)d\b/g, '$1<span class="suit diamonds">♦</span>');
        text = text.replace(/\b([1-7]?)h\b/g, '$1<span class="suit hearts">♥</span>');
        text = text.replace(/\b([1-7]?)s\b/g, '$1<span class="suit spades">♠</span>');

        // Convert NT
        text = text.replace(/\b([1-7]?)n\b/gi, '$1NT');

        return text;
    }

    bindColoredTextEvents(container) {
        // Red text clicks - Show in Level B
        container.querySelectorAll('.red-text').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const reference = e.target.dataset.reference;
                const text = e.target.textContent;

                if (reference) {
                    this.loadInLevelB(reference, 'sequence');
                } else {
                    this.loadContentInLevelB(text, 'red');
                }
            });
        });

        // Green text clicks - Floating definitions
        container.querySelectorAll('.green-text').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const definitionId = e.target.dataset.definition;
                const text = e.target.textContent;

                if (definitionId) {
                    this.showFloatingDefinition(definitionId);
                } else {
                    this.showFloatingDefinitionByText(text);
                }
            });
        });

        // Blue text clicks - Load in Level B or shift content if already in Level B
        container.querySelectorAll('.blue-text').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const reference = e.target.dataset.reference;
                const text = e.target.textContent;
                const isInLevelB = container.closest('#level-b-panel');

                if (isInLevelB) {
                    // If click is in Level B, shift content B→A and load new in B
                    this.shiftContentBToA();
                }

                if (reference) {
                    this.loadInLevelB(reference, 'sequence');
                } else {
                    this.loadContentInLevelB(text, 'blue');
                }
            });
        });
    }

    // New 3-tile layout methods
    loadInLevelB(contentId, contentType) {
        if (contentType === 'sequence') {
            const sequence = this.data.sequences[contentId];
            if (!sequence) {
                this.showMissingContentInLevelB('sequence', contentId);
                return;
            }

            const html = this.generateSequenceHTML(sequence);
            this.showLevelB(sequence.title, html);
        }
    }

    loadContentInLevelB(text, sourceColor) {
        const content = this.findRelatedContent(text, 'level2');
        this.showLevelB(text, content);
    }

    showLevelB(title, content) {
        // Activate Level B
        this.levelBActive = true;
        const mainContainer = document.querySelector('.main-container');
        const levelBPanel = document.getElementById('level-b-panel');
        const levelBTitle = document.getElementById('level-b-title');
        const levelBContent = document.getElementById('level-b-content');
        const closeBtn = document.getElementById('level-b-close');

        // Add Level B to navigation stack
        this.navigationStack.push({
            level: 'level-b',
            title: title,
            content: content
        });

        // Update breadcrumb for Level B
        this.updateLevelBNavigation();

        // Update grid layout
        mainContainer.classList.add('level-b-active');

        // Show Level B panel
        levelBPanel.style.display = 'flex';

        // Set title with tooltip
        const shortTitle = this.getSmartTitle(title);
        levelBTitle.textContent = shortTitle;
        levelBTitle.title = title; // Tooltip shows full title on hover

        levelBContent.innerHTML = content;
        closeBtn.style.display = 'block';

        // Bind events for any nested clickable content
        this.bindColoredTextEvents(levelBContent);

        // Add tooltips to content
        this.addTooltips(levelBContent);

        // Smooth transition
        setTimeout(() => {
            levelBPanel.style.opacity = '1';
        }, 10);
    }

    closeLevelB() {
        this.levelBActive = false;
        const mainContainer = document.querySelector('.main-container');
        const levelBPanel = document.getElementById('level-b-panel');
        const closeBtn = document.getElementById('level-b-close');

        // Remove Level B from navigation stack
        if (this.navigationStack.length > 0 && this.navigationStack[this.navigationStack.length - 1].level === 'level-b') {
            this.navigationStack.pop();
        }

        // Update Level A navigation after closing Level B
        this.updateLevelANavigation();

        // Update grid layout
        mainContainer.classList.remove('level-b-active');

        // Hide Level B panel
        setTimeout(() => {
            levelBPanel.style.display = 'none';
        }, 300);

        closeBtn.style.display = 'none';
    }

    shiftContentBToA() {
        // Move Level B content to Level A
        const levelATitle = document.getElementById('level-a-title');
        const levelAContent = document.getElementById('level-a-content');
        const levelBTitle = document.getElementById('level-b-title');
        const levelBContent = document.getElementById('level-b-content');

        levelATitle.textContent = levelBTitle.textContent;
        levelAContent.innerHTML = levelBContent.innerHTML;

        // Bind events to new Level A content
        this.bindColoredTextEvents(levelAContent);
    }

    generateSequenceHTML(sequence) {
        let html = [`<h4>${sequence.title}</h4>`];

        if (sequence.auction) {
            html.push('<div class="auction-sequence">');
            sequence.auction.forEach((bid, index) => {
                const bidClass = index % 2 === 0 ? 'opener-bid' : 'responder-bid';
                html.push(`<span class="bid ${bidClass}">${this.convertBridgeNotation(bid)}</span>`);
            });
            html.push('</div>');
        }

        // Handle new content structure
        if (sequence.content && sequence.content.sections) {
            for (const section of sequence.content.sections) {
                html.push(`<h5>${section.title}</h5>`);

                if (section.type === 'auction_table' && section.data) {
                    html.push(this.generateAuctionTable(section.data));
                } else if ((section.type === 'table' || section.type === 'hierarchical_table') && section.data) {
                    const isHierarchical = section.type === 'hierarchical_table';
                    html.push(this.generateBridgeTable(section.data, isHierarchical));
                }
            }
        }

        // Fallback for old structure
        if (sequence.categories) {
            for (const [categoryId, category] of Object.entries(sequence.categories)) {
                html.push(`<h5>${category.title}</h5>`);

                if (category.bids) {
                    html.push('<div class="bid-list">');

                    for (const bid of category.bids) {
                        html.push('<div class="bid-item">');

                        const bidClass = bid.type === 'opener-bid' ? 'opener-bid' : 'responder-bid';
                        html.push(`<div class="bid-header">`);
                        html.push(`<span class="bid ${bidClass}">${this.convertBridgeNotation(bid.bid)}</span>`);

                        if (bid.hcp) {
                            html.push(`<span class="hcp-range">${bid.hcp}</span>`);
                        }

                        html.push('</div>');
                        html.push(`<div class="bid-description">${this.convertBridgeNotation(bid.description)}</div>`);

                        if (bid.shape) {
                            html.push(`<div class="shape-requirement">${bid.shape}</div>`);
                        }

                        html.push('</div>');
                    }

                    html.push('</div>');
                }
            }
        }

        return html.join('\n');
    }

    showFloatingDefinition(definitionId) {
        const definition = this.data.definitions[definitionId];
        if (!definition) {
            this.showMissingFloatingDefinition('definition', definitionId);
            return;
        }

        const html = this.generateDefinitionHTML(definition);
        this.displayFloatingDefinition(html);
    }

    showFloatingDefinitionByText(text) {
        const definition = this.findDefinition(text);
        this.displayFloatingDefinition(definition);
    }

    displayFloatingDefinition(content) {
        const definitionsPanel = document.getElementById('definitions-panel');
        const definitionsContent = document.getElementById('definitions-content');
        const closeBtn = document.getElementById('definitions-close');
        const overlay = document.getElementById('floating-overlay');

        definitionsContent.innerHTML = content;
        closeBtn.style.display = 'block';

        // Add tooltips to definition content
        this.addTooltips(definitionsContent);

        // Show floating panel
        overlay.style.display = 'block';
        definitionsPanel.style.display = 'flex';
    }

    closeDefinitions() {
        const definitionsPanel = document.getElementById('definitions-panel');
        const closeBtn = document.getElementById('definitions-close');
        const overlay = document.getElementById('floating-overlay');

        definitionsPanel.style.display = 'none';
        overlay.style.display = 'none';
        closeBtn.style.display = 'none';
    }

    generateDefinitionHTML(definition) {
        let html = [`<h4>${definition.title}</h4>`];

        if (definition.category) {
            html.push(`<div class="definition-category">${definition.category}</div>`);
        }

        if (definition.definition) {
            html.push(`<p class="definition-text">${this.convertBridgeNotation(definition.definition)}</p>`);
        }

        if (definition.meaning) {
            html.push(`<p class="definition-meaning">${this.convertBridgeNotation(definition.meaning)}</p>`);
        }

        if (definition.details && Array.isArray(definition.details)) {
            html.push('<ul class="definition-details">');
            definition.details.forEach(detail => {
                html.push(`<li>${this.convertBridgeNotation(detail)}</li>`);
            });
            html.push('</ul>');
        }

        if (definition.examples && Array.isArray(definition.examples)) {
            html.push('<ul class="definition-examples">');
            definition.examples.forEach(example => {
                html.push(`<li>${this.convertBridgeNotation(example)}</li>`);
            });
            html.push('</ul>');
        }

        if (definition.algorithm) {
            html.push('<div class="algorithm">');

            for (const [key, value] of Object.entries(definition.algorithm)) {
                if (Array.isArray(value)) {
                    html.push('<ul>');
                    value.forEach(item => {
                        html.push(`<li>${this.convertBridgeNotation(item)}</li>`);
                    });
                    html.push('</ul>');
                } else {
                    html.push(`<div class="algorithm-item">${this.convertBridgeNotation(value)}</div>`);
                }
            }

            html.push('</div>');
        }

        if (definition.notes) {
            html.push(`<div class="definition-notes">${this.convertBridgeNotation(definition.notes)}</div>`);
        }

        return html.join('\n');
    }

    clearLevelA() {
        const levelAContent = document.getElementById('level-a-content');
        const closeBtn = document.getElementById('level-a-close');

        levelAContent.innerHTML = '<div class="welcome-message">Select a section from the Table of Contents to begin exploring the Uma + PS Bridge System.</div>';
        closeBtn.style.display = 'none';
    }

    scrollToPanelIfMobile(panelId) {
        if (window.innerWidth <= 1024) {
            document.getElementById(panelId).scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    showMissingContentInLevelB(type, id) {
        const content = `
            <div class="missing-content">
                <h4>Content Not Available</h4>
                <p>The ${type} "<strong>${id}</strong>" is not yet available in this version.</p>
                <div class="help-actions">
                    <button onclick="document.getElementById('level-b-panel').querySelector('.close-overlay').click();">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
        this.showLevelB(`Missing ${type}`, content);
    }

    showMissingFloatingDefinition(type, id) {
        const content = `
            <div class="missing-content">
                <h4>Content Not Available</h4>
                <p>The ${type} "<strong>${id}</strong>" is not yet available in this version.</p>
                <div class="help-actions">
                    <button onclick="document.getElementById('definitions-close').click();">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
        this.displayFloatingDefinition(content);
    }

    // This method is now handled by showFloatingDefinitionByText
    // Keeping for backward compatibility
    loadDefinition(text) {
        this.showFloatingDefinitionByText(text);
    }

    findRelatedContent(text, type) {
        // This would normally query the database/data structure
        // For now, return sample content based on the clicked text
        const sampleContent = {
            'Opener Rebids': `
                <h4>Opener Rebids over 1♣1♦</h4>
                <div class="bid-sequence">
                    <div class="bid opener-bid">1♣</div>
                    <div class="bid responder-bid">1♦</div>
                    <div class="bid opener-bid">1NT</div>
                    <span class="bid-description">12-14; can have 4M if < 5c</span>
                </div>
                <p>Shows balanced hand with 12-14 HCP. May contain a 4-card major if clubs are shorter than 5 cards.</p>
            `,
            '1c1d1n': `
                <h4>1♣-1♦-1NT Continuation</h4>
                <p><strong>Responder's Options:</strong></p>
                <ul>
                    <li><span class="bid responder-bid">Pass</span> - To play</li>
                    <li><span class="bid responder-bid">2♣</span> - Puppet to 2♦</li>
                    <li><span class="bid responder-bid">2♦</span> - Game forcing</li>
                    <li><span class="bid responder-bid">2M</span> - 6♦, 4M, weak</li>
                </ul>
            `
        };

        return sampleContent[text] || `
            <h4>${text}</h4>
            <p>Detailed explanation of <strong>${text}</strong> would appear here.</p>
            <p>This content would be loaded from the database based on the clicked reference.</p>
        `;
    }

    findDefinition(text) {
        const definitions = {
            'Walsh': `
                <h4>Walsh Convention</h4>
                <p><strong>Definition:</strong> Holding 5+♦ and 4M; bid 1♦ (instead of 1M) when:</p>
                <ul>
                    <li>Weak hands (5-7) with 5/6♦ and 4M - don't see game opposite 18/19; looking at signoff in ♦</li>
                    <li>Strong hands, 15+ HCP - subsequently 2♦ (game forcing) shows 4-5 and 2NT shows 4-6</li>
                    <li>7+♦, any strength</li>
                </ul>
            `,
            'Artificial reverse': `
                <h4>Artificial Reverse (Non-vulnerable only)</h4>
                <p><strong>Definition:</strong> 1x-1y-2z where z = cheapest 2-bid</p>
                <p>Shows single suit x or 4-5 in x and z; forcing for one round</p>
                <p><strong>Responses:</strong></p>
                <ul>
                    <li>2y (if available) = natural, non-forcing</li>
                    <li>Ask bid = 2♠ or 2NT whichever is cheaper</li>
                </ul>
            `,
            'Natural reverse': `
                <h4>Natural Reverse</h4>
                <p><strong>Definition:</strong> 1x-1y-2z where z is NOT the cheapest 2-bid</p>
                <p>Shows 18+ HCP, forcing for one round, game forcing if jump shift</p>
                <p>Promises longer first suit than second suit.</p>
            `
        };

        return definitions[text] || `
            <h4>${text}</h4>
            <p>Definition for <strong>${text}</strong> would appear here.</p>
            <p>This would be loaded from the definitions database.</p>
        `;
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.clearSearchResults();
            return;
        }

        // Simple search implementation
        // In a full implementation, this would search through all content
        const results = this.searchContent(query);
        this.displaySearchResults(results);
    }

    searchContent(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        // Search through sections
        Object.entries(this.data.sections).forEach(([id, section]) => {
            if (section.title.toLowerCase().includes(lowerQuery) ||
                section.content.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'section',
                    id: id,
                    title: section.title,
                    snippet: this.getSnippet(section.content, query)
                });
            }
        });

        return results;
    }

    getSnippet(content, query, maxLength = 100) {
        const index = content.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return content.substring(0, maxLength) + '...';

        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + query.length + 50);

        return (start > 0 ? '...' : '') +
               content.substring(start, end) +
               (end < content.length ? '...' : '');
    }

    displaySearchResults(results) {
        // For now, just highlight the first result
        if (results.length > 0) {
            const firstResult = results[0];
            if (firstResult.type === 'section') {
                this.loadSection(firstResult.id);
            }
        }
    }

    clearSearchResults() {
        // Clear any search highlighting
    }

    togglePanel(panel) {
        panel.classList.toggle('collapsed');
        const btn = panel.querySelector('.collapse-btn');
        btn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
    }

    // Updated clearPanel method for backward compatibility
    clearPanel(panel) {
        if (panel.classList.contains('definitions-panel')) {
            this.closeDefinitions();
        } else if (panel.id === 'level-a-panel') {
            this.clearLevelA();
        } else if (panel.id === 'level-b-panel') {
            this.closeLevelB();
        }
    }

    openEditModal(type) {
        const modal = document.getElementById('edit-modal');
        const title = document.getElementById('modal-title');

        title.textContent = type === 'section' ? 'Add New Section' : 'Add New Definition';
        modal.style.display = 'flex';

        // Clear previous content
        document.getElementById('content-title').value = '';
        document.getElementById('content-editor').innerHTML = '';
    }

    closeModal() {
        document.getElementById('edit-modal').style.display = 'none';
    }

    saveModalContent() {
        const title = document.getElementById('content-title').value;
        const content = document.getElementById('content-editor').innerHTML;

        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        // Save the content (this would normally save to database)
        console.log('Saving content:', { title, content });

        this.closeModal();
        alert('Content saved successfully!');
    }

    insertNotation(notation) {
        const editor = document.getElementById('content-editor');
        const selection = window.getSelection();

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.className = `suit ${notation.toLowerCase()}`;
            span.textContent = notation;

            range.deleteContents();
            range.insertNode(span);

            // Move cursor after inserted notation
            range.setStartAfter(span);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.data = { ...this.data, ...data };
                        this.loadSection(this.currentSection);
                        alert('Data imported successfully!');
                    } catch (error) {
                        alert('Error importing data: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'uma-ps-system.json';
        link.click();
    }

    showNotification(message, type = 'info', title = null) {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.error('Notification container not found');
            return;
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        // Get icon based on type
        const icons = {
            'error': '!',
            'warning': '⚠',
            'success': '✓',
            'info': 'i'
        };
        const icon = icons[type] || 'i';

        // Build notification content
        let titleHtml = title ? `<div class="notification-title">${title}</div>` : '';

        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                ${titleHtml}
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">×</button>
            <div class="notification-progress"></div>
        `;

        // Add to container
        container.appendChild(notification);

        // Trigger show animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto-dismiss after 5 seconds
        const autoRemove = setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);

        // Manual dismiss
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.onclick = () => {
            clearTimeout(autoRemove);
            this.removeNotification(notification);
        };
    }

    removeNotification(notification) {
        if (!notification || !notification.parentNode) return;

        notification.classList.remove('show');
        notification.classList.add('hide');

        // Remove element after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }

    showMissingContent(type, id, panelId) {
        const panel = document.getElementById(panelId.replace('-panel', '-content'));
        const closeBtn = document.getElementById(panelId.replace('-panel', '-close'));

        panel.innerHTML = `
            <div class="missing-content">
                <h4>Content Not Available</h4>
                <p>The ${type} "<strong>${id}</strong>" is not yet available in this version.</p>
                <div class="help-actions">
                    <button onclick="this.closest('.missing-content').parentElement.innerHTML = '<div class=\"placeholder-text\">Content will load here when available.</div>'; document.getElementById('${panelId.replace('-panel', '-close')}').style.display = 'none';">
                        Dismiss
                    </button>
                </div>
            </div>
        `;

        closeBtn.style.display = 'block';
        this.scrollToPanelIfMobile(panelId);
    }

    saveChanges() {
        // This would normally save to a database
        console.log('Saving changes to database...');
        alert('Changes saved successfully!');
    }

    displayLoadingMessage() {
        const levelAContent = document.getElementById('level-a-content');
        levelAContent.innerHTML = '<div class="loading-message">Loading content...</div>';
    }

    // Back navigation methods
    goBackFromLevelB() {
        this.closeLevelB();
    }

    goBackFromLevelA() {
        // Return to welcome state instead of showing loading screen
        const levelAContent = document.getElementById('level-a-content');
        const levelATitle = document.getElementById('level-a-title');
        const closeBtn = document.getElementById('level-a-close');

        // Show welcome message instead of loading message
        levelAContent.innerHTML = '<div class="welcome-message">Select a section from the Table of Contents to begin exploring the Uma + PS Bridge System.</div>';
        levelATitle.textContent = 'Uma + PS Bridge System';
        closeBtn.style.display = 'none';

        // Reset navigation state
        this.navigationStack = [];
        this.currentSection = '';
        this.updateLevelANavigation();

        // Remove active state from all TOC items
        document.querySelectorAll('.toc-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    // Navigation update methods
    updateLevelANavigation() {
        const backBtn = document.getElementById('level-a-back');
        const breadcrumbCurrent = document.getElementById('level-a-breadcrumb-current');

        if (this.navigationStack.length > 1 && this.navigationStack[1].level === 'level-a') {
            // Show back button and update breadcrumb with smart title
            backBtn.style.display = 'block';
            const fullTitle = this.navigationStack[1].title;
            const smartTitle = this.getSmartTitle(fullTitle, 'breadcrumb');
            breadcrumbCurrent.textContent = smartTitle;
            breadcrumbCurrent.title = fullTitle; // Tooltip
        } else {
            // Hide back button when no content is loaded
            backBtn.style.display = 'none';
            breadcrumbCurrent.textContent = 'Select from contents';
            breadcrumbCurrent.title = '';
        }
    }

    updateLevelBNavigation() {
        const breadcrumbA = document.getElementById('level-b-breadcrumb-a');
        const breadcrumbCurrent = document.getElementById('level-b-breadcrumb-current');

        if (this.navigationStack.length >= 2) {
            const fullTitleA = this.navigationStack[1].title;
            const smartTitleA = this.getSmartTitle(fullTitleA, 'breadcrumb');
            breadcrumbA.textContent = smartTitleA;
            breadcrumbA.title = fullTitleA; // Tooltip
        }

        if (this.navigationStack.length >= 3) {
            const fullTitleB = this.navigationStack[2].title;
            const smartTitleB = this.getSmartTitle(fullTitleB, 'breadcrumb');
            breadcrumbCurrent.textContent = smartTitleB;
            breadcrumbCurrent.title = fullTitleB; // Tooltip
        }
    }

    async loadSampleData() {
        try {
            const response = await fetch('data.json');
            if (response.ok) {
                this.data = await response.json();
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.warn('Primary data loading failed:', error.message);

            // Enhanced fallback with user notification
            this.data = await this.getFallbackData();
            this.showNotification(
                'Loading from embedded data due to network issues. Some content may be limited.',
                'warning'
            );
        }

        this.loadSection('1m-opening');

        // Add tooltips to TOC items after data is loaded
        this.addTOCTooltips();
    }

    async getFallbackData() {
        return {
            metadata: {
                title: "Uma + PS System",
                version: "1.0",
                lastUpdate: "Sep 2025"
            },
            sections: {
                '1m-opening': {
                    id: '1m-opening',
                    title: '1♣ Opening: longer clubs or 4-4 in ♣ and ♦; denies 5M unless strong hands with 6+♣ and 5M',
                    subtitle: 'longer clubs or 4-4 in c and d; denies 5M unless strong hands with 6+c and 5M',
                    content: {
                        overview: '1 Club Opening: longer clubs or 4-4 in c and d; denies 5M unless strong hands with 6+c and 5M',
                        subsections: {
                            'non-support-responses': {
                                title: 'Non support showing responses',
                                responses: [
                                    {
                                        bid: '1c-1d',
                                        description: 'Walsh: 5+, 7+d any/4+d, no 4M; OR 5d4M, 4-5/15+ or 6d4M, 4-8/15+',
                                        reference: 'opener-rebids-1c1d',
                                        type: 'red-link',
                                        definitions: ['walsh']
                                    },
                                    {
                                        bid: '1c-1M',
                                        description: '5+, 4+M, up the line',
                                        reference: 'opener-rebids-1cM',
                                        type: 'red-link'
                                    },
                                    {
                                        bid: '1c-2h',
                                        description: 'Reverse Flannery: 5s4h/55/65, inv (Gd 8 – bad 11)',
                                        reference: 'opener-rebids-1c2h',
                                        type: 'red-link',
                                        definitions: ['reverse-flannery']
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            sequences: {
                'opener-rebids-1c1d': {
                    id: 'opener-rebids-1c1d',
                    title: 'Opener rebids over 1c-1d',
                    auction: ['1c', '1d'],
                    player: 'opener',
                    categories: {
                        balanced: {
                            title: 'Rebids to show balanced hands',
                            bids: [
                                {
                                    bid: '1c-1d-1n',
                                    description: '12-14; can have 4M if < 5c',
                                    hcp: '12-14',
                                    shape: 'balanced',
                                    type: 'opener-bid'
                                }
                            ]
                        }
                    }
                }
            },
            definitions: {
                walsh: {
                    id: 'walsh',
                    title: 'Walsh Convention',
                    definition: 'Holding 5+d and 4M; bid 1d (instead of 1M) when:',
                    details: [
                        'Weak hands (5-7) with 5/6 d and 4M',
                        'Strong hands, 15+ hcp',
                        '7+ d, any strength'
                    ]
                },
                'reverse-flannery': {
                    id: 'reverse-flannery',
                    title: 'Reverse Flannery',
                    definition: '2♥ response to 1♣ opening',
                    meaning: '5♠4♥/55/65, invitational (good 8 - bad 11)'
                }
            }
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bridgeSystem = new BridgeSystem();
});