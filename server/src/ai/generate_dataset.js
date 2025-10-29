// Synthetic Bengaluru Municipal Complaints Dataset Generator
// Generates realistic BBMP-style complaints for testing

const categories = [
  'water_supply', 'waste_management', 'electricity', 'roads', 'sanitation',
  'street_lighting', 'public_safety', 'parks_recreation', 'noise_pollution',
  'traffic', 'air_quality', 'building_maintenance', 'drainage', 'animal_control',
  'public_transport'
];

const impacts = ['low', 'medium', 'high', 'critical'];

const templates = {
  water_supply: {
    critical: [
      'Burst BWSSB water main flooding {location}',
      'Contaminated Cauvery water supply affecting {area}',
      'Major water pipe rupture causing {issue}',
      'Water main break flooding {count} homes',
      'Severe water contamination in {location}',
      'Emergency water shutoff needed at {location}',
      'Brown water coming from taps in {area}',
      'Borwell contamination affecting {count} residents'
    ],
    high: [
      'Large water leak in {location}',
      'BWSSB water pipe broken causing {issue}',
      'Significant water pressure drop in {area}',
      'Water tanker not arriving for {count} days',
      'Broken fire hydrant flooding {location}',
      'No Cauvery water supply to {count} households',
      'Water meter reading dispute at {location}'
    ],
    medium: [
      'Low water pressure in {location}',
      'Water discoloration reported in {area}',
      'Intermittent water supply in {location}',
      'Slow water drainage in {area}',
      'Minor water leak at {location}'
    ],
    low: [
      'Dripping faucet at {location}',
      'Slight water pressure issue in {area}',
      'Minor water quality concern in {location}',
      'Small leak from {location}',
      'Water meter reading issue at {area}'
    ]
  },
  waste_management: {
    critical: [
      'Toxic waste dumped near {location}',
      'Hazardous material spill in {area}',
      'Chemical waste leak affecting {count} residents',
      'Illegal biomedical waste dumping at {location}',
      'Dangerous waste overflow near school at {area}',
      'Open garbage burning causing pollution at {location}'
    ],
    high: [
      'Multiple overflowing BBMP bins in {location}',
      'Illegal dumping blocking {area}',
      'Large garbage pile attracting stray dogs in {location}',
      'Pourakarmikas not collecting waste for {count} days',
      'Overflowing bins causing health hazard in {area}',
      'Plastic waste scattered across {location}'
    ],
    medium: [
      'Missed dry waste collection in {location}',
      'Overflowing community bin at {area}',
      'Scattered litter in {location}',
      'Wet waste not collected on schedule at {area}',
      'Moderate waste accumulation in {location}',
      'Segregated waste mixed by collectors at {area}'
    ],
    low: [
      'Single overflowing dustbin at {location}',
      'Minor litter on {area}',
      'Green bin needs emptying at {location}',
      'Small amount of trash near {area}',
      'Bin placement issue at {location}'
    ]
  },
  electricity: {
    critical: [
      'Transformer explosion at {location}',
      'Sparking electrical wires near {area}',
      'Power outage affecting {count} blocks',
      'Exposed high voltage cables at {location}',
      'Electrical fire hazard in {area}'
    ],
    high: [
      'Frequent power cuts in {location}',
      'Transformer overheating at {area}',
      'Power surge damaging appliances in {location}',
      'Electrical pole leaning dangerously at {area}',
      'Multiple street lights not working on {location}'
    ],
    medium: [
      'Intermittent power supply in {location}',
      'Voltage fluctuation in {area}',
      'Street light flickering at {location}',
      'Power cut during peak hours at {area}',
      'Electrical meter malfunction at {location}'
    ],
    low: [
      'Single street light not working at {location}',
      'Dim lighting in {area}',
      'Light bulb replacement needed at {location}',
      'Minor electrical concern in {area}',
      'Power outlet issue at {location}'
    ]
  },
  roads: {
    critical: [
      'Flyover collapse at {location}',
      'Major road cave-in on {area}',
      'Structural damage to flyover at {location}',
      'Road completely blocked by {issue}',
      'Dangerous crater on main road at {area}',
      'Metro construction causing road collapse at {location}'
    ],
    high: [
      'Large pothole causing two-wheeler accidents on {location}',
      'Fallen tree blocking {area}',
      'Road surface completely damaged on {location}',
      'Major crater in middle of road at {area}',
      'Heavy waterlogging making {location} impassable',
      'Footpath encroachment blocking pedestrians at {area}'
    ],
    medium: [
      'Multiple potholes on {location}',
      'Uneven road surface at {area}',
      'Faded zebra crossing on {location}',
      'Minor road damage at {area}',
      'Construction debris on {location}',
      'Broken speed breaker at {area}'
    ],
    low: [
      'Small pothole on {location}',
      'Minor crack in footpath at {area}',
      'Faded road markings at {location}',
      'Slight pavement unevenness on {area}',
      'Minor road wear at {location}'
    ]
  },
  sanitation: {
    critical: [
      'Sewage overflow near elementary school',
      'Raw sewage leak in residential area',
      'Major sewage backup affecting {count} homes',
      'Sewage system failure at {location}',
      'Open drain overflow creating health hazard'
    ],
    high: [
      'Clogged sewer line in {location}',
      'Sewage smell affecting {area}',
      'Drain overflow during rain at {location}',
      'Broken manhole cover at {area}',
      'Sewage water on street at {location}'
    ],
    medium: [
      'Slow drainage in {location}',
      'Partial sewer blockage at {area}',
      'Bad odor from drain at {location}',
      'Minor sewage issue in {area}',
      'Drain needs cleaning at {location}'
    ],
    low: [
      'Slight drain smell at {location}',
      'Minor drainage concern in {area}',
      'Drain cover loose at {location}',
      'Small blockage at {area}',
      'Routine drain maintenance needed'
    ]
  },
  street_lighting: {
    critical: [
      'All street lights out on highway',
      'Complete darkness on main road',
      'Street light pole fallen at {location}',
      'Electrical hazard from street light at {area}',
      'Multiple poles damaged in {location}'
    ],
    high: [
      'Most street lights not working on {location}',
      'Dark stretch creating safety issue at {area}',
      'Street light pole leaning at {location}',
      'Frequent light failures on {area}',
      'Broken street light creating hazard'
    ],
    medium: [
      'Several street lights out on {location}',
      'Dim lighting at {area}',
      'Street lights on during day at {location}',
      'Intermittent lighting at {area}',
      'Light timing issue at {location}'
    ],
    low: [
      'Single street light not working at {location}',
      'Dim lighting in {area}',
      'Light bulb replacement needed at {location}',
      'Minor electrical concern in {area}',
      'Power outlet issue at {location}'
    ]
  },
  public_safety: {
    critical: [
      'Building collapse risk at {location}',
      'Gas leak in public area',
      'Dangerous structure at {area}',
      'Major safety hazard affecting {count} people',
      'Immediate evacuation needed at {location}'
    ],
    high: [
      'Broken railing at dangerous height',
      'Unsafe construction at {location}',
      'Deep open pit at {area}',
      'Exposed electrical wires at {location}',
      'Dangerous tree about to fall'
    ],
    medium: [
      'Damaged playground equipment',
      'Broken fence at {location}',
      'Minor safety concern at {area}',
      'Uneven surface causing trips',
      'Poor visibility at intersection'
    ],
    low: [
      'Minor safety issue',
      'Small hazard at {location}',
      'Safety sign needed',
      'Minor concern at {area}',
      'Routine safety check needed'
    ]
  },
  parks_recreation: {
    critical: [
      'Dangerous equipment in playground',
      'Toxic substance in park',
      'Major safety hazard at {location}',
      'Park flooding affecting {count} visitors',
      'Structural damage to park facility'
    ],
    high: [
      'Broken playground equipment',
      'Park gate damaged at {location}',
      'Overgrown vegetation blocking path',
      'Park lighting completely out',
      'Vandalism damage at {area}'
    ],
    medium: [
      'Park needs maintenance',
      'Grass overgrown at {location}',
      'Benches need repair',
      'Minor equipment issue',
      'Path needs cleaning'
    ],
    low: [
      'Minor park maintenance needed',
      'Trash bin full',
      'Small repair needed',
      'Routine upkeep required',
      'Minor landscaping issue'
    ]
  },
  noise_pollution: {
    critical: [
      'Extremely loud industrial noise 24/7',
      'Construction noise violating limits',
      'Dangerous noise levels at {location}',
      'Continuous loud music affecting {count} residents',
      'Industrial machinery causing health issues'
    ],
    high: [
      'Loud construction during night hours',
      'Excessive noise from commercial area',
      'Loud generator running continuously',
      'Music event exceeding limits',
      'Heavy machinery noise at {location}'
    ],
    medium: [
      'Moderate noise disturbance',
      'Occasional loud noise',
      'Construction noise during day',
      'Minor noise complaint',
      'Intermittent disturbance'
    ],
    low: [
      'Brief noise complaint',
      'Temporary construction noise',
      'Minor traffic sounds',
      'Occasional disturbance',
      'Low-level noise issue'
    ]
  },
  traffic: {
    critical: [
      'Major accident blocking Outer Ring Road',
      'Multi-vehicle collision on flyover',
      'Road completely blocked at {location}',
      'Metro construction causing complete traffic standstill',
      'Namma Metro work blocking all lanes at {area}'
    ],
    high: [
      'Traffic signal not working at {location}',
      'Severe traffic jam on Silk Board Junction',
      'Auto rickshaw strike causing chaos at {area}',
      'BMTC bus breakdown blocking road at {location}',
      'Illegal parking blocking entire street at {area}',
      'Vendor encroachment causing traffic jam at {location}'
    ],
    medium: [
      'Heavy traffic during peak hours at {location}',
      'BBMP road work causing delays at {area}',
      'Faded road markings at {location}',
      'Traffic police absent at busy junction {area}',
      'School zone congestion at {location}'
    ],
    low: [
      'Single lane closure at {location}',
      'Minor traffic slowdown at {area}',
      'Temporary delay due to VIP movement',
      'Street light not working causing confusion at {location}'
    ]
  },
  air_quality: {
    critical: [
      'Toxic fumes from factory',
      'Gas leak in public area',
      'Hazardous smoke affecting residents',
      'Chemical smell causing health issues',
      'Industrial pollution emergency'
    ],
    high: [
      'Strong chemical odor',
      'Smoke from burning waste',
      'Factory emissions exceeding limits',
      'Dust pollution from construction',
      'Foul smell affecting area'
    ],
    medium: [
      'Moderate air quality concern',
      'Occasional bad smell',
      'Minor pollution issue',
      'Dust from unpaved road',
      'Intermittent odor'
    ],
    low: [
      'Minor air quality concern',
      'Slight odor',
      'Brief pollution event',
      'Small dust issue',
      'Temporary smell'
    ]
  },
  building_maintenance: {
    critical: [
      'Building collapse risk',
      'Major structural damage',
      'Dangerous cracks in building',
      'Immediate repair needed',
      'Safety hazard at building'
    ],
    high: [
      'Significant structural issues',
      'Water damage to building',
      'Broken windows creating hazard',
      'Roof leaking badly',
      'Wall damage at {location}'
    ],
    medium: [
      'Minor structural concern',
      'Paint peeling',
      'Small leak',
      'Door/window repair needed',
      'General maintenance required'
    ],
    low: [
      'Cosmetic repair needed',
      'Minor maintenance',
      'Small touch-up required',
      'Routine upkeep',
      'Minor issue'
    ]
  },
  drainage: {
    critical: [
      'Major flooding due to drain failure',
      'Storm drain completely blocked',
      'Drainage system collapse',
      'Severe waterlogging affecting {count} homes',
      'Emergency drainage issue'
    ],
    high: [
      'Heavy waterlogging at {location}',
      'Drain overflow during rain',
      'Multiple drains blocked',
      'Standing water for days',
      'Drainage causing road damage'
    ],
    medium: [
      'Slow drainage at {location}',
      'Partial blockage',
      'Minor waterlogging',
      'Drain needs cleaning',
      'Moderate drainage issue'
    ],
    low: [
      'Small drainage concern',
      'Minor blockage',
      'Routine cleaning needed',
      'Slight water accumulation',
      'Preventive maintenance required'
    ]
  },
  animal_control: {
    critical: [
      'Aggressive stray dog pack',
      'Dangerous animal in populated area',
      'Multiple animal attacks reported',
      'Rabid animal sighting',
      'Immediate animal control needed'
    ],
    high: [
      'Stray dog menace at {location}',
      'Monkey troop causing damage',
      'Cattle blocking road',
      'Multiple stray animals',
      'Animal creating safety hazard'
    ],
    medium: [
      'Stray dogs in area',
      'Minor animal nuisance',
      'Occasional animal issue',
      'Stray cattle concern',
      'Animal control needed'
    ],
    low: [
      'Single stray animal',
      'Birds nesting',
      'Minor wildlife concern',
      'Occasional animal sighting',
      'Low-priority animal issue'
    ]
  },
  public_transport: {
    critical: [
      'BMTC bus accident with injuries at {location}',
      'Complete Namma Metro service shutdown',
      'Major safety hazard on Volvo bus',
      'BMTC depot strike affecting {count} routes'
    ],
    high: [
      'Multiple BMTC buses not running on route {count}',
      'Severe delays on Purple Line Metro',
      'Bus stop shelter collapsed at {location}',
      'Overcrowded BMTC buses causing safety issues',
      'Metro station escalator broken at {area}'
    ],
    medium: [
      'BMTC bus delays on route {count}',
      'Bus stop needs cleaning at {location}',
      'Metro card recharge machine not working at {area}',
      'Bus schedule not followed at {location}',
      'Inadequate bus frequency during peak hours'
    ],
    low: [
      'Single BMTC bus late',
      'Minor complaint about bus conductor',
      'Bus stop information board faded at {location}',
      'Metro station announcement unclear'
    ]
  }
};

