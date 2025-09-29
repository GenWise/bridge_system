# Uma + PS Bridge System Interactive Reference

An interactive web-based reference system for the Uma + PS bridge bidding system with editing capabilities.

## Current Status (Sep 25, 2025)
✅ **Core functionality complete with exact PDF replication**
- Thin TOC column layout (200px left)
- Exact table structure with blue/green cell backgrounds
- Color-coded links working (green→definitions, red→sequences)
- All content extracted exactly from PDFs (no interpretations)

## Features

### View Mode
- **Thin TOC + 3 Panel Layout**: Thin left TOC, main content top-right, definitions bottom-left, level-2 bottom-right
- **Color-Coded Links**:
  - 🔴 Red text → Level 2 content (detailed sequences)
  - 🟢 Green text → Definitions and concepts
  - 🔵 Blue text → Specific bid sequences
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Search Functionality**: Find bids and sequences quickly
- **Bridge Notation**: Proper display of suits (♠♥♦♣) and bid sequences
- **Print Support**: Clean printing layout

### Edit Mode
- **Inline Editing**: Double-click content to edit
- **Rich Editor**: Bridge notation support with suit buttons
- **Content Management**: Add sections, definitions, and sequences
- **Import/Export**: JSON data format for backup and sharing
- **Visual Convention**: Green background for opener bids, blue for responder

## Getting Started

### Local Development
1. Clone or download the project files
2. Open `index.html` in a web browser
3. No build process required - pure HTML/CSS/JavaScript

### File Structure
```
bridge_system/
├── index.html          # Main application
├── styles.css          # All styling
├── app.js             # Application logic
├── data.json          # Bridge system data
└── README.md          # This file
```

## Usage

### Viewing Content
- Click items in the Table of Contents to load sections
- Click colored text to see related content:
  - Red text loads detailed sequences in the bottom-right panel
  - Green text loads definitions in the bottom-left panel
  - Blue text loads specific sequences in the bottom-right panel
- Use the search box to find specific bids or concepts
- Close buttons (×) appear when panels have overflow content

### Edit Mode
- Click "Edit Mode" to toggle editing capabilities
- Double-click content areas to edit inline
- Use the toolbar buttons to:
  - Add new sections or definitions
  - Import/export data
  - Save changes
- Bridge notation buttons (♠♥♦♣ NT) insert proper symbols

### Keyboard Shortcuts
- `Ctrl/Cmd + E`: Toggle edit mode
- `Ctrl/Cmd + S`: Save changes (in edit mode)
- `Ctrl/Cmd + F`: Focus search box
- `Escape`: Exit edit mode or close modals

## Data Structure

The system uses a JSON-based data structure:

### Sections
- Main content areas (1m opening, 1m intervention, 1M opening)
- Hierarchical organization with subsections
- Cross-references to definitions and sequences

### Definitions
- Bridge conventions and concepts
- Detailed explanations with examples
- Referenced by green text links

### Sequences
- Detailed bid sequences and rebids
- Player context (opener/responder)
- HCP ranges and shape requirements
- Referenced by red and blue text links

## Customization

### Adding Content
1. Enter Edit Mode
2. Use "Add Section" or "Add Definition" buttons
3. Fill in the modal form
4. Save and the content will be immediately available

### Styling
- Modify `styles.css` for visual changes
- Bridge notation colors are defined in the `:root` variables
- Responsive breakpoints at 1024px and 768px

### Data Format
Import/export uses JSON format. See `data.json` for structure examples.

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript ES6+ support required
- Local storage for data persistence
- No server dependencies

## Future Enhancements
- User authentication system
- Cloud storage integration
- Collaborative editing
- Advanced search filters
- Bid sequence visualization
- Mobile app wrapper

## License
Personal use project - modify as needed for your bridge system requirements.