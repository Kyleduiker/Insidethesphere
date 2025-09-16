/**
 * Newsletter Builder Pro - Configuration
 * Contains all constants, seasonal data, and configuration settings
 */

// Imgur API Configuration
const IMGUR_CONFIG = {
    CLIENT_ID: '203a7e94dc049ff',
    ALTERNATIVE_CLIENT_ID: 'f5c99b60812c81a',
    API_URL: 'https://api.imgur.com/3/image'
};

// Default Colors and Themes
const DEFAULT_COLORS = {
    headerText: '#333333',
    bodyText: '#555555',
    accent: '#f39c12',
    background: '#f8f9fa'
};

const DEFAULT_BUTTON_COLORS = {
    buyersGuide: '#f39c12',
    sellersGuide: '#2c3e50',
    website: '#27ae60',
    blog: '#3498db',
    marketReport: '#f39c12'
};

const DEFAULT_PROPERTY_COLORS = {
    detached: '#f39c12',
    semi: '#2c3e50',
    row: '#27ae60',
    apartment: '#3498db',
    custom: '#9b59b6'
};

// Color Preset Themes
const COLOR_PRESETS = {
    default: {
        colors: { headerText: '#333333', bodyText: '#555555', accent: '#f39c12', background: '#f8f9fa' },
        buttons: { buyersGuide: '#f39c12', sellersGuide: '#2c3e50', website: '#27ae60', blog: '#3498db', marketReport: '#f39c12' },
        propertyTypes: { detached: '#f39c12', semi: '#2c3e50', row: '#27ae60', apartment: '#3498db', custom: '#9b59b6' }
    },
    blue: {
        colors: { headerText: '#2c3e50', bodyText: '#34495e', accent: '#3498db', background: '#ebf3fd' },
        buttons: { buyersGuide: '#3498db', sellersGuide: '#2980b9', website: '#1abc9c', blog: '#9b59b6', marketReport: '#3498db' },
        propertyTypes: { detached: '#3498db', semi: '#2980b9', row: '#1abc9c', apartment: '#9b59b6', custom: '#8e44ad' }
    },
    green: {
        colors: { headerText: '#27ae60', bodyText: '#2e8b57', accent: '#27ae60', background: '#e8f8f0' },
        buttons: { buyersGuide: '#27ae60', sellersGuide: '#229954', website: '#1abc9c', blog: '#f39c12', marketReport: '#27ae60' },
        propertyTypes: { detached: '#27ae60', semi: '#229954', row: '#1abc9c', apartment: '#f39c12', custom: '#e67e22' }
    },
    purple: {
        colors: { headerText: '#8e44ad', bodyText: '#6c3483', accent: '#9b59b6', background: '#f4ecf7' },
        buttons: { buyersGuide: '#9b59b6', sellersGuide: '#8e44ad', website: '#e74c3c', blog: '#f39c12', marketReport: '#9b59b6' },
        propertyTypes: { detached: '#9b59b6', semi: '#8e44ad', row: '#e74c3c', apartment: '#f39c12', custom: '#d68910' }
    },
    red: {
        colors: { headerText: '#c0392b', bodyText: '#922b21', accent: '#e74c3c', background: '#fdf2f2' },
        buttons: { buyersGuide: '#e74c3c', sellersGuide: '#c0392b', website: '#f39c12', blog: '#3498db', marketReport: '#e74c3c' },
        propertyTypes: { detached: '#e74c3c', semi: '#c0392b', row: '#f39c12', apartment: '#3498db', custom: '#9b59b6' }
    },
    teal: {
        colors: { headerText: '#16a085', bodyText: '#138d75', accent: '#1abc9c', background: '#e8f8f5' },
        buttons: { buyersGuide: '#1abc9c', sellersGuide: '#16a085', website: '#27ae60', blog: '#3498db', marketReport: '#1abc9c' },
        propertyTypes: { detached: '#1abc9c', semi: '#16a085', row: '#27ae60', apartment: '#3498db', custom: '#f39c12' }
    },
    dark: {
        colors: { headerText: '#2c3e50', bodyText: '#34495e', accent: '#95a5a6', background: '#ecf0f1' },
        buttons: { buyersGuide: '#34495e', sellersGuide: '#2c3e50', website: '#95a5a6', blog: '#7f8c8d', marketReport: '#95a5a6' },
        propertyTypes: { detached: '#34495e', semi: '#2c3e50', row: '#95a5a6', apartment: '#7f8c8d', custom: '#566573' }
    },
    gold: {
        colors: { headerText: '#b7950b', bodyText: '#9a7d0a', accent: '#f1c40f', background: '#fef9e7' },
        buttons: { buyersGuide: '#f1c40f', sellersGuide: '#f39c12', website: '#e67e22', blog: '#d35400', marketReport: '#f1c40f' },
        propertyTypes: { detached: '#f1c40f', semi: '#f39c12', row: '#e67e22', apartment: '#d35400', custom: '#ca6f1e' }
    },
    royallepage: {
        colors: { headerText: '#000000', bodyText: '#4D4D4D', accent: '#EA002A', background: '#FFFFFF' },
        buttons: { buyersGuide: '#EA002A', sellersGuide: '#000000', website: '#A59D95', blog: '#C4C18E', marketReport: '#EA002A' },
        propertyTypes: { detached: '#EA002A', semi: '#000000', row: '#A59D95', apartment: '#4D4D4D', custom: '#C4C18E' }
    }
};