const locations = [
  'MG Road', 'Brigade Road', 'Residency Road', 'Church Street', 'Commercial Street',
  'Indiranagar 100 Feet Road', 'Koramangala 5th Block', 'Jayanagar 4th Block', 'Malleshwaram 8th Cross',
  'Rajajinagar Double Road', 'Whitefield Main Road', 'Electronic City Phase 1', 'HSR Layout Sector 1',
  'BTM Layout 2nd Stage', 'JP Nagar 7th Phase', 'Marathahalli Outer Ring Road', 'Bannerghatta Road',
  'Sarjapur Road', 'Old Airport Road', 'Hebbal Flyover', 'Yelahanka New Town', 'Kengeri Satellite Town',
  'Peenya Industrial Area', 'Yeshwanthpur Circle', 'Majestic Bus Stand', 'KR Market', 'Gandhi Bazaar',
  'Chickpet Main Road', 'Shivajinagar', 'RT Nagar Main Road', 'Basavanagudi Bull Temple Road',
  'Vijayanagar', 'Silk Board Junction', 'Tin Factory', 'Dairy Circle', 'Jayadeva Flyover',
  'Hosur Road', 'Mysore Road', 'Tumkur Road', 'Bellary Road', 'Kanakapura Road'
];

const areas = [
  'ward', 'locality', 'area', 'sector', 'zone', 'colony',
  'layout', 'extension', 'nagar', 'pura', 'cross'
];

