// scripts/fetch-verified-galleries.cjs
const fs = require("fs");
const path = require("path");
const { searchCommonsPhoto, getWikiSummaryPhoto, testImageUrl } = require("./build-complete-galleries.cjs");

// Detailed mapping of 12 specific, authentic landmarks for every destination
const DESTINATIONS = [
  {
    id: "munnar",
    name: "Munnar",
    state: "Kerala, India",
    landmarks: [
      { name: "Munnar Rolling Tea Hills", wiki: "Munnar", query: "Munnar tea garden Kerala" },
      { name: "Kolukkumalai Tea Estate", wiki: "Kolukkumalai_Tea_Estate", query: "Kolukkumalai tea" },
      { name: "Mattupetty Dam & Lake", wiki: "Mattupetty_Dam", query: "Mattupetty Dam" },
      { name: "Kundala Lake Reservoir", wiki: "Kundala_Dam", query: "Kundala Lake Munnar" },
      { name: "Eravikulam National Park", wiki: "Eravikulam_National_Park", query: "Eravikulam Nilgiri Tahr" },
      { name: "Top Station Western Ghats View", wiki: "Top_Station", query: "Top Station Munnar" },
      { name: "Attukal Waterfalls", wiki: null, query: "Attukal Waterfalls Munnar" },
      { name: "Lockhart Gap Mountain Vista", wiki: null, query: "Lockhart Gap Munnar" },
      { name: "Anamudi Peak (Highest in South India)", wiki: "Anamudi", query: "Anamudi peak Kerala" },
      { name: "Pothamedu Viewpoint", wiki: null, query: "Pothamedu Munnar viewpoint" },
      { name: "Chinnakanal Tea Falls", wiki: null, query: "Chinnakanal waterfalls Kerala" },
      { name: "Tea Museum & Factory", wiki: "Tea_Museum_(Munnar)", query: "Tea Museum Munnar" }
    ]
  },
  {
    id: "jaipur",
    name: "Jaipur",
    state: "Rajasthan, India",
    landmarks: [
      { name: "Hawa Mahal (Palace of Winds)", wiki: "Hawa_Mahal", query: "Hawa Mahal Jaipur" },
      { name: "Amber Fort (Amer Fort)", wiki: "Amer_Fort", query: "Amber Fort Amer Jaipur" },
      { name: "Jal Mahal (Water Palace)", wiki: "Jal_Mahal", query: "Jal Mahal Jaipur" },
      { name: "City Palace Courtyards & Peacock Gate", wiki: "City_Palace,_Jaipur", query: "City Palace Jaipur" },
      { name: "Nahargarh Fort Sunset Ramparts", wiki: "Nahargarh_Fort", query: "Nahargarh Fort Jaipur" },
      { name: "Jantar Mantar Astronomical Observatory", wiki: "Jantar_Mantar,_Jaipur", query: "Jantar Mantar Jaipur" },
      { name: "Panna Meena ka Kund Stepwell", wiki: null, query: "Panna Meena ka Kund Jaipur" },
      { name: "Albert Hall Museum", wiki: "Albert_Hall_Museum", query: "Albert Hall Museum Jaipur" },
      { name: "Patrika Gate Colorful Arches", wiki: null, query: "Patrika Gate Jaipur" },
      { name: "Jaigarh Fort Aravalli Citadel", wiki: "Jaigarh_Fort", query: "Jaigarh Fort Jaipur" },
      { name: "Galta Ji (Monkey Temple & Kunds)", wiki: "Galtaji", query: "Galtaji temple Jaipur" },
      { name: "Johari Bazaar Pink City Streetscape", wiki: null, query: "Pink City Jaipur Johari Bazaar" }
    ]
  },
  {
    id: "gokarna",
    name: "Gokarna",
    state: "Karnataka, India",
    landmarks: [
      { name: "Om Beach Crescent Shoreline", wiki: "Om_Beach,_Gokarna", query: "Om Beach Gokarna" },
      { name: "Kudle Beach Golden Sands", wiki: null, query: "Kudle Beach Gokarna" },
      { name: "Half Moon Beach Cove", wiki: null, query: "Half Moon Beach Gokarna" },
      { name: "Paradise Beach Secluded Bay", wiki: null, query: "Paradise Beach Gokarna" },
      { name: "Mahabaleshwar Temple Shore", wiki: "Mahabaleshwar_Temple,_Gokarna", query: "Mahabaleshwar Temple Gokarna" },
      { name: "Gokarna Cliff Trail Walk", wiki: null, query: "Gokarna cliff coast" },
      { name: "Mirjan Fort Heritage Bastion", wiki: "Mirjan_Fort", query: "Mirjan Fort Karnataka" },
      { name: "Koti Tirtha Sacred Temple Tank", wiki: null, query: "Koti Tirtha Gokarna" },
      { name: "Belekan Beach Rocky Shoreline", wiki: null, query: "Belekan Beach Gokarna" },
      { name: "Gokarna Main Beach Shore", wiki: null, query: "Gokarna beach Karnataka" },
      { name: "Arabian Sea Sunset Rocks", wiki: null, query: "Gokarna sunset Arabian Sea" },
      { name: "Coastal Palm Headlands", wiki: null, query: "Gokarna coastline palms" }
    ]
  },
  {
    id: "spiti",
    name: "Spiti Valley",
    state: "Himachal Pradesh, India",
    landmarks: [
      { name: "Key (Ki) Monastery", wiki: "Key_Monastery", query: "Key Monastery Spiti" },
      { name: "Chandratal (Moon Lake)", wiki: "Chandra_Taal", query: "Chandratal Lake Spiti" },
      { name: "Dhankar Monastery Cliff", wiki: "Dhankar_Gompa", query: "Dhankar Monastery Spiti" },
      { name: "Dhankar Alpine Lake", wiki: "Dhankar_Lake", query: "Dhankar Lake Spiti" },
      { name: "Kaza & Spiti River Basin", wiki: "Kaza,_Himachal_Pradesh", query: "Kaza Spiti River" },
      { name: "Hikkim World's Highest Post Office", wiki: "Hikkim", query: "Hikkim village post office" },
      { name: "Langza Golden Buddha & Chau Chau Peak", wiki: null, query: "Langza village Buddha Spiti" },
      { name: "Chicham Bridge Gorge", wiki: null, query: "Chicham Bridge Spiti" },
      { name: "Komic Village Monastery", wiki: "Komic", query: "Komic monastery Spiti" },
      { name: "Tabo 1000-Year Ancient Monastery", wiki: "Tabo_Monastery", query: "Tabo Monastery Himachal" },
      { name: "Pin Valley National Park", wiki: "Pin_Valley_National_Park", query: "Pin Valley Spiti" },
      { name: "Kunzum Pass Himalayan Summit", wiki: "Kunzum_Pass", query: "Kunzum Pass Himachal" }
    ]
  },
  {
    id: "udaipur",
    name: "Udaipur",
    state: "Rajasthan, India",
    landmarks: [
      { name: "City Palace Complex & Pichola", wiki: "City_Palace,_Udaipur", query: "City Palace Udaipur" },
      { name: "Lake Pichola Panoramic Vista", wiki: "Lake_Pichola", query: "Lake Pichola Udaipur" },
      { name: "Taj Lake Palace Floating on Water", wiki: "Lake_Palace", query: "Lake Palace Udaipur" },
      { name: "Jag Mandir Island Palace", wiki: "Jag_Mandir", query: "Jag Mandir Udaipur" },
      { name: "Fateh Sagar Lake & Aravalli Hills", wiki: "Fateh_Sagar_Lake", query: "Fateh Sagar Lake Udaipur" },
      { name: "Saheliyon-ki-Bari Fountains & Lotus Pools", wiki: "Saheliyon-ki-Bari", query: "Saheliyon-ki-Bari Udaipur" },
      { name: "Ambrai Ghat Waterfront Steps", wiki: null, query: "Ambrai Ghat Udaipur" },
      { name: "Bagore-ki-Haveli Lakefront Arches", wiki: "Bagore-ki-Haveli", query: "Bagore-ki-Haveli Udaipur" },
      { name: "Sajjangarh (Monsoon Palace) Hilltop", wiki: "Monsoon_Palace", query: "Sajjangarh Udaipur" },
      { name: "Bahubali Hills Overlooking Badi Lake", wiki: null, query: "Badi Lake Udaipur Bahubali" },
      { name: "Jagdish Temple Sculpted Spire", wiki: "Jagdish_Temple,_Udaipur", query: "Jagdish Temple Udaipur" },
      { name: "Gangaur Ghat Evening Illumination", wiki: null, query: "Gangaur Ghat Udaipur" }
    ]
  },
  {
    id: "meghalaya",
    name: "Meghalaya",
    state: "Northeast India",
    landmarks: [
      { name: "Nongriat Double Decker Living Root Bridge", wiki: "Living_root_bridge", query: "Double Decker Living Root Bridge Nongriat" },
      { name: "Nohkalikai Falls (India's Tallest Plunge)", wiki: "Nohkalikai_Falls", query: "Nohkalikai Falls Cherrapunji" },
      { name: "Dawki / Umngot Crystal Clear River", wiki: "Umngot_River", query: "Dawki Umngot river Meghalaya" },
      { name: "Mawlynnong Cleanest Village", wiki: "Mawlynnong", query: "Mawlynnong village Meghalaya" },
      { name: "Seven Sisters Falls (Nohsngithiang)", wiki: "Nohsngithiang_Falls", query: "Seven Sisters Falls Cherrapunji" },
      { name: "Wei Sawdong Three-Tiered Falls", wiki: null, query: "Wei Sawdong waterfall Meghalaya" },
      { name: "Krang Suri Azure Waterfall", wiki: null, query: "Krang Suri falls Meghalaya" },
      { name: "Mawsmai Cave Limestone Formations", wiki: "Mawsmai_Cave", query: "Mawsmai Cave Meghalaya" },
      { name: "Laitlum Canyons Misty Gorge", wiki: null, query: "Laitlum Canyons Meghalaya" },
      { name: "Mawphlang Sacred Forest Ancient Trees", wiki: null, query: "Mawphlang sacred grove Meghalaya" },
      { name: "Umiam Lake (Barapani)", wiki: "Umiam_Lake", query: "Umiam Lake Shillong" },
      { name: "Elephant Falls Cascades", wiki: "Elephant_Falls_(India)", query: "Elephant Falls Shillong" }
    ]
  },
  {
    id: "kyoto",
    name: "Kyoto",
    state: "Japan",
    landmarks: [
      { name: "Fushimi Inari Vermilion Torii Path", wiki: "Fushimi_Inari-taisha", query: "Fushimi Inari Taisha Kyoto" },
      { name: "Kinkaku-ji (Golden Pavilion) Reflection", wiki: "Kinkaku-ji", query: "Kinkaku-ji Golden Pavilion Kyoto" },
      { name: "Arashiyama Bamboo Forest Pathway", wiki: "Bamboo_Forest_(Kyoto,_Japan)", query: "Arashiyama Bamboo Grove Kyoto" },
      { name: "Kiyomizu-dera Historic Wooden Temple", wiki: "Kiyomizu-dera", query: "Kiyomizu-dera Kyoto" },
      { name: "Yasaka Pagoda from Ninenzaka Street", wiki: "Hōkan-ji_Temple", query: "Yasaka Pagoda Ninenzaka Kyoto" },
      { name: "Gion Historic Geisha District", wiki: "Gion", query: "Gion district Kyoto machiya" },
      { name: "Tenryu-ji Sogenchi Zen Garden", wiki: "Tenryū-ji", query: "Tenryu-ji garden Kyoto" },
      { name: "Philosopher's Path (Tetsugaku-no-Michi)", wiki: "Philosopher's_Walk", query: "Philosophers Path Kyoto" },
      { name: "Togetsukyo Bridge in Arashiyama", wiki: "Togetsukyō", query: "Togetsukyo Bridge Kyoto" },
      { name: "Ryoan-ji Dry Zen Rock Garden", wiki: "Ryōan-ji", query: "Ryoan-ji rock garden Kyoto" },
      { name: "Nanzen-ji Historic Brick Aqueduct", wiki: "Nanzen-ji", query: "Nanzen-ji aqueduct Kyoto" },
      { name: "Heian Shrine Grand Courtyard", wiki: "Heian_Shrine", query: "Heian Shrine Kyoto torii" }
    ]
  },
  {
    id: "bali",
    name: "Bali",
    state: "Indonesia",
    landmarks: [
      { name: "Tegallalang Rice Terraces (Ubud)", wiki: null, query: "Tegallalang rice terraces Bali" },
      { name: "Uluwatu Cliffside Sea Temple", wiki: "Uluwatu_Temple", query: "Uluwatu Temple Bali sunset" },
      { name: "Tanah Lot Sea Temple at High Tide", wiki: "Tanah_Lot", query: "Tanah Lot Bali temple" },
      { name: "Ulun Danu Beratan Water Temple", wiki: "Pura_Ulun_Danu_Bratan", query: "Ulun Danu Beratan Bali" },
      { name: "Tirta Empul Holy Water Springs", wiki: "Tirta_Empul_Temple", query: "Tirta Empul temple Bali" },
      { name: "Nusa Penida Kelingking T-Rex Cliff", wiki: "Kelingking_Beach", query: "Kelingking Beach Nusa Penida" },
      { name: "Mount Batur Volcano & Caldera Lake", wiki: "Mount_Batur", query: "Mount Batur Bali volcano" },
      { name: "Lempuyang Gates of Heaven", wiki: "Pura_Penataran_Agung_Lempuyang", query: "Lempuyang temple Bali gate" },
      { name: "Ubud Sacred Monkey Forest Sanctuary", wiki: "Ubud_Monkey_Forest", query: "Ubud Monkey Forest Bali" },
      { name: "Tegenungan Jungle Waterfall", wiki: null, query: "Tegenungan Waterfall Bali" },
      { name: "Jatiluwih UNESCO Rice Terraces", wiki: "Jatiluwih_rice_terraces", query: "Jatiluwih rice terraces Bali" },
      { name: "Sanur / Seminyak Coastal Sunset", wiki: null, query: "Bali beach sunset traditional" }
    ]
  },
  {
    id: "queenstown",
    name: "Queenstown",
    state: "New Zealand",
    landmarks: [
      { name: "Lake Wakatipu & The Remarkables", wiki: "Lake_Wakatipu", query: "Lake Wakatipu Queenstown" },
      { name: "Skyline Queenstown Panoramic Lookout", wiki: null, query: "Skyline Queenstown lookout" },
      { name: "TSS Earnslaw Heritage Steamship", wiki: "TSS_Earnslaw", query: "TSS Earnslaw Queenstown" },
      { name: "Shotover River Canyon Gorge", wiki: "Shotover_River", query: "Shotover River Queenstown" },
      { name: "Coronet Peak Alpine Ridge", wiki: "Coronet_Peak", query: "Coronet Peak Queenstown" },
      { name: "Glenorchy Wharf & Red Boat Shed", wiki: "Glenorchy,_New_Zealand", query: "Glenorchy wharf Lake Wakatipu" },
      { name: "Arrowtown Historic Gold Mining Village", wiki: "Arrowtown", query: "Arrowtown Otago New Zealand" },
      { name: "Kawarau Gorge Suspension Bridge", wiki: "Kawarau_Gorge_Suspension_Bridge", query: "Kawarau Bridge bungy" },
      { name: "Moke Lake Pristine Alpine Reflection", wiki: "Moke_Lake", query: "Moke Lake Queenstown" },
      { name: "Milford Sound & Mitre Peak", wiki: "Milford_Sound", query: "Milford Sound Mitre Peak fiord" },
      { name: "Queenstown Gardens Lakefront Trail", wiki: null, query: "Queenstown Gardens lakefront" },
      { name: "Lake Hayes Mirror Reflection", wiki: "Lake_Hayes", query: "Lake Hayes Queenstown" }
    ]
  },
  {
    id: "manali",
    name: "Manali",
    state: "Himachal Pradesh, India",
    landmarks: [
      { name: "Solang Valley Alpine Adventure Slopes", wiki: "Solang_Valley", query: "Solang Valley Manali" },
      { name: "Rohtang Pass Glacial Summit", wiki: "Rohtang_Pass", query: "Rohtang Pass Himachal snow" },
      { name: "Hadimba Devi Cedar Forest Pagoda", wiki: "Hidimba_Devi_Temple", query: "Hadimba Temple Manali" },
      { name: "Old Manali Heritage Village", wiki: null, query: "Old Manali wooden village" },
      { name: "Jogini Waterfalls Cascade", wiki: null, query: "Jogini Waterfall Manali" },
      { name: "Beas River Mountain Rapids", wiki: "Beas_River", query: "Beas River Manali rapids" },
      { name: "Atal Tunnel & Sissu Waterfall", wiki: "Atal_Tunnel", query: "Atal Tunnel portal Sissu" },
      { name: "Naggar Castle Medieval Timber Palace", wiki: "Naggar_Castle", query: "Naggar Castle Kullu" },
      { name: "Vashisht Ancient Stone Temple", wiki: "Vashisht,_Himachal_Pradesh", query: "Vashisht temple Manali" },
      { name: "Hampta Pass Pine Foothills", wiki: "Hampta_Pass", query: "Hampta Pass Himachal" },
      { name: "Manu Temple in Old Manali", wiki: null, query: "Manu Temple Manali" },
      { name: "Gulaba Himalayan Meadow", wiki: null, query: "Gulaba Manali meadow" }
    ]
  },
  {
    id: "ladakh",
    name: "Ladakh",
    state: "Ladakh, India",
    landmarks: [
      { name: "Pangong Tso Changeling Blue Lake", wiki: "Pangong_Tso", query: "Pangong Tso Ladakh" },
      { name: "Nubra Valley Sand Dunes & Bactrian Camels", wiki: "Hunder", query: "Hunder sand dunes Nubra" },
      { name: "Thiksey Monastery (Mini Potala)", wiki: "Thikse_Monastery", query: "Thiksey Monastery Ladakh" },
      { name: "Khardung La High Mountain Pass", wiki: "Khardung_La", query: "Khardung La Ladakh pass" },
      { name: "Shanti Stupa Overlooking Leh", wiki: "Shanti_Stupa,_Ladakh", query: "Shanti Stupa Leh Ladakh" },
      { name: "Indus & Zanskar River Confluence (Sangam)", wiki: null, query: "Indus Zanskar confluence Sangam Ladakh" },
      { name: "Diskit Colossal Maitreya Buddha", wiki: "Diskit_Monastery", query: "Diskit Monastery Buddha Nubra" },
      { name: "Leh Palace Ancient Fortress", wiki: "Leh_Palace", query: "Leh Palace Ladakh" },
      { name: "Lamayuru Monastery & Moonland Formations", wiki: "Lamayuru_Monastery", query: "Lamayuru Monastery Moonland" },
      { name: "Tso Moriri High Alpine Lake", wiki: "Tso_Moriri", query: "Tso Moriri lake Ladakh" },
      { name: "Hemis Monastery Courtyard", wiki: "Hemis_Monastery", query: "Hemis Monastery Ladakh" },
      { name: "Turtuk Village Karakoram Border Haven", wiki: "Turtuk", query: "Turtuk village Ladakh" }
    ]
  },
  {
    id: "ooty",
    name: "Ooty",
    state: "Tamil Nadu, India",
    landmarks: [
      { name: "Nilgiri Mountain Railway Heritage Toy Train", wiki: "Nilgiri_Mountain_Railway", query: "Nilgiri Mountain Railway toy train" },
      { name: "Ooty Government Botanical Gardens", wiki: "Government_Botanical_Garden,_Ooty", query: "Botanical Gardens Ooty" },
      { name: "Doddabetta Peak Highest Summit", wiki: "Doddabetta", query: "Doddabetta Peak Nilgiris" },
      { name: "Ooty Lake & Eucalyptus Shores", wiki: "Ooty_Lake", query: "Ooty Lake boathouse" },
      { name: "Pykara Lake & Waterfalls", wiki: "Pykara", query: "Pykara Lake Ooty" },
      { name: "Avalanche Lake Biosphere Sanctuary", wiki: "Avalanche_Lake,_Ooty", query: "Avalanche Lake Nilgiris" },
      { name: "Nilgiri Tea Plantation Slopes", wiki: null, query: "Nilgiri tea plantation Coonoor" },
      { name: "Government Rose Garden Terraces", wiki: "Government_Rose_Garden,_Ooty", query: "Government Rose Garden Ooty" },
      { name: "Emerald Lake Peaceful Waters", wiki: "Emerald_Lake_(India)", query: "Emerald Lake Nilgiris" },
      { name: "Ooty Pine Forest Glades", wiki: null, query: "Pine Forest Ooty Shooting Point" },
      { name: "St. Stephen's Church Historic Architecture", wiki: "St._Stephen's_Church,_Ooty", query: "St. Stephens Church Ooty" },
      { name: "Ketty Valley Scenic Lookout", wiki: "Ketti_Valley", query: "Ketti Valley Nilgiri" }
    ]
  },
  {
    id: "coorg",
    name: "Coorg",
    state: "Karnataka, India",
    landmarks: [
      { name: "Abbey Falls Amid Coffee Plantations", wiki: "Abbey_Falls", query: "Abbey Falls Coorg" },
      { name: "Raja's Seat Sunset Pavilion", wiki: "Raja's_Seat", query: "Rajas Seat Madikeri" },
      { name: "Kodagu Coffee & Pepper Plantation", wiki: null, query: "Coorg coffee plantation estate" },
      { name: "Mandalpatti Mountain Clouds Viewpoint", wiki: null, query: "Mandalpatti peak Coorg" },
      { name: "Namdroling Monastery (Golden Temple)", wiki: "Namdroling_Monastery", query: "Namdroling Monastery Bylakuppe" },
      { name: "Talakaveri Sacred Source of Kaveri", wiki: "Talakaveri", query: "Talakaveri temple Coorg" },
      { name: "Dubare Elephant Camp on River Kaveri", wiki: "Dubare", query: "Dubare Elephant Camp Kaveri" },
      { name: "Iruppu Falls in Brahmagiri Forest", wiki: "Iruppu_Falls", query: "Iruppu Falls Coorg" },
      { name: "Madikeri Fort Palace & Ramparts", wiki: "Madikeri_Fort", query: "Madikeri Fort Coorg" },
      { name: "Chelavara Falls Forest Stream", wiki: "Chelavara_Falls", query: "Chelavara Falls Coorg" },
      { name: "Tadiandamol Peak (Highest in Coorg)", wiki: "Tadiandamol", query: "Tadiandamol peak Coorg" },
      { name: "Nisargadhama Bamboo River Island", wiki: "Nisargadhama", query: "Kaveri Nisargadhama bamboo" }
    ]
  },
  {
    id: "goa",
    name: "Goa",
    state: "Goa, India",
    landmarks: [
      { name: "Palolem Beach Crescent Bay", wiki: "Palolem_Beach", query: "Palolem Beach Goa" },
      { name: "Basilica of Bom Jesus (UNESCO Heritage)", wiki: "Basilica_of_Bom_Jesus", query: "Basilica of Bom Jesus Goa" },
      { name: "Fort Aguada & Historic Lighthouse", wiki: "Fort_Aguada", query: "Fort Aguada lighthouse Goa" },
      { name: "Fontainhas Latin Quarter Heritage Street", wiki: "Fontainhas_(Goa)", query: "Fontainhas Panaji Goa" },
      { name: "Dudhsagar Four-Tiered Waterfall", wiki: "Dudhsagar_Falls", query: "Dudhsagar Falls Goa railway" },
      { name: "Anjuna Beach Laterite Rocks", wiki: "Anjuna_Beach", query: "Anjuna Beach Goa rocks" },
      { name: "Chapora Fort Overlooking Vagator", wiki: "Chapora_Fort", query: "Chapora Fort Vagator Goa" },
      { name: "Se Cathedral in Old Goa", wiki: "Se_Cathedral,_Goa", query: "Se Cathedral Old Goa" },
      { name: "Calangute Beach Shoreline", wiki: "Calangute", query: "Calangute Beach Goa" },
      { name: "Cabo de Rama Fort Ocean Cliffs", wiki: "Cabo_de_Rama", query: "Cabo de Rama Fort Goa" },
      { name: "Our Lady of the Immaculate Conception Church", wiki: "Our_Lady_of_the_Immaculate_Conception_Church,_Goa", query: "Immaculate Conception church Panaji" },
      { name: "Morjim Beach Peaceful Sands", wiki: "Morjim", query: "Morjim Beach Goa" }
    ]
  },
  {
    id: "varkala",
    name: "Varkala",
    state: "Kerala, India",
    landmarks: [
      { name: "Varkala Red Laterite Sea Cliff", wiki: "Varkala_Beach", query: "Varkala cliff beach red" },
      { name: "Papanasam Beach Sacred Sands", wiki: null, query: "Papanasam Beach Varkala" },
      { name: "Varkala North Cliff Walkway", wiki: null, query: "Varkala North Cliff path" },
      { name: "Janardhana Swamy 2000-Year Temple", wiki: "Janardanaswamy_Temple", query: "Janardhana Swamy Temple Varkala" },
      { name: "Kappil Beach & Backwaters Confluence", wiki: "Kappil_Beach", query: "Kappil Beach backwaters Kerala" },
      { name: "Anjengo Fort & Coastal Lighthouse", wiki: "Anjengo_Fort", query: "Anjengo Fort lighthouse Kerala" },
      { name: "Arabian Sea Sunset from Varkala Cliff", wiki: null, query: "Varkala sunset cliff sea" },
      { name: "Varkala South Cliff Coconut Shore", wiki: null, query: "Varkala South Cliff beach" },
      { name: "Odayam Quiet Beach", wiki: null, query: "Odayam beach Varkala" },
      { name: "Traditional Fishing Crafts on Shore", wiki: null, query: "Traditional fishing boat Kerala Varkala" },
      { name: "Sivagiri Mutt Spiritual Sanctuary", wiki: "Sivagiri,_Kerala", query: "Sivagiri Mutt Varkala" },
      { name: "Edava Beach Coastal Lagoons", wiki: "Edava", query: "Edava beach lake Varkala" }
    ]
  },
  {
    id: "hampi",
    name: "Hampi",
    state: "Karnataka, India",
    landmarks: [
      { name: "Stone Chariot at Vijaya Vittala", wiki: "Vittala_Temple,_Hampi", query: "Stone Chariot Vittala Temple Hampi" },
      { name: "Virupaksha Temple & Hampi Bazaar", wiki: "Virupaksha_Temple,_Hampi", query: "Virupaksha Temple gopuram Hampi" },
      { name: "Tungabhadra River & Coracle Boat", wiki: "Tungabhadra_River", query: "Tungabhadra river coracle Hampi" },
      { name: "Lotus Mahal Indo-Islamic Pavilion", wiki: "Lotus_Mahal,_Hampi", query: "Lotus Mahal palace Hampi" },
      { name: "Elephant Stables Grand Arched Halls", wiki: null, query: "Elephant Stables Hampi Vijayanagara" },
      { name: "Matanga Hill Sunrise Panorama", wiki: "Matanga_Hill", query: "Matanga Hill sunrise Hampi" },
      { name: "Queen's Bath Royal Enclosure", wiki: null, query: "Queens Bath Hampi arched" },
      { name: "Hazara Rama Temple Wall Carvings", wiki: "Hazara_Rama_Temple", query: "Hazara Rama Temple Hampi relief" },
      { name: "Achyutaraya Temple Ruins", wiki: "Achyutaraya_Temple", query: "Achyutaraya Temple Hampi" },
      { name: "Sasivekalu Ganesha Monolithic Statue", wiki: null, query: "Sasivekalu Ganesha Hampi" },
      { name: "Kadalekalu Ganesha Temple", wiki: null, query: "Kadalekalu Ganesha Hampi monolith" },
      { name: "Anjaneya Hill in Anegundi", wiki: "Anjeyanadri_Hill", query: "Anjaneya Hill Anegundi Hampi" }
    ]
  },
  {
    id: "varanasi",
    name: "Varanasi",
    state: "Uttar Pradesh, India",
    landmarks: [
      { name: "Dashashwamedh Ghat Evening Ganga Aarti", wiki: "Dashashwamedh_Ghat", query: "Dashashwamedh Ghat evening aarti Varanasi" },
      { name: "Assi Ghat Morning Subah-e-Banaras", wiki: "Assi_Ghat", query: "Assi Ghat sunrise Varanasi" },
      { name: "Sunrise Boat on Holy River Ganges", wiki: null, query: "Ganges river wooden boat sunrise Varanasi" },
      { name: "Manikarnika Historic Riverside Ghat", wiki: "Manikarnika_Ghat", query: "Manikarnika Ghat Varanasi" },
      { name: "Kashi Vishwanath Temple Corridor", wiki: "Kashi_Vishwanath_Temple", query: "Kashi Vishwanath temple corridor Varanasi" },
      { name: "Ramnagar Fort Sandstone Citadel", wiki: "Ramnagar_Fort", query: "Ramnagar Fort Varanasi" },
      { name: "Varanasi Ghats Heritage Riverfront", wiki: "Ghats_in_Varanasi", query: "Varanasi ghats riverfront panorama" },
      { name: "Dhamek Stupa at Sarnath", wiki: "Dhamek_Stupa", query: "Dhamek Stupa Sarnath Buddha" },
      { name: "Old Varanasi Heritage Lanes", wiki: null, query: "Varanasi narrow alley lanes old city" },
      { name: "Scindia Ghat & Tilted Shiva Shrine", wiki: "Scindia_Ghat", query: "Scindia Ghat tilted temple Varanasi" },
      { name: "Chet Singh Fort Ghat", wiki: "Chet_Singh_Ghat", query: "Chet Singh Ghat palace Varanasi" },
      { name: "Banarasi Silk Heritage Craft", wiki: "Banarasi_sari", query: "Banarasi silk weaving loom Varanasi" }
    ]
  },
  {
    id: "rishikesh",
    name: "Rishikesh",
    state: "Uttarakhand, India",
    landmarks: [
      { name: "Lakshman Jhula Historic Suspension Bridge", wiki: "Lakshman_Jhula", query: "Lakshman Jhula bridge Rishikesh" },
      { name: "Ram Jhula over River Ganges", wiki: "Ram_Jhula", query: "Ram Jhula bridge Rishikesh" },
      { name: "Parmarth Niketan Sunset Ganga Aarti", wiki: "Parmarth_Niketan", query: "Parmarth Niketan aarti Rishikesh" },
      { name: "White Water Rafting on Ganges Rapids", wiki: null, query: "White water river rafting Ganges Rishikesh" },
      { name: "The Beatles Ashram (Chaurasi Kutia)", wiki: "Chaurasi_Kutia", query: "Beatles Ashram Chaurasi Kutia Rishikesh" },
      { name: "Triveni Ghat Sacred Confluence Aarti", wiki: "Triveni_Ghat", query: "Triveni Ghat evening aarti Rishikesh" },
      { name: "Neer Garh Tiered Jungle Falls", wiki: null, query: "Neer Garh Waterfall Rishikesh" },
      { name: "Trayambakeshwar 13-Story Temple", wiki: null, query: "Trayambakeshwar Temple 13 stories Rishikesh" },
      { name: "Vashishta Gufa Riverside Meditation Cave", wiki: null, query: "Vashishta Gufa cave Rishikesh" },
      { name: "Shivpuri Riverside White Sand Beach", wiki: "Shivpuri,_Uttarakhand", query: "Shivpuri river beach sand Rishikesh" },
      { name: "Patna Waterfall & Limestone Caves", wiki: null, query: "Patna Waterfall Rishikesh" },
      { name: "Kunjapuri Devi Himalayan Sunrise", wiki: "Kunjapuri_Temple", query: "Kunjapuri Devi temple sunrise Himalayas" }
    ]
  },
  {
    id: "andaman",
    name: "Andaman Islands",
    state: "Andaman and Nicobar Islands, India",
    landmarks: [
      { name: "Radhanagar Beach (Swaraj Dweep)", wiki: "Radhanagar_Beach", query: "Radhanagar Beach Havelock Island" },
      { name: "Elephant Beach Coral Reefs", wiki: null, query: "Elephant Beach Havelock reef" },
      { name: "Cellular Jail National Memorial", wiki: "Cellular_Jail", query: "Cellular Jail Port Blair memorial" },
      { name: "Ross Island (Netaji Subhash Island) Heritage Ruins", wiki: "Ross_Island,_South_Andaman", query: "Ross Island British ruins banyan" },
      { name: "Natural Bridge Rock Arch on Neil Island", wiki: null, query: "Natural Bridge Neil Island rock arch" },
      { name: "Bharatpur Beach Turquoise Lagoon", wiki: null, query: "Bharatpur Beach Neil Island lagoon" },
      { name: "Kalapathar Beach Black Volcanic Rocks", wiki: null, query: "Kalapathar Beach Havelock rocks" },
      { name: "Baratang Island Mangrove Boat Safari", wiki: "Baratang_Island", query: "Baratang Island mangrove boat" },
      { name: "North Bay Island Lighthouse", wiki: "North_Bay_Island", query: "North Bay Island lighthouse Andaman" },
      { name: "Chidiya Tapu Sunset Point", wiki: "Chidiyatapu", query: "Chidiya Tapu sunset Andaman" },
      { name: "Andaman Marine Coral Reef Diving", wiki: null, query: "Scuba diving coral reef Andaman" },
      { name: "Jolly Buoy Island Marine Sanctuary", wiki: "Jolly_Buoy_Island", query: "Jolly Buoy Island clear water" }
    ]
  },
  {
    id: "darjeeling",
    name: "Darjeeling",
    state: "West Bengal, India",
    landmarks: [
      { name: "Tiger Hill Sunrise over Kanchenjunga", wiki: "Tiger_Hill,_Darjeeling", query: "Tiger Hill sunrise Kanchenjunga Darjeeling" },
      { name: "Batasia Loop & Himalayan Toy Train", wiki: "Batasia_Loop", query: "Batasia Loop toy train Darjeeling" },
      { name: "Happy Valley Tea Estate Emerald Terraces", wiki: "Happy_Valley_Tea_Estate", query: "Happy Valley Tea Estate Darjeeling" },
      { name: "Darjeeling Japanese Peace Pagoda", wiki: "Peace_Pagoda,_Darjeeling", query: "Peace Pagoda Japanese temple Darjeeling" },
      { name: "Chowrasta Mall Road Promenade", wiki: "Chowrasta", query: "Chowrasta Mall Road Darjeeling" },
      { name: "Himalayan Mountaineering Institute", wiki: "Himalayan_Mountaineering_Institute", query: "Himalayan Mountaineering Institute Darjeeling" },
      { name: "Mahakal Temple on Observatory Hill", wiki: "Observatory_Hill,_Darjeeling", query: "Mahakal Temple Observatory Hill Darjeeling" },
      { name: "Rock Garden Cascading Waterfalls", wiki: "Rock_Garden,_Darjeeling", query: "Rock Garden Chunnu falls Darjeeling" },
      { name: "Ghoom Monastery (Yiga Choeling)", wiki: "Ghoom_Monastery", query: "Ghoom Monastery Yiga Choeling Darjeeling" },
      { name: "Glenary's Heritage Colonial Promenade", wiki: null, query: "Glenarys bakery colonial Darjeeling" },
      { name: "Tinchuley Village Misty Ridge", wiki: "Tinchuley", query: "Tinchuley village mist Darjeeling" },
      { name: "Darjeeling Heritage Steam Railway", wiki: "Darjeeling_Himalayan_Railway", query: "Darjeeling Himalayan Railway steam UNESCO" }
    ]
  },
  {
    id: "agra",
    name: "Agra",
    state: "Uttar Pradesh, India",
    landmarks: [
      { name: "Taj Mahal Reflecting Pool & Symmetry", wiki: "Taj_Mahal", query: "Taj Mahal Agra reflection pool symmetry" },
      { name: "Taj Mahal from Yamuna Riverbank at Sunset", wiki: null, query: "Taj Mahal Yamuna river sunset bank" },
      { name: "Agra Fort & Jahangiri Mahal", wiki: "Agra_Fort", query: "Agra Fort Jahangiri Mahal red sandstone" },
      { name: "Mehtab Bagh Sunset View of Taj Mahal", wiki: "Mehtab_Bagh", query: "Mehtab Bagh view Taj Mahal Agra" },
      { name: "Buland Darwaza at Fatehpur Sikri", wiki: "Buland_Darwaza", query: "Buland Darwaza Fatehpur Sikri gateway" },
      { name: "Tomb of I'timad-ud-Daulah ('Baby Taj')", wiki: "Tomb_of_I%27timad-ud-Daulah", query: "Tomb of Itimad-ud-Daulah Baby Taj Agra" },
      { name: "Akbar's Tomb at Sikandra", wiki: "Tomb_of_Akbar_the_Great", query: "Akbar Tomb Sikandra gate Agra" },
      { name: "Diwan-i-Khas Marble Pavilion", wiki: "Diwan-i-Khas_(Agra_Fort)", query: "Diwan-i-Khas Agra Fort marble" },
      { name: "Panch Mahal at Fatehpur Sikri", wiki: "Panch_Mahal,_Fatehpur_Sikri", query: "Panch Mahal stepped palace Fatehpur Sikri" },
      { name: "Jama Masjid Agra Historic Mosque", wiki: "Jama_Mosque,_Agra", query: "Jama Masjid Agra mosque dome" },
      { name: "Pietra Dura Marble Floral Inlay Craft", wiki: "Pietra_dura", query: "Taj Mahal marble pietra dura floral inlay" },
      { name: "Taj Mahal Dome in Morning Golden Mist", wiki: null, query: "Morning mist sunrise light Taj Mahal dome" }
    ]
  },
  {
    id: "gulmarg",
    name: "Gulmarg",
    state: "Jammu & Kashmir, India",
    landmarks: [
      { name: "Gulmarg Gondola World's Highest Cable Car", wiki: "Gulmarg_Gondola", query: "Gulmarg Gondola cable car Apharwat" },
      { name: "Apharwat Peak Snow Slopes", wiki: "Apharwat_Peak", query: "Apharwat Peak summit snow Gulmarg" },
      { name: "Alpather Frozen Glacial Lake", wiki: "Alpather_Lake", query: "Alpather Lake frozen Gulmarg" },
      { name: "St. Mary's Church in Snow Meadow", wiki: "St._Mary's_Church,_Gulmarg", query: "St Marys Church Gulmarg snow" },
      { name: "Maharani Temple Green Hillock", wiki: "Maharani_Temple,_Gulmarg", query: "Maharani Temple Shiva knoll Gulmarg" },
      { name: "Gulmarg High Altitude Golf Course", wiki: "Gulmarg_Golf_Club", query: "Gulmarg Golf Course green fairways" },
      { name: "Strawberry Valley Summer Blossoms", wiki: null, query: "Strawberry Valley wildflowers Gulmarg" },
      { name: "Gulmarg Skiing & Snowboarding Slopes", wiki: null, query: "Gulmarg ski slope winter" },
      { name: "Drung Frozen Waterfall Icicles", wiki: null, query: "Drung waterfall frozen icicles Gulmarg" },
      { name: "Tangmarg Pine Mountain Highway", wiki: "Tangmarg", query: "Tangmarg pine forest road Gulmarg" },
      { name: "Khilanmarg Wildflower Valley", wiki: "Khilanmarg", query: "Khilanmarg meadow Gulmarg" },
      { name: "Ferozepur Nallah Mountain Stream", wiki: null, query: "Ferozepur Nallah mountain stream Gulmarg" }
    ]
  },
  {
    id: "tawang",
    name: "Tawang",
    state: "Arunachal Pradesh, India",
    landmarks: [
      { name: "Tawang Monastery 400-Year Citadel", wiki: "Tawang_Monastery", query: "Tawang Monastery Galden Namgyal Lhatse" },
      { name: "Sela Pass & Frozen Sela Lake (13,700 ft)", wiki: "Sela_Pass", query: "Sela Pass frozen lake gate Arunachal" },
      { name: "Madhuri (Sangetsar) Lake Tree Trunks", wiki: "Sangetsar_Lake", query: "Sangetsar Lake Madhuri tree trunks Tawang" },
      { name: "Nuranang (Bong Bong) 100m Waterfall", wiki: "Nuranang_Falls", query: "Nuranang Falls Bong Bong cascade Tawang" },
      { name: "Urgelling Monastery Sanctuary", wiki: "Urgelling_Monastery", query: "Urgelling Monastery birthplace Dalai Lama" },
      { name: "Tawang War Memorial Stupa", wiki: null, query: "Tawang War Memorial stupa flags" },
      { name: "Colossal Buddha Statue Overlooking Tawang", wiki: null, query: "Giant Buddha statue Tawang valley" },
      { name: "Bum La Pass High Himalayan Border", wiki: "Bum_La_Pass", query: "Bum La Pass mountain border Arunachal" },
      { name: "Pangateng Tso (PTSO) Alpine Lake", wiki: "P.T._Tso", query: "PTSO Lake Pangateng Tso alpine Tawang" },
      { name: "Chakzam 500-Year Historic Iron Bridge", wiki: "Chagzam_Bridge", query: "Chakzam iron bridge Tawang" },
      { name: "Gorichen Peak Himalayan Vista", wiki: "Gorichen_Peak", query: "Gorichen Peak Eastern Himalayas snow" },
      { name: "Monpa Heritage Village & Prayer Wheels", wiki: "Monpa_people", query: "Monpa village traditional stone houses" }
    ]
  },
  {
    id: "kutch",
    name: "Rann of Kutch",
    state: "Gujarat, India",
    landmarks: [
      { name: "Great Rann of Kutch Endless White Salt Desert", wiki: "Great_Rann_of_Kutch", query: "Great Rann of Kutch white salt desert" },
      { name: "Full Moon Night on the White Desert", wiki: null, query: "Rann of Kutch full moon white salt" },
      { name: "Kalo Dungar (Black Hill) Panoramic Lookout", wiki: "Kalo_Dungar", query: "Kalo Dungar Black Hill highest Kutch" },
      { name: "Rann Utsav Cultural Celebration", wiki: "Rann_Utsav", query: "Rann Utsav Dhordo tent city folk" },
      { name: "Traditional Kutchi Bhunga & Lippan Mirror Art", wiki: "Bhunga", query: "Bhunga house mirror Lippan Kutch" },
      { name: "Dholavira UNESCO Harappan Civilization Ruins", wiki: "Dholavira", query: "Dholavira Harappan site UNESCO Kutch" },
      { name: "White Desert Camel Safari", wiki: null, query: "White desert camel safari rider Kutch" },
      { name: "Vijay Vilas Palace on Mandvi Beach", wiki: "Vijay_Vilas_Palace", query: "Vijay Vilas Palace Mandvi beach dome" },
      { name: "Mandvi Historic Dhow Shipbuilding Yard", wiki: "Mandvi", query: "Mandvi beach shipbuilding yard wooden dhow" },
      { name: "Chhari Dhand Flamingo Wetland Reserve", wiki: "Chhari_Dhand_Conservation_Reserve", query: "Chhari Dhand wetland flamingos Kutch" },
      { name: "Rogan Art Fabric Painting Craft", wiki: "Rogan_painting", query: "Rogan art painting fabric Nirona Kutch" },
      { name: "Aina Mahal (Palace of Mirrors) in Bhuj", wiki: "Aina_Mahal", query: "Aina Mahal Palace of Mirrors Bhuj" }
    ]
  },
  {
    id: "maldives",
    name: "Maldives",
    state: "Maldives",
    landmarks: [
      { name: "Overwater Luxury Bungalows on Lagoon", wiki: null, query: "Maldives overwater bungalow lagoon" },
      { name: "Pristine Sandbank in Crystal Ocean", wiki: null, query: "Maldives white sandbank turquoise sea" },
      { name: "Aerial Coral Atoll Ring Reef", wiki: "Atoll", query: "Maldives atoll aerial view coral reef" },
      { name: "Vibrant Coral Reef & Sea Turtle", wiki: null, query: "Maldives underwater coral reef turtle" },
      { name: "Wooden Ocean Jetty Pier Walkway", wiki: null, query: "Maldives resort wooden jetty pier" },
      { name: "Malé Grand Friday Mosque & Harbor", wiki: "Mal%C3%A9_Friday_Mosque", query: "Male city Grand Friday Mosque Maldives" },
      { name: "Tropical Beach Sunset & Palm Silhouette", wiki: null, query: "Maldives tropical beach sunset palms" },
      { name: "Infinity Pool Blending with the Ocean", wiki: null, query: "Maldives resort infinity pool ocean" },
      { name: "Traditional Wooden Dhoni Cruising Atoll", wiki: "Dhoni", query: "Dhoni traditional wooden boat Maldives" },
      { name: "Snorkeling with Gentle Marine Rays", wiki: null, query: "Maldives snorkeling manta ray reef fish" },
      { name: "Vaadhoo Island Bioluminescent Shore", wiki: "Vaadhoo_(Raa_Atoll)", query: "Vaadhoo island bioluminescent beach Maldives" },
      { name: "Private White Sand Beach Villa", wiki: null, query: "Maldives luxury beach villa resort" }
    ]
  },
  {
    id: "switzerland",
    name: "Swiss Alps",
    state: "Switzerland",
    landmarks: [
      { name: "Matterhorn Peak & Stellisee Lake Reflection", wiki: "Matterhorn", query: "Matterhorn peak Stellisee Zermatt" },
      { name: "Lauterbrunnen Valley & Staubbach Falls", wiki: "Staubbach_Fall", query: "Lauterbrunnen valley Staubbach Falls" },
      { name: "Jungfraujoch Sphinx Observatory & Glacier", wiki: "Jungfraujoch", query: "Jungfraujoch Sphinx observatory Aletsch" },
      { name: "Landwasser Viaduct & Glacier Express", wiki: "Landwasser_Viaduct", query: "Landwasser Viaduct Glacier Express red train" },
      { name: "Château de Chillon on Lake Geneva", wiki: "Chillon_Castle", query: "Chillon Castle Lake Geneva Montreux" },
      { name: "Grindelwald First & Mount Eiger", wiki: "First_(Grindelwald)", query: "Grindelwald First cliff walk Eiger" },
      { name: "Chapel Bridge (Kapellbrücke) in Lucerne", wiki: "Kapellbr%C3%BCcke", query: "Kapellbruecke Chapel Bridge Lucerne" },
      { name: "Interlaken Lakes Panorama", wiki: "Interlaken", query: "Interlaken between Lake Thun Lake Brienz" },
      { name: "Zermatt Alpine Village Chalets", wiki: "Zermatt", query: "Zermatt alpine village wooden chalets" },
      { name: "Oeschinensee Turquoise Alpine Lake", wiki: "Oeschinen_Lake", query: "Oeschinensee mountain lake turquoise" },
      { name: "Swiss Alpine Pastures & Wildflowers", wiki: null, query: "Swiss Alps alpine meadow grazing cows" },
      { name: "Mount Pilatus Cogwheel Railway", wiki: "Pilatus_Railway", query: "Pilatus cogwheel railway dragon mountain" }
    ]
  },
  {
    id: "thailand",
    name: "Thailand",
    state: "Thailand",
    landmarks: [
      { name: "Wat Arun (Temple of Dawn) on River", wiki: "Wat_Arun", query: "Wat Arun Temple of Dawn Bangkok" },
      { name: "Grand Palace & Wat Phra Kaew", wiki: "Grand_Palace", query: "Grand Palace Wat Phra Kaew Bangkok" },
      { name: "Maya Bay & Phi Phi Limestone Karsts", wiki: "Maya_Bay", query: "Maya Bay Phi Phi islands lagoon" },
      { name: "Railay Beach & Phra Nang Cave", wiki: "Railay_Beach", query: "Railay Beach Phra Nang cave Krabi" },
      { name: "Wat Rong Khun (White Temple)", wiki: "Wat_Rong_Khun", query: "Wat Rong Khun White Temple Chiang Rai" },
      { name: "Damnoen Saduak Floating Market", wiki: "Damnoen_Saduak_Floating_Market", query: "Damnoen Saduak floating market Bangkok" },
      { name: "Wat Phra That Doi Suthep Golden Chedi", wiki: "Wat_Phra_That_Doi_Suthep", query: "Wat Phra That Doi Suthep Chiang Mai" },
      { name: "James Bond Island (Ko Tapu)", wiki: "Khao_Phing_Kan", query: "James Bond Island Ko Tapu Phang Nga" },
      { name: "Ayutthaya UNESCO Buddha in Tree Roots", wiki: "Ayutthaya_Historical_Park", query: "Ayutthaya Buddha head tree roots ruins" },
      { name: "Similan Islands Coral Waters", wiki: "Similan_Islands", query: "Similan Islands turquoise sea boulders" },
      { name: "Koh Samui Tropical Palm Shore", wiki: "Ko_Samui", query: "Koh Samui tropical beach palm trees" },
      { name: "Yi Peng Sky Lantern Festival", wiki: "Loi_Krathong", query: "Chiang Mai Yi Peng lantern festival" }
    ]
  },
  {
    id: "paris",
    name: "Paris",
    state: "France",
    landmarks: [
      { name: "Eiffel Tower from Champ de Mars", wiki: "Eiffel_Tower", query: "Eiffel Tower Champ de Mars Paris" },
      { name: "Louvre Museum Glass Pyramid", wiki: "Louvre_Pyramid", query: "Louvre Museum glass pyramid palace" },
      { name: "Notre-Dame Cathedral & River Seine", wiki: "Notre-Dame_de_Paris", query: "Notre Dame de Paris cathedral Seine" },
      { name: "Arc de Triomphe & Champs-Élysées", wiki: "Arc_de_Triomphe", query: "Arc de Triomphe Champs Elysees Paris" },
      { name: "Sacré-Cœur Basilica atop Montmartre", wiki: "Sacr%C3%A9-C%C5%93ur,_Paris", query: "Sacre Coeur Basilica Montmartre Paris" },
      { name: "Pont Alexandre III Gilded Bridge", wiki: "Pont_Alexandre_III", query: "Pont Alexandre III ornate bridge Seine" },
      { name: "Palais Garnier Paris National Opera", wiki: "Palais_Garnier", query: "Palais Garnier Paris Opera House facade" },
      { name: "Jardin du Luxembourg & Medici Fountain", wiki: "Jardin_du_Luxembourg", query: "Jardin du Luxembourg Medici fountain" },
      { name: "Sainte-Chapelle Stained Glass Windows", wiki: "Sainte-Chapelle", query: "Sainte Chapelle stained glass Gothic Paris" },
      { name: "Classic Parisian Sidewalk Bistrot", wiki: "Bistrot", query: "Parisian sidewalk bistro cafe terrace" },
      { name: "Place des Vosges Historic Arcades", wiki: "Place_des_Vosges", query: "Place des Vosges Marais brick arches" },
      { name: "Paris Skyline Golden Hour View", wiki: null, query: "Sunset over Paris rooftops Montmartre" }
    ]
  },
  {
    id: "singapore",
    name: "Singapore",
    state: "Singapore",
    landmarks: [
      { name: "Marina Bay Sands Waterfront Skyline", wiki: "Marina_Bay_Sands", query: "Marina Bay Sands skyline Singapore" },
      { name: "Gardens by the Bay Supertree Grove", wiki: "Gardens_by_the_Bay", query: "Gardens by the Bay Supertree Grove" },
      { name: "Cloud Forest Conservatory 35m Waterfall", wiki: null, query: "Cloud Forest indoor waterfall Singapore" },
      { name: "The Merlion Landmark on Marina Bay", wiki: "Merlion", query: "Merlion statue water spout Marina Bay" },
      { name: "Jewel Changi HSBC Rain Vortex", wiki: "Jewel_Changi_Airport", query: "Jewel Changi Rain Vortex waterfall" },
      { name: "Singapore Flyer Observation Wheel", wiki: "Singapore_Flyer", query: "Singapore Flyer giant observation wheel" },
      { name: "Buddha Tooth Relic Temple (Chinatown)", wiki: "Buddha_Tooth_Relic_Temple_and_Museum", query: "Buddha Tooth Relic Temple Chinatown Singapore" },
      { name: "House of Tan Teng Niah (Little India)", wiki: "Former_House_of_Tan_Teng_Niah", query: "House of Tan Teng Niah Little India" },
      { name: "Clarke Quay Riverside Promenade", wiki: "Clarke_Quay", query: "Clarke Quay historic river warehouses" },
      { name: "Sentosa Island Palawan Suspension Bridge", wiki: "Sentosa", query: "Palawan Beach Sentosa suspension bridge" },
      { name: "Helix Bridge Architectural Walkway", wiki: "Helix_Bridge", query: "Helix Bridge pedestrian walkway Singapore" },
      { name: "National Orchid Garden (Botanic Gardens)", wiki: "Singapore_Botanic_Gardens", query: "Singapore Botanic Gardens National Orchid" }
    ]
  },
  {
    id: "dubai",
    name: "Dubai",
    state: "United Arab Emirates",
    landmarks: [
      { name: "Burj Khalifa & Dubai Fountain", wiki: "Burj_Khalifa", query: "Burj Khalifa world tallest building fountain" },
      { name: "Burj Al Arab Luxury Sail Hotel", wiki: "Burj_Al_Arab", query: "Burj Al Arab luxury sail hotel Jumeirah" },
      { name: "Palm Jumeirah Aerial Archipelago", wiki: "Palm_Jumeirah", query: "Palm Jumeirah aerial view fronds Dubai" },
      { name: "Dubai Marina Skyscrapers & Promenade", wiki: "Dubai_Marina", query: "Dubai Marina skyline yachts promenade" },
      { name: "Museum of the Future", wiki: "Museum_of_the_Future", query: "Museum of the Future Arabic calligraphy Dubai" },
      { name: "Dubai Desert Conservation Dunes", wiki: "Dubai_Desert_Conservation_Reserve", query: "Dubai desert safari sand dunes 4x4" },
      { name: "The Dubai Frame Architectural Landmark", wiki: "Dubai_Frame", query: "Dubai Frame monument Zabeel Park" },
      { name: "Dubai Creek & Traditional Abra Boat", wiki: "Dubai_Creek", query: "Dubai Creek traditional wooden abra boat" },
      { name: "Al Fahidi Historic Wind-Tower District", wiki: "Al_Fahidi_Historical_Neighbourhood", query: "Al Fahidi Historical Neighbourhood wind towers" },
      { name: "Dubai Miracle Garden Floral Castle", wiki: "Dubai_Miracle_Garden", query: "Dubai Miracle Garden floral castle flower" },
      { name: "Atlantis The Royal on Palm Jumeirah", wiki: "Atlantis_The_Royal", query: "Atlantis The Royal Palm Jumeirah Dubai" },
      { name: "Dubai Aquarium Underwater Marine Tunnel", wiki: null, query: "Dubai Aquarium underwater tunnel sharks" }
    ]
  },
  {
    id: "istanbul",
    name: "Istanbul",
    state: "Türkiye",
    landmarks: [
      { name: "Hagia Sophia (Ayasofya) Imperial Mosque", wiki: "Hagia_Sophia", query: "Hagia Sophia Ayasofya grand dome Istanbul" },
      { name: "Blue Mosque (Sultanahmet Camii)", wiki: "Sultan_Ahmed_Mosque", query: "Blue Mosque Sultanahmet cascading domes" },
      { name: "Bosphorus Strait & Suspension Bridge", wiki: "Bosphorus_Bridge", query: "Bosphorus Bridge 15 July Martyrs ferry" },
      { name: "Galata Tower Historic Lookout", wiki: "Galata_Tower", query: "Galata Tower Golden Horn old city Istanbul" },
      { name: "Grand Bazaar (Kapalıçarşı) Vaulted Street", wiki: "Grand_Bazaar,_Istanbul", query: "Grand Bazaar Kapalicarsi lantern Istanbul" },
      { name: "Topkapi Palace Imperial Courtyards", wiki: "Topkap%C4%B1_Palace", query: "Topkapi Palace imperial courtyard Istanbul" },
      { name: "Basilica Cistern (Yerebatan Sarnıcı)", wiki: "Basilica_Cistern", query: "Basilica Cistern Yerebatan columns Istanbul" },
      { name: "Ortaköy Mosque on the Waterfront", wiki: "Ortak%C3%B6y_Mosque", query: "Ortakoy Mosque waterfront Bosphorus Istanbul" },
      { name: "Spice Bazaar (Mısır Çarşısı)", wiki: "Spice_Bazaar", query: "Spice Bazaar Misir Carsisi Istanbul" },
      { name: "Balat Heritage Colorful Wooden Houses", wiki: "Balat,_Istanbul", query: "Balat colorful wooden houses Istanbul" },
      { name: "Süleymaniye Mosque Courtyard", wiki: "S%C3%BCleymaniye_Mosque", query: "Suleymaniye Mosque panoramic courtyard view" },
      { name: "Traditional Turkish Tea by the Bosphorus", wiki: "Turkish_tea", query: "Turkish tea glass cay Bosphorus seagulls" }
    ]
  },
  {
    id: "cape-town",
    name: "Cape Town",
    state: "South Africa",
    landmarks: [
      { name: "Table Mountain Skyline from Table Bay", wiki: "Table_Mountain", query: "Table Mountain Lions Head skyline Cape Town" },
      { name: "Table Mountain Aerial Cableway & Summit", wiki: "Table_Mountain_Aerial_Cableway", query: "Table Mountain aerial cableway summit Cape Town" },
      { name: "Boulders Beach African Penguin Colony", wiki: "Boulders_Beach", query: "Boulders Beach African penguin Simon Town" },
      { name: "Bo-Kaap Bright Heritage Quarter", wiki: "Bo-Kaap", query: "Bo-Kaap colorful houses cobbled Cape Town" },
      { name: "Cape of Good Hope & Cape Point Cliffs", wiki: "Cape_of_Good_Hope", query: "Cape of Good Hope Cape Point cliffs South Africa" },
      { name: "V&A Waterfront & Harbor Promenade", wiki: "Victoria_%26_Alfred_Waterfront", query: "Victoria and Alfred Waterfront Table Mountain" },
      { name: "Chapman's Peak Dramatic Ocean Drive", wiki: "Chapman%27s_Peak_Drive", query: "Chapmans Peak Drive coastal mountain road" },
      { name: "Camps Bay Beach & Twelve Apostles", wiki: "Camps_Bay", query: "Camps Bay Beach Twelve Apostles Cape Town" },
      { name: "Kirstenbosch Boomslang Tree Canopy Walk", wiki: "Kirstenbosch_National_Botanical_Garden", query: "Kirstenbosch Botanical Garden Boomslang walkway" },
      { name: "Muizenberg Beach Iconic Bathing Huts", wiki: "Muizenberg", query: "Muizenberg Beach colorful bathing huts Cape Town" },
      { name: "Robben Island Historic Sanctuary", wiki: "Robben_Island", query: "Robben Island historic lighthouse Table Bay" },
      { name: "Constantia Valley Wine Estate", wiki: "Groot_Constantia", query: "Groot Constantia Cape Dutch wine estate" }
    ]
  },
  {
    id: "ananthapuram",
    name: "Ananthapuram",
    state: "Andhra Pradesh, India",
    landmarks: [
      { name: "Lepakshi Veerabhadra Temple Hanging Pillar", wiki: "Veerabhadra_Temple,_Lepakshi", query: "Lepakshi Veerabhadra temple hanging pillar" },
      { name: "Lepakshi Monolithic Nandi (Largest in India)", wiki: null, query: "Lepakshi monolithic Nandi bull Andhra" },
      { name: "Gooty Fort Ancient Hilltop Citadel", wiki: "Gooty_Fort", query: "Gooty Fort citadel hilltop Andhra" },
      { name: "Penukonda Fort & Gagan Mahal Palace", wiki: "Penukonda_Fort", query: "Penukonda Fort Gagan Mahal summer palace" },
      { name: "Anantapur Historic Clock Tower", wiki: null, query: "Anantapur Clock Tower city centre" },
      { name: "ISKCON Temple Anantapur", wiki: null, query: "ISKCON Temple Anantapur golden spire" },
      { name: "Singanamala Lake & Hills", wiki: null, query: "Singanamala hill lake Ananthapuram" },
      { name: "Bugga Ramalingeswara Temple Tadipatri", wiki: "Bugga_Ramalingeswara_Swamy_Temple,_Tadipatri", query: "Bugga Ramalingeswara Swamy Temple Tadipatri" },
      { name: "Tadipatri Chintala Venkataramana Temple", wiki: "Chintalarayaswami_Temple", query: "Chintala Venkataramana Swamy Temple Tadipatri" },
      { name: "Aluru Kona Natural Waterfalls", wiki: null, query: "Aluru Kona waterfalls temple Anantapur" },
      { name: "Rayadurg Fort Historic Bastions", wiki: "Rayadurg_Fort", query: "Rayadurg Fort ramparts hill Andhra" },
      { name: "Dharmavaram Traditional Silk Handloom", wiki: "Dharmavaram_handloom_pattu_saris_and_paavadas", query: "Dharmavaram silk weaving saree handloom" }
    ]
  },
  {
    id: "kadiri",
    name: "Kadiri",
    state: "Andhra Pradesh, India",
    landmarks: [
      { name: "Thimmamma Marrimanu (World's Largest Banyan Tree)", wiki: "Thimmamma_Marrimanu", query: "Thimmamma Marrimanu banyan tree Kadiri" },
      { name: "Thimmamma Marrimanu Walking Canopy Trails", wiki: null, query: "Thimmamma Marrimanu canopy aerial roots" },
      { name: "Sri Lakshmi Narasimha Swamy Temple Gopuram", wiki: "Kadiri_Lakshmi_Narasimha_Swamy_Temple", query: "Sri Lakshmi Narasimha Swamy Temple Kadiri" },
      { name: "Kadiri Temple Sacred Pushkarini (Tank)", wiki: null, query: "Kadiri temple stone pushkarini pond" },
      { name: "Kadiri Temple Sacred Procession Chariot", wiki: null, query: "Kadiri temple wooden chariot Brahmostavam" },
      { name: "Katarupalli Yogi Vemana Samadhi", wiki: "Katarupalli", query: "Katarupalli Yogi Vemana Samadhi Kadiri" },
      { name: "Kadiri Granite Hill Ranges & Valley", wiki: null, query: "Kadiri rocky hills valley landscape" },
      { name: "Battalapalli Historic Stone Heritage Temple", wiki: null, query: "Battalapalli stone temple historic Kadiri" },
      { name: "Sacred Banyan Tree Trunk & Devotee Shrine", wiki: null, query: "Thimmamma Marrimanu giant tree trunk roots" },
      { name: "Kadiri Annual Brahmostavam Procession", wiki: null, query: "Kadiri Narasimha Swamy temple festival procession" },
      { name: "Kadiri Countryside Scenic Hillscapes", wiki: null, query: "Kadiri countryside rural hills Andhra" },
      { name: "Ancient Banyan Root System of Thimmamma Marrimanu", wiki: null, query: "Ficus benghalensis giant banyan tree Thimmamma" }
    ]
  }
];