// Default Property Types
const DEFAULT_PROPERTY_TYPES = [
    {
        id: 'detached',
        name: 'Detached Homes',
        icon: '🏠',
        colorKey: 'detached',
        required: false
    },
    {
        id: 'semi',
        name: 'Semi-Detached',
        icon: '🏘️',
        colorKey: 'semi',
        required: false
    },
    {
        id: 'row',
        name: 'Row/Townhomes',
        icon: '🏘️',
        colorKey: 'row',
        required: false
    },
    {
        id: 'apartment',
        name: 'Apartments/Condos',
        icon: '🏢',
        colorKey: 'apartment',
        required: false
    }
];

// Seasonal Configurations
const SEASONS = {
    january: {
        title: 'JANUARY NEWSLETTER',
        subtitle: 'NEW BEGINNINGS',
        personalMessage: 'Happy New Year! A fresh start brings new opportunities—whether it\'s upgrading your space or buying your first home. Let\'s make 2025 the year of great moves!',
        tips: ['🔧 Replace furnace filter', '💧 Use humidifier to combat dry air', '🧊 Watch for ice dams after Chinooks', '❄️ Check for frost in attic/basement', '🚨 Test smoke & CO detectors']
    },
    february: {
        title: 'FEBRUARY NEWSLETTER',
        subtitle: 'LOVE YOUR HOME',
        personalMessage: 'Love is in the air—and so is opportunity! Whether you\'re buying, selling, or just curious, I\'m here to help you find a home you\'ll love.',
        tips: ['🌨️ Clear snow from foundation & vents', '🚪 Inspect weather stripping after freeze-thaw', '🔐 Lubricate locks & garage mechanisms', '💧 Monitor for condensation inside windows', '⚡ Test sump pump for early thaw']
    },
    march: {
        title: 'MARCH NEWSLETTER',
        subtitle: 'SPRING PREP',
        personalMessage: 'As the snow melts and days grow longer, now\'s the time to start thinking spring market. Real estate is warming up—are you ready?',
        tips: ['☀️ Begin clearing snow from perimeter', '💧 Check grading for pooling meltwater', '🏠 Book roof inspection before spring rain', '🌳 Trim snow-damaged tree limbs', '🌱 Prep garden tools & order supplies']
    },
    april: {
        title: 'APRIL NEWSLETTER',
        subtitle: 'SPRING AWAKENING',
        personalMessage: 'Spring is in full swing! It\'s a great time to freshen up your home or explore new listings. Let\'s talk about what\'s happening in your area.',
        tips: ['🌧️ Clean gutters/downspouts', '🏠 Inspect shingles & siding for winter damage', '💧 Test exterior taps (after final frost)', '🔧 Caulk windows and doors', '🌿 Fertilize lawn (spring mix)']
    },
    may: {
        title: 'MAY NEWSLETTER',
        subtitle: 'BLOOMING SEASON',
        personalMessage: 'May is for patios, gardening, and maybe even new beginnings. If you\'ve been thinking of a move, the spring market is buzzing!',
        tips: ['🚿 Power wash siding, deck, walkways', '💧 Inspect irrigation system for leaks', '🔧 Reseal driveway and deck surfaces', '🍖 Clean BBQ and prep outdoor living space', '🐛 Monitor for signs of pests and insects']
    },
    june: {
        title: 'JUNE NEWSLETTER',
        subtitle: 'SUMMER STARTS',
        personalMessage: 'With school winding down and the sun heating up, June is a top month for real estate. Let\'s make your next move a smooth one.',
        tips: ['❄️ Test A/C and change filters', '🌧️ Check eavestrough slope and extension', '🔧 Inspect fence posts for shifting', '🪟 Wash windows and inspect screens', '💨 Secure patio furniture before windstorms']
    },
    july: {
        title: 'JULY NEWSLETTER',
        subtitle: 'SUMMER LIVING',
        personalMessage: 'It\'s summer fun and sunshine! The market\'s still active, and I\'m here to help you take the next step—whether you\'re buying or selling.',
        tips: ['🌳 Trim trees near home (hail + wind risk)', '🏠 Check attic insulation and ventilation', '☀️ Use UV films or blinds on sunny windows', '💧 Water lawn early mornings (drought)', '🔥 Inspect dryer vent (fire safety)']
    },
    august: {
        title: 'AUGUST NEWSLETTER',
        subtitle: 'LATE SUMMER',
        personalMessage: 'Before fall routines kick in, August is the perfect time to make a move or prep your home for sale. Let\'s chat about your next step!',
        tips: ['🏠 Review roof for hail damage', '🔥 Prep furnace for fall (early servicing)', '🧹 Deep clean garage or shed', '📋 Plan fall landscaping or repairs', '🎨 Touch up exterior paint']
    },
    september: {
        title: 'SEPTEMBER NEWSLETTER',
        subtitle: 'FALL PREP',
        personalMessage: 'As routines return and leaves begin to turn, it\'s a great time to revisit your real estate goals. Fall can be full of opportunity!',
        tips: ['💧 Blow out sprinklers before frost', '🌿 Fertilize lawn (fall mix)', '🔥 Inspect chimney and fireplace', '📦 Store summer tools and patio gear', '🐭 Check attic and garage for rodent entry']
    },
    october: {
        title: 'OCTOBER NEWSLETTER',
        subtitle: 'AUTUMN COMFORT',
        personalMessage: 'Fall is here and so is one of the coziest times to shop for a new place. Let\'s talk listings, market trends, or your real estate wish list!',
        tips: ['❄️ Winterize outdoor faucets and hoses', '🍂 Rake and compost leaves', '🏠 Inspect foundation for cracks', '🔥 Test heating system and thermostat', '🚪 Apply weather seal to doors/windows']
    },
    november: {
        title: 'NOVEMBER NEWSLETTER',
        subtitle: 'THANKSGIVING SEASON',
        personalMessage: 'Before the holiday rush, November is a great time to review your plans. Thinking of a move in the new year? Let\'s get ahead of it together.',
        tips: ['❄️ Prepare snow removal equipment', '❄️ Cover or store A/C units', '💡 Install exterior light timers', '🧊 Stock ice melt and emergency supplies', '🔧 Replace furnace filter']
    },
    december: {
        title: 'DECEMBER NEWSLETTER',
        subtitle: 'HOLIDAY SEASON',
        personalMessage: 'Wishing you a warm and peaceful holiday season! Whether you\'re cozy at home or planning a change in the new year, I\'m here when you need me.',
        tips: ['❄️ Clear snow from roof edges and vents', '🚨 Test CO detectors during peak furnace use', '💨 Check for drafts around windows', '🚶 Keep exits and walkways snow-free', '🏠 Inspect roof load if heavy snowfalls occur']
    }
};