const issues = [
  'property damage', 'safety hazard', 'traffic jam', 'waterlogging',
  'road damage', 'power cut', 'water shortage', 'garbage accumulation',
  'stray animals', 'encroachment', 'illegal construction'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDescription(template) {
  // Add more realistic variations for Indian context
  const specificCounts = [5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200];
  const timeDescriptors = [
    'since yesterday', 'for 3 days', 'for over a week', 'since last night', 
    'this morning', 'since monsoon', 'for past 2 weeks', 'since Diwali',
    'after recent rains', 'during peak hours'
  ];
  
  let description = template
    .replace('{location}', getRandomElement(locations))
    .replace('{area}', getRandomElement(areas))
    .replace('{issue}', getRandomElement(issues))
    .replace('{count}', getRandomElement(specificCounts));
  
  // Add realistic details occasionally
  if (Math.random() > 0.7) {
    description += ` ${getRandomElement(timeDescriptors)}`;
  }
  
  return description;
}

function calculatePriority(category, impact) {
  const baseScores = {
    critical: 0.90,
    high: 0.70,
    medium: 0.45,
    low: 0.25
  };
  
  let score = baseScores[impact];
  
  // Adjust based on category urgency with more nuanced scoring
  const criticalCategories = ['electricity', 'water_supply', 'public_safety', 'sanitation', 'drainage'];
  const highPriorityCategories = ['roads', 'street_lighting', 'air_quality', 'animal_control'];
  
  if (criticalCategories.includes(category) && impact !== 'low') {
    score += 0.05; // Higher boost for critical categories
  } else if (highPriorityCategories.includes(category) && (impact === 'high' || impact === 'critical')) {
    score += 0.03;
  }
  
  // Add controlled randomness for variety
  score += (Math.random() * 0.10 - 0.05);
  
  return Math.min(0.99, Math.max(0.15, score));
}

function generateDataset(count = 1000) {
  const samples = [];
  
  for (let i = 0; i < count; i++) {
    const category = getRandomElement(categories);
    const impact = getRandomElement(impacts);
    
    const categoryTemplates = templates[category];
    if (!categoryTemplates || !categoryTemplates[impact]) {
      continue;
    }
    
    const template = getRandomElement(categoryTemplates[impact]);
    const description = generateDescription(template);
    const priority = calculatePriority(category, impact);
    
    samples.push({
      category,
      impact,
      description,
      priority: priority.toFixed(2)
    });
  }
  
  return samples;
}

// Generate and output CSV
const samples = generateDataset(1500); // Balanced dataset size for speed-accuracy tradeoff

console.log('category,impact,description,priority');
samples.forEach(sample => {
  const desc = sample.description.replace(/,/g, ';'); // Replace commas in description
  console.log(`${sample.category},${sample.impact},${desc},${sample.priority}`);
});