async function run() {
  console.log(`Starting gallery fetching for ${DESTINATIONS.length} destinations...`);
  const masterGalleries = {};
  const masterLandmarks = {};
  const seenUrls = new Set();
  const summaryReport = [];

  for (let d = 0; d < DESTINATIONS.length; d++) {
    const dest = DESTINATIONS[d];
    console.log(`\n[${d + 1}/${DESTINATIONS.length}] ${dest.name} (${dest.landmarks.length} landmarks)...`);
    const verifiedImages = [];
    const verifiedLandmarks = [];

    for (let l = 0; l < dest.landmarks.length; l++) {
      const lm = dest.landmarks[l];
      let photo = null;

      // 1. Try Wikipedia Summary API if article title provided
      if (lm.wiki) {
        photo = await getWikiSummaryPhoto(lm.wiki);
        if (photo && seenUrls.has(photo.url)) {
          photo = null; // don't repeat URL
        }
      }

      // 2. Try Wikimedia Commons search
      if (!photo && lm.query) {
        photo = await searchCommonsPhoto(lm.query);
        if (photo && seenUrls.has(photo.url)) {
          photo = null;
        }
      }

      // 3. Try broader query
      if (!photo && lm.query) {
        const shortQuery = lm.query.split(" ").slice(0, 3).join(" ");
        photo = await searchCommonsPhoto(shortQuery);
        if (photo && seenUrls.has(photo.url)) {
          photo = null;
        }
      }

      if (photo) {
        seenUrls.add(photo.url);
        verifiedImages.push(photo.url);
        verifiedLandmarks.push(lm.name);
        console.log(`  ✓ (${verifiedImages.length}/12) ${lm.name} -> ${photo.url.slice(0, 70)}...`);
      } else {
        console.log(`  ✗ Need review: ${lm.name}`);
      }
    }

    masterGalleries[dest.id] = verifiedImages;
    masterLandmarks[dest.id] = verifiedLandmarks;

    summaryReport.push({
      destId: dest.id,
      name: dest.name,
      count: verifiedImages.length,
      verified: verifiedImages.length >= 10 ? "Yes" : "Needs review"
    });
  }

  // Save JSON artifacts
  fs.writeFileSync(
    path.join(__dirname, "verified-galleries.json"),
    JSON.stringify({ galleries: masterGalleries, landmarks: masterLandmarks, report: summaryReport }, null, 2),
    "utf-8"
  );

  console.log("\n================ SUMMARY ================");
  console.table(summaryReport);
}

run().catch((e) => console.error("FATAL:", e));