// Default Market Statistics
const DEFAULT_STATS = {
    avgPrice: '$589,900',
    priceChange: '-2.5%',
    homesSold: '2,568',
    salesChange: '-16.9%',
    newListings: '4,842',
    listingsChange: '+11.6%',
    inventory: '6,740',
    inventoryChange: '+97.5%',
    monthsOfSupply: '2.62',
    supplyChange: '+137.7%',
    
    detachedPrice: '$769,400',
    detachedChange: '+1.0%',
    detachedSales: '1,275',
    detachedSalesChange: '-8%',
    detachedListings: '2,419',
    detachedListingsChange: '+19%',
    detachedInventory: '2,995',
    detachedInventoryChange: '+87%',
    detachedSupply: '2.35',
    
    semiPrice: '$697,300',
    semiChange: '+2.8%',
    semiSales: '256',
    semiSalesChange: '-1%',
    semiListings: '428',
    semiListingsChange: '+19%',
    semiInventory: '542',
    semiInventoryChange: '+99%',
    semiSupply: '2.12',
    
    rowPrice: '$453,600',
    rowChange: '-1.9%',
    rowSales: '458',
    rowSalesChange: '-15%',
    rowListings: '764',
    rowListingsChange: '+11%',
    rowInventory: '1,116',
    rowInventoryChange: '+161%',
    rowSupply: '2.44',
    
    apartmentPrice: '$335,300',
    apartmentChange: '-1.5%',
    apartmentSales: '579',
    apartmentSalesChange: '-36%',
    apartmentListings: '1,231',
    apartmentListingsChange: '-2%',
    apartmentInventory: '2,087',
    apartmentInventoryChange: '+88%',
    apartmentSupply: '3.60'
};

