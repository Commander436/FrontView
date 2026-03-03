import { MilitaryBase } from "@/types/globe";

export const MILITARY_BASES: MilitaryBase[] = [
  // United States
  { name: "Pentagon", country: "United States", branch: "DoD HQ", latitude: 38.8719, longitude: -77.0563, description: "Headquarters of the U.S. Department of Defense." },
  { name: "Fort Liberty", country: "United States", branch: "US Army", latitude: 35.1392, longitude: -79.0064, description: "Home of the 82nd Airborne and USASOC." },
  { name: "Fort Cavazos", country: "United States", branch: "US Army", latitude: 31.1357, longitude: -97.7775, description: "Largest active-duty armored post in the U.S." },
  { name: "Naval Station Norfolk", country: "United States", branch: "US Navy", latitude: 36.9466, longitude: -76.3032, description: "World's largest naval station." },
  { name: "Joint Base Pearl Harbor-Hickam", country: "United States", branch: "Joint", latitude: 21.3469, longitude: -157.9740, description: "Major Pacific fleet headquarters." },
  { name: "Nellis AFB", country: "United States", branch: "USAF", latitude: 36.2360, longitude: -115.0340, description: "Home of Red Flag and USAF Warfare Center." },
  { name: "Edwards AFB", country: "United States", branch: "USAF", latitude: 34.9054, longitude: -117.8838, description: "Air Force Flight Test Center." },
  { name: "Fort Eisenhower", country: "United States", branch: "US Army", latitude: 33.4170, longitude: -82.1330, description: "U.S. Army Cyber Center of Excellence." },
  { name: "Naval Base San Diego", country: "United States", branch: "US Navy", latitude: 32.6839, longitude: -117.1291, description: "Principal homeport of the Pacific Fleet." },
  { name: "Joint Base Lewis-McChord", country: "United States", branch: "Joint", latitude: 47.0879, longitude: -122.5760, description: "Major Army and Air Force installation in Washington." },
  { name: "Peterson SFB", country: "United States", branch: "US Space Force", latitude: 38.8094, longitude: -104.7135, description: "Home of U.S. Space Command." },
  { name: "Vandenberg SFB", country: "United States", branch: "US Space Force", latitude: 34.7421, longitude: -120.5724, description: "West coast space launch facility." },
  { name: "Fort Meade", country: "United States", branch: "US Army/NSA", latitude: 39.1086, longitude: -76.7431, description: "Home of the National Security Agency." },
  { name: "Whiteman AFB", country: "United States", branch: "USAF", latitude: 38.7268, longitude: -93.5548, description: "Home of the B-2 Spirit stealth bomber." },
  { name: "Offutt AFB", country: "United States", branch: "USAF", latitude: 41.1186, longitude: -95.9125, description: "Headquarters of U.S. Strategic Command." },
  { name: "Fort Drum", country: "United States", branch: "US Army", latitude: 44.0550, longitude: -75.7580, description: "Home of the 10th Mountain Division." },
  { name: "NAS Pensacola", country: "United States", branch: "US Navy", latitude: 30.3528, longitude: -87.3186, description: "Cradle of Naval Aviation." },
  { name: "MCAS Miramar", country: "United States", branch: "USMC", latitude: 32.8684, longitude: -117.1424, description: "Home of 3rd Marine Aircraft Wing." },
  { name: "Kirtland AFB", country: "United States", branch: "USAF", latitude: 35.0406, longitude: -106.5981, description: "Nuclear weapons storage and research." },
  { name: "Schriever SFB", country: "United States", branch: "US Space Force", latitude: 38.8060, longitude: -104.5286, description: "Space operations center in Colorado." },
  { name: "Fort Riley", country: "United States", branch: "US Army", latitude: 39.0553, longitude: -96.7847, description: "Home of the 1st Infantry Division." },
  { name: "Fort Campbell", country: "United States", branch: "US Army", latitude: 36.6620, longitude: -87.4746, description: "Home of the 101st Airborne Division." },
  { name: "Tinker AFB", country: "United States", branch: "USAF", latitude: 35.4147, longitude: -97.3866, description: "Major logistics and sustainment center." },
  // U.S. Overseas
  { name: "Ramstein Air Base", country: "Germany", branch: "USAF", latitude: 49.4369, longitude: 7.6003, description: "Major USAF base and NATO Allied Air Command." },
  { name: "Camp Humphreys", country: "South Korea", branch: "US Army", latitude: 36.9627, longitude: 127.0313, description: "Largest U.S. overseas military base." },
  { name: "RAF Lakenheath", country: "United Kingdom", branch: "USAF/RAF", latitude: 52.4093, longitude: 0.5608, description: "Major USAF F-35 base in England." },
  { name: "Yokosuka Naval Base", country: "Japan", branch: "US Navy", latitude: 35.2886, longitude: 139.6808, description: "Largest U.S. naval base in the Pacific." },
  { name: "Kadena Air Base", country: "Japan", branch: "USAF", latitude: 26.3516, longitude: 127.7694, description: "Key USAF base on Okinawa, Japan." },
  { name: "Diego Garcia", country: "BIOT", branch: "US Navy/USAF", latitude: -7.3195, longitude: 72.4229, description: "Strategic military base in the Indian Ocean." },
  { name: "Incirlik Air Base", country: "Turkey", branch: "USAF/Turkish AF", latitude: 37.0021, longitude: 35.4259, description: "Strategic NATO air base in southern Turkey." },
  { name: "Guantánamo Bay", country: "Cuba", branch: "US Navy", latitude: 19.9024, longitude: -75.0961, description: "U.S. naval base on the southeastern coast of Cuba." },
  { name: "Thule Air Base", country: "Greenland", branch: "US Space Force", latitude: 76.5312, longitude: -68.7031, description: "Northernmost U.S. military installation." },
  { name: "Camp Lemonnier", country: "Djibouti", branch: "US Navy/Joint", latitude: 11.5473, longitude: 43.1456, description: "U.S. base in Djibouti hosting counter-terrorism operations." },
  { name: "Al Udeid Air Base", country: "Qatar", branch: "USAF", latitude: 25.1174, longitude: 51.3150, description: "Forward HQ for USCENTCOM air operations." },
  { name: "Naval Support Activity Bahrain", country: "Bahrain", branch: "US Navy", latitude: 26.1985, longitude: 50.5518, description: "Home of U.S. Naval Forces Central Command / 5th Fleet." },
  { name: "Rota Naval Station", country: "Spain", branch: "US Navy", latitude: 36.6417, longitude: -6.3497, description: "U.S. naval station in southern Spain." },
  { name: "Grafenwöhr Training Area", country: "Germany", branch: "US Army", latitude: 49.6889, longitude: 11.9347, description: "Major U.S. Army training area in Bavaria." },
  { name: "MCAS Iwakuni", country: "Japan", branch: "USMC/JMSDF", latitude: 34.1464, longitude: 132.2356, description: "Joint U.S.-Japan air station." },
  { name: "Lajes Field", country: "Portugal", branch: "USAF/Portuguese AF", latitude: 38.7625, longitude: -27.0906, description: "Strategic air base in the Azores." },
  { name: "Morón Air Base", country: "Spain", branch: "USAF/Spanish AF", latitude: 37.1750, longitude: -5.6200, description: "U.S. forward operating base in southern Spain." },
  { name: "Al Asad Air Base", country: "Iraq", branch: "Iraqi AF/US", latitude: 33.7856, longitude: 42.4414, description: "Joint Iraqi-American air base in Anbar." },
  // Russia
  { name: "Kaliningrad HQ", country: "Russia", branch: "Russian Navy", latitude: 54.7104, longitude: 20.4522, description: "Headquarters of Russia's Baltic Fleet." },
  { name: "Severomorsk", country: "Russia", branch: "Russian Navy", latitude: 69.0731, longitude: 33.4186, description: "Main base of Russia's Northern Fleet." },
  { name: "Vladivostok", country: "Russia", branch: "Russian Navy", latitude: 43.1155, longitude: 131.8855, description: "Headquarters of Russia's Pacific Fleet." },
  { name: "Engels Air Base", country: "Russia", branch: "Russian Air Force", latitude: 51.4827, longitude: 46.2039, description: "Strategic bomber base for Tu-95 and Tu-160." },
  { name: "Khmeimim Air Base", country: "Syria", branch: "Russian Air Force", latitude: 35.4112, longitude: 35.9508, description: "Russia's main air base in Syria." },
  { name: "Tartus Naval Facility", country: "Syria", branch: "Russian Navy", latitude: 34.8889, longitude: 35.8866, description: "Russia's naval logistics facility in the Mediterranean." },
  { name: "Novosibirsk Military District", country: "Russia", branch: "Russian Army", latitude: 55.0084, longitude: 82.9357, description: "Central Military District headquarters." },
  // China
  { name: "Hainan Naval Base", country: "China", branch: "PLAN", latitude: 18.2270, longitude: 109.5589, description: "Major Chinese naval base and submarine facility." },
  { name: "Zhanjiang Naval Base", country: "China", branch: "PLAN", latitude: 21.1953, longitude: 110.3594, description: "HQ of PLA Navy Southern Theater Command." },
  { name: "Qingdao Naval Base", country: "China", branch: "PLAN", latitude: 36.0671, longitude: 120.3826, description: "HQ of PLA Navy Northern Theater Command." },
  { name: "Djibouti Support Base", country: "Djibouti", branch: "PLA", latitude: 11.5920, longitude: 43.0875, description: "China's first overseas military base." },
  { name: "Korla Missile Test Range", country: "China", branch: "PLARF", latitude: 41.7259, longitude: 86.1746, description: "PLA Rocket Force test and training facility." },
  { name: "Lhasa Military Command", country: "China", branch: "PLA", latitude: 29.6500, longitude: 91.1000, description: "PLA Western Theater Command in Tibet." },
  // United Kingdom
  { name: "HMNB Portsmouth", country: "United Kingdom", branch: "Royal Navy", latitude: 50.7990, longitude: -1.1098, description: "Home base of the Royal Navy aircraft carriers." },
  { name: "HMNB Clyde", country: "United Kingdom", branch: "Royal Navy", latitude: 56.0627, longitude: -4.8254, description: "Home of the UK's nuclear submarine fleet." },
  { name: "RAF Coningsby", country: "United Kingdom", branch: "RAF", latitude: 53.0930, longitude: -0.1660, description: "Home of the Typhoon Quick Reaction Alert Force." },
  { name: "BFPO Akrotiri", country: "Cyprus", branch: "RAF", latitude: 34.5903, longitude: 32.9879, description: "British sovereign base area in Cyprus." },
  { name: "RAF Waddington", country: "United Kingdom", branch: "RAF", latitude: 53.1662, longitude: -0.5208, description: "ISR and remotely piloted aircraft hub." },
  // France
  { name: "Toulon Naval Base", country: "France", branch: "French Navy", latitude: 43.1048, longitude: 5.9302, description: "Main base of the French Mediterranean Fleet." },
  { name: "Istres-Le Tubé Air Base", country: "France", branch: "French Air Force", latitude: 43.5237, longitude: 4.9238, description: "Home of French nuclear-capable bombers." },
  { name: "Djibouti French Forces", country: "Djibouti", branch: "French Armed Forces", latitude: 11.5563, longitude: 43.1475, description: "France's largest permanent military base in Africa." },
  { name: "Île Longue", country: "France", branch: "French Navy", latitude: 48.2822, longitude: -4.5100, description: "Home of the French ballistic missile submarine fleet." },
  // India
  { name: "INS Kadamba", country: "India", branch: "Indian Navy", latitude: 14.8079, longitude: 74.1249, description: "India's newest and largest naval base." },
  { name: "Ambala Air Force Station", country: "India", branch: "Indian Air Force", latitude: 30.3782, longitude: 76.8171, description: "Home of India's Rafale fighter squadrons." },
  { name: "Pokhran Field Firing Range", country: "India", branch: "Indian Army", latitude: 26.9316, longitude: 71.0872, description: "Site of India's nuclear weapons tests." },
  { name: "INS Visakhapatnam", country: "India", branch: "Indian Navy", latitude: 17.7215, longitude: 83.3025, description: "Eastern Naval Command headquarters." },
  // Japan
  { name: "Yokota Air Base", country: "Japan", branch: "JASDF/USAF", latitude: 35.7486, longitude: 139.3486, description: "Joint USAF-JASDF headquarters in Tokyo." },
  { name: "Kure Naval Base", country: "Japan", branch: "JMSDF", latitude: 34.2356, longitude: 132.5518, description: "Major Japan Maritime Self-Defense Force base." },
  { name: "Misawa Air Base", country: "Japan", branch: "USAF/JASDF", latitude: 40.7032, longitude: 141.3686, description: "Joint air base in northern Honshu." },
  // Australia
  { name: "Pine Gap", country: "Australia", branch: "Joint US-AU", latitude: -23.7991, longitude: 133.7370, description: "Joint intelligence facility in central Australia." },
  { name: "HMAS Stirling", country: "Australia", branch: "RAN", latitude: -32.2363, longitude: 115.6920, description: "Australia's largest naval base, future AUKUS submarine port." },
  { name: "RAAF Tindal", country: "Australia", branch: "RAAF", latitude: -14.5214, longitude: 132.3781, description: "Northern Australia air base being upgraded for B-52 deployment." },
  { name: "RAAF Amberley", country: "Australia", branch: "RAAF", latitude: -27.6400, longitude: 152.7117, description: "Major Australian air force base in Queensland." },
  // South Korea
  { name: "Jinhae Naval Base", country: "South Korea", branch: "ROKN", latitude: 35.1383, longitude: 128.6686, description: "Headquarters of the Republic of Korea Navy." },
  { name: "Osan Air Base", country: "South Korea", branch: "USAF/ROKAF", latitude: 37.0901, longitude: 127.0296, description: "Primary USAF tactical air base in South Korea." },
  { name: "Kunsan Air Base", country: "South Korea", branch: "USAF/ROKAF", latitude: 35.9024, longitude: 126.6156, description: "USAF F-16 wing in South Korea." },
  // Israel
  { name: "Haifa Naval Base", country: "Israel", branch: "Israeli Navy", latitude: 32.8215, longitude: 34.9800, description: "Main operating base of the Israeli Navy." },
  { name: "Nevatim Air Base", country: "Israel", branch: "Israeli Air Force", latitude: 31.2085, longitude: 34.9370, description: "Home of Israel's F-35I Adir squadrons." },
  { name: "Palmachim Air Base", country: "Israel", branch: "Israeli Air Force", latitude: 31.8975, longitude: 34.6908, description: "Space launch and missile test facility." },
  // Turkey
  { name: "Aksaz Naval Base", country: "Turkey", branch: "Turkish Navy", latitude: 36.9675, longitude: 28.0328, description: "Major Turkish naval base in the Aegean." },
  // Egypt
  { name: "Cairo West Air Base", country: "Egypt", branch: "Egyptian Air Force", latitude: 30.1164, longitude: 30.9155, description: "Major Egyptian military air base west of Cairo." },
  // Saudi Arabia
  { name: "King Abdulaziz Air Base", country: "Saudi Arabia", branch: "Royal Saudi Air Force", latitude: 26.2653, longitude: 50.1524, description: "Major RSAF base in the Eastern Province." },
  { name: "King Faisal Naval Base", country: "Saudi Arabia", branch: "Royal Saudi Navy", latitude: 21.3530, longitude: 39.1722, description: "Major Saudi naval base on the Red Sea." },
  { name: "Prince Sultan Air Base", country: "Saudi Arabia", branch: "RSAF/USAF", latitude: 24.0625, longitude: 47.5814, description: "Major coalition air base south of Riyadh." },
  // UAE
  { name: "Al Dhafra Air Base", country: "UAE", branch: "UAEAF/USAF", latitude: 24.2480, longitude: 54.5477, description: "Major joint air base near Abu Dhabi." },
  // Germany
  { name: "Büchel Air Base", country: "Germany", branch: "Luftwaffe", latitude: 50.1736, longitude: 7.0633, description: "NATO nuclear sharing base with U.S. B61 weapons." },
  // Italy
  { name: "Aviano Air Base", country: "Italy", branch: "USAF", latitude: 46.0319, longitude: 12.5965, description: "Major USAF base in northeastern Italy." },
  { name: "Naval Station Sigonella", country: "Italy", branch: "US Navy", latitude: 37.4017, longitude: 14.9222, description: "Major U.S. naval air station in Sicily." },
  // Norway
  { name: "Ørland Air Station", country: "Norway", branch: "Royal Norwegian AF", latitude: 63.6988, longitude: 9.6040, description: "Norway's main fighter base with F-35s." },
  { name: "Bodø Air Station", country: "Norway", branch: "Royal Norwegian AF", latitude: 67.2689, longitude: 14.3653, description: "Northern Norway fighter base." },
  // Poland
  { name: "Redzikowo Base", country: "Poland", branch: "US/NATO", latitude: 54.4783, longitude: 17.0981, description: "Aegis Ashore missile defense site in Poland." },
  // Romania
  { name: "Deveselu Base", country: "Romania", branch: "US/NATO", latitude: 44.0406, longitude: 24.3469, description: "Aegis Ashore missile defense site in Romania." },
  // Baltic States
  { name: "Šiauliai Air Base", country: "Lithuania", branch: "NATO", latitude: 55.8939, longitude: 23.3947, description: "NATO Baltic Air Policing base." },
  { name: "Ämari Air Base", country: "Estonia", branch: "NATO", latitude: 59.2603, longitude: 24.2086, description: "NATO Baltic Air Policing host." },
  // Greece
  { name: "Souda Bay", country: "Greece", branch: "US Navy/Hellenic Navy", latitude: 35.5350, longitude: 24.1186, description: "NATO naval support facility in Crete." },
  // Brazil
  { name: "Brasília Naval Command", country: "Brazil", branch: "Brazilian Navy", latitude: -15.7939, longitude: -47.8828, description: "Brazilian Navy Command headquarters." },
  { name: "Base Aérea de Anápolis", country: "Brazil", branch: "Brazilian Air Force", latitude: -16.2311, longitude: -48.9642, description: "Major Brazilian fighter base." },
  // Pakistan
  { name: "Kamra Air Base", country: "Pakistan", branch: "PAF", latitude: 33.8691, longitude: 72.4009, description: "PAF's aeronautical complex and air base." },
  // North Korea
  { name: "Yongbyon Nuclear Complex", country: "North Korea", branch: "KPA", latitude: 39.7986, longitude: 125.7539, description: "North Korea's primary nuclear research facility." },
  // Iran
  { name: "Isfahan Nuclear Facility", country: "Iran", branch: "IRGC", latitude: 32.6546, longitude: 51.6680, description: "Uranium conversion facility near Isfahan." },
  { name: "Bandar Abbas Naval Base", country: "Iran", branch: "IRIN/IRGCN", latitude: 27.1832, longitude: 56.2666, description: "Major Iranian naval base controlling the Strait of Hormuz." },
  // Taiwan
  { name: "Zuoying Naval Base", country: "Taiwan", branch: "ROCN", latitude: 22.6900, longitude: 120.2851, description: "Headquarters of the Republic of China Navy." },
  { name: "Hsinchu Air Base", country: "Taiwan", branch: "ROCAF", latitude: 24.8180, longitude: 120.9393, description: "Major Taiwanese air base with Mirage 2000 fighters." },
  // Singapore
  { name: "Changi Naval Base", country: "Singapore", branch: "RSN", latitude: 1.3521, longitude: 103.9915, description: "State-of-the-art Singapore naval facility." },
  // Philippines
  { name: "Subic Bay", country: "Philippines", branch: "Philippine Navy", latitude: 14.7944, longitude: 120.2522, description: "Former U.S. naval base, now Philippine facility." },
  { name: "Clark Air Base", country: "Philippines", branch: "Philippine AF", latitude: 15.1861, longitude: 120.5603, description: "Major Philippine air base, former USAF facility." },
  // Thailand
  { name: "U-Tapao", country: "Thailand", branch: "Royal Thai Navy", latitude: 12.6800, longitude: 101.0050, description: "Joint-use military base and civilian airport." },
  // Vietnam
  { name: "Cam Ranh Bay", country: "Vietnam", branch: "Vietnam People's Navy", latitude: 11.9981, longitude: 109.2194, description: "Major Vietnamese naval base." },
  // NATO / Multi-national
  { name: "NATO HQ SHAPE", country: "Belgium", branch: "NATO", latitude: 50.5039, longitude: 3.8683, description: "Supreme Headquarters Allied Powers Europe." },
  { name: "NATO JFC Brunssum", country: "Netherlands", branch: "NATO", latitude: 50.9439, longitude: 5.9836, description: "NATO Joint Force Command." },
  // Africa
  { name: "Air Base 201", country: "Niger", branch: "US/Niger", latitude: 16.9600, longitude: 8.0000, description: "U.S. drone base for counter-terrorism in the Sahel." },
  { name: "Entebbe Air Base", country: "Uganda", branch: "UPDF", latitude: 0.0424, longitude: 32.4435, description: "Ugandan military air base and logistics hub." },
  { name: "Simon's Town Naval Base", country: "South Africa", branch: "SA Navy", latitude: -34.1908, longitude: 18.4312, description: "Main operational base of the South African Navy." },
];