// Form Configuration
const FORM_FIELDS = {
    // Design fields
    design: [
        'bannerStyle', 'headerFont', 'bodyFont', 'hideCustomBannerText',
        'headerTextColor', 'bodyTextColor', 'accentColor', 'backgroundAccent'
    ],
    
    // Agent information
    agent: [
        'agentName', 'companyName', 'agentPhone', 'agentEmail', 'agentWebsite'
    ],
    
    // Content fields
    content: [
        'personalMessage', 'newsletterSeason', 'customSubtitle', 
        'marketButtonText', 'marketButtonUrl'
    ],
    
    // Smart buttons
    smartButtons: [
        'buyersGuideName', 'buyersGuideUrl', 'sellersGuideName', 'sellersGuideUrl',
        'websiteName', 'myWebsiteUrl', 'blogName', 'blogUrl'
    ],
    
    // Button colors
    buttonColors: [
        'buyersGuideColor', 'sellersGuideColor', 'websiteColor', 'blogColor', 'marketButtonColor'
    ],
    
    // Property type colors
    propertyColors: [
        'detachedColor', 'semiColor', 'rowColor', 'apartmentColor', 'customPropertyColor'
    ]
};

// Emoji Categories for Picker
const EMOJI_CATEGORIES = {
    maintenance: {
        title: '🔧 Tools & Maintenance',
        emojis: ['🔧', '🔨', '🪚', '⚒️', '🧰', '⚙️', '🔩', '⚡']
    },
    home: {
        title: '🏠 Home & Garden',
        emojis: ['🏠', '🏡', '🪟', '🚪', '🌿', '🌱', '🌳', '🌺']
    },
    weather: {
        title: '🌦️ Weather & Seasons',
        emojis: ['❄️', '🌨️', '☀️', '🌧️', '💨', '🍂', '🌡️', '🧊']
    },
    utilities: {
        title: '💧 Utilities & Safety',
        emojis: ['💧', '🚿', '🔥', '💡', '🚨', '🧹', '🧽', '🧴']
    },
    tasks: {
        title: '📋 Tasks & Reminders',
        emojis: ['📋', '✅', '📝', '📅', '⏰', '🔔', '⚠️', '🎯']
    }
};

const PROPERTY_EMOJI_CATEGORIES = {
    buildings: {
        title: '🏠 Houses & Buildings',
        emojis: ['🏠', '🏡', '🏘️', '🏢', '🏬', '🏭', '🏗️', '🏚️']
    },
    special: {
        title: '🏰 Special Properties',
        emojis: ['🏰', '🏯', '🗼', '🕌', '⛪', '🏛️', '🏟️', '🎪']
    },
    outdoor: {
        title: '🏕️ Outdoor & Recreation',
        emojis: ['🏕️', '⛺', '🏞️', '🏖️', '🏝️', '⛰️', '🏔️', '🗻']
    },
    transport: {
        title: '🚗 Transportation & Access',
        emojis: ['🚗', '🚙', '🏎️', '🚐', '🚛', '🚌', '🚂', '✈️']
    },
    luxury: {
        title: '💎 Luxury & Premium',
        emojis: ['💎', '👑', '🌟', '⭐', '✨', '🔥', '💰', '🏆']
    }
};

// Application Settings
const APP_SETTINGS = {
    VERSION: '2.0.0',
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300
};

// Export all configurations
window.NewsletterConfig = {
    IMGUR_CONFIG,
    DEFAULT_COLORS,
    DEFAULT_BUTTON_COLORS,
    DEFAULT_PROPERTY_COLORS,
    COLOR_PRESETS,
    DEFAULT_PROPERTY_TYPES,
    SEASONS,
    DEFAULT_STATS,
    FORM_FIELDS,
    EMOJI_CATEGORIES,
    PROPERTY_EMOJI_CATEGORIES,
    APP_SETTINGS
};
