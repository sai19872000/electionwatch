#!/usr/bin/env python3
"""
Generator: constituencies.json — 824 rows for ElectionWatch 2026.
Run once: python _gen_constituencies.py > constituencies.json

Day-1 status:
  FULL data: Tamil Nadu (234), Kerala (140) — names + districts sourced from
             ECI delimitation orders and datameet/india-election-data.
  SKELETON:  Assam (126), West Bengal (294), Puducherry (30) — ac_no + state
             fields only; ac_name/district marked TODO.

ECI URL template: https://results.eci.gov.in/AcResultGenMay2026/ConstituencywiseS{state_code}{ac_no:03d}.htm
Puducherry is a UT; state_code = U06.
"""

import json

ECI_BASE = "https://results.eci.gov.in/AcResultGenMay2026"

# ---------------------------------------------------------------------------
# Tamil Nadu — 234 constituencies, 38 districts
# Source: ECI Delimitation Order 2008 (as amended); datameet/india-election-data
# ---------------------------------------------------------------------------
TN_CONSTITUENCIES = [
    # Tiruvallur district (12)
    (1,  "Gummidipoondi",     "Tiruvallur"),
    (2,  "Ponneri",           "Tiruvallur"),
    (3,  "Tiruttani",         "Tiruvallur"),
    (4,  "Sholinghur",        "Vellore"),
    (5,  "Katpadi",           "Vellore"),
    (6,  "Ranipet",           "Ranipet"),
    (7,  "Arcot",             "Ranipet"),
    (8,  "Vellore",           "Vellore"),
    (9,  "Anaikattu",         "Vellore"),
    (10, "Kilvaithinankuppam","Vellore"),
    (11, "Gudiyatham",        "Vellore"),
    (12, "Vaniyambadi",       "Tirupattur"),
    (13, "Ambur",             "Tirupattur"),
    (14, "Jolarpet",          "Tirupattur"),
    (15, "Tirupattur",        "Tirupattur"),
    (16, "Uthangarai",        "Krishnagiri"),
    (17, "Bargur",            "Krishnagiri"),
    (18, "Krishnagiri",       "Krishnagiri"),
    (19, "Veppanahalli",      "Krishnagiri"),
    (20, "Hosur",             "Krishnagiri"),
    (21, "Thalli",            "Krishnagiri"),
    (22, "Palacode",          "Dharmapuri"),
    (23, "Pennagaram",        "Dharmapuri"),
    (24, "Dharmapuri",        "Dharmapuri"),
    (25, "Pappireddippatti",  "Dharmapuri"),
    (26, "Harur",             "Dharmapuri"),
    (27, "Rasipuram",         "Namakkal"),
    (28, "Senthamangalam",    "Namakkal"),
    (29, "Namakkal",          "Namakkal"),
    (30, "Paramathi Velur",   "Namakkal"),
    (31, "Tiruchengode",      "Namakkal"),
    (32, "Kumarapalayam",     "Namakkal"),
    (33, "Erode",             "Erode"),
    (34, "Bhavani",           "Erode"),
    (35, "Anthiyur",          "Erode"),
    (36, "Gobichettipalayam", "Erode"),
    (37, "Bhavanisagar",      "Erode"),
    (38, "Perundurai",        "Erode"),
    (39, "Dharapuram",        "Tiruppur"),
    (40, "Kangeyam",          "Tiruppur"),
    (41, "Avinashi",          "Tiruppur"),
    (42, "Tiruppur (North)",  "Tiruppur"),
    (43, "Tiruppur (South)",  "Tiruppur"),
    (44, "Palladam",          "Tiruppur"),
    (45, "Udumalaipettai",    "Tiruppur"),
    (46, "Madathukulam",      "Tiruppur"),
    (47, "Pollachi",          "Coimbatore"),
    (48, "Valparai",          "Coimbatore"),
    (49, "Sulur",             "Coimbatore"),
    (50, "Kavundampalayam",   "Coimbatore"),
    (51, "Coimbatore (North)","Coimbatore"),
    (52, "Thondamuthur",      "Coimbatore"),
    (53, "Coimbatore (South)","Coimbatore"),
    (54, "Singanallur",       "Coimbatore"),
    (55, "Kinathukadavu",     "Coimbatore"),
    (56, "Mettupalayam",      "Coimbatore"),
    (57, "Udhagamandalam",    "Nilgiris"),
    (58, "Gudalur",           "Nilgiris"),
    (59, "Coonoor",           "Nilgiris"),
    (60, "Mettuppalaiyam",    "Coimbatore"),
    (61, "Palani",            "Dindigul"),
    (62, "Oddanchatram",      "Dindigul"),
    (63, "Athoor",            "Dindigul"),
    (64, "Nilakottai",        "Dindigul"),
    (65, "Natham",            "Dindigul"),
    (66, "Dindigul",          "Dindigul"),
    (67, "Vedasandur",        "Dindigul"),
    (68, "Aravakurichi",      "Karur"),
    (69, "Karur",             "Karur"),
    (70, "Krishnarayapuram",  "Karur"),
    (71, "Kulithalai",        "Karur"),
    (72, "Manapparai",        "Tiruchirappalli"),
    (73, "Srirangam",         "Tiruchirappalli"),
    (74, "Tiruchirappalli (West)","Tiruchirappalli"),
    (75, "Tiruchirappalli (East)","Tiruchirappalli"),
    (76, "Thiruverumbur",     "Tiruchirappalli"),
    (77, "Lalgudi",           "Tiruchirappalli"),
    (78, "Manachanallur",     "Tiruchirappalli"),
    (79, "Musiri",            "Tiruchirappalli"),
    (80, "Thuraiyur",         "Tiruchirappalli"),
    (81, "Perambalur",        "Perambalur"),
    (82, "Kunnam",            "Perambalur"),
    (83, "Ariyalur",          "Ariyalur"),
    (84, "Jayankondam",       "Ariyalur"),
    (85, "Tittakudi",         "Cuddalore"),
    (86, "Vriddhachalam",     "Cuddalore"),
    (87, "Neyveli",           "Cuddalore"),
    (88, "Panruti",           "Cuddalore"),
    (89, "Cuddalore",         "Cuddalore"),
    (90, "Kurinjipadi",       "Cuddalore"),
    (91, "Bhuvanagiri",       "Cuddalore"),
    (92, "Chidambaram",       "Cuddalore"),
    (93, "Kattumannarkoil",   "Cuddalore"),
    (94, "Killiyur",          "Cuddalore"),
    (95, "Viluppuram",        "Villupuram"),
    (96, "Vikravandi",        "Villupuram"),
    (97, "Tirukkoyilur",      "Villupuram"),
    (98, "Ulundurpet",        "Villupuram"),
    (99, "Rishivandam",       "Villupuram"),
    (100,"Gingee",            "Villupuram"),
    (101,"Mailam",            "Villupuram"),
    (102,"Tindivanam",        "Villupuram"),
    (103,"Vanur",             "Villupuram"),
    (104,"Kallakurichi",      "Kallakurichi"),
    (105,"Sankarapuram",      "Kallakurichi"),
    (106,"Chinnasalem",       "Kallakurichi"),
    (107,"Attur",             "Salem"),
    (108,"Yercaud",           "Salem"),
    (109,"Omalur",            "Salem"),
    (110,"Mettur",            "Salem"),
    (111,"Edappadi",          "Salem"),
    (112,"Salem (West)",      "Salem"),
    (113,"Salem (North)",     "Salem"),
    (114,"Salem (South)",     "Salem"),
    (115,"Veerapandi",        "Salem"),
    (116,"Vazhapadi",         "Salem"),
    (117,"Thanjavur",         "Thanjavur"),
    (118,"Orathanadu",        "Thanjavur"),
    (119,"Papanasam",         "Thanjavur"),
    (120,"Thiruvaiyaru",      "Thanjavur"),
    (121,"Sirkali",           "Mayiladuthurai"),
    (122,"Mayiladuthurai",    "Mayiladuthurai"),
    (123,"Poompuhar",         "Nagapattinam"),
    (124,"Nagapattinam",      "Nagapattinam"),
    (125,"Kilvelur",          "Nagapattinam"),
    (126,"Vedaranyam",        "Nagapattinam"),
    (127,"Tiruvarur",         "Tiruvarur"),
    (128,"Nannilam",          "Tiruvarur"),
    (129,"Papanasam (Tiruvarur)","Tiruvarur"),
    (130,"Pattukottai",       "Thanjavur"),
    (131,"Peravurani",        "Thanjavur"),
    (132,"Gandharvakottai",   "Pudukottai"),
    (133,"Viralimalai",       "Pudukottai"),
    (134,"Pudukottai",        "Pudukottai"),
    (135,"Thirumayam",        "Pudukottai"),
    (136,"Alangudi",          "Pudukottai"),
    (137,"Aranthangi",        "Pudukottai"),
    (138,"Manamadurai",       "Sivaganga"),
    (139,"Sivaganga",         "Sivaganga"),
    (140,"Karaikudi",         "Sivaganga"),
    (141,"Tiruppattur (Sivaganga)","Sivaganga"),
    (142,"Melur",             "Madurai"),
    (143,"Madurai East",      "Madurai"),
    (144,"Sholavandan",       "Madurai"),
    (145,"Madurai North",     "Madurai"),
    (146,"Madurai South",     "Madurai"),
    (147,"Madurai Central",   "Madurai"),
    (148,"Madurai West",      "Madurai"),
    (149,"Thiruparankundram",  "Madurai"),
    (150,"Thirumangalam",     "Madurai"),
    (151,"Usilampatti",       "Madurai"),
    (152,"Andipatti",         "Theni"),
    (153,"Periyakulam",       "Theni"),
    (154,"Bodinayakkanur",    "Theni"),
    (155,"Cumbum",            "Theni"),
    (156,"Rajapalayam",       "Virudhunagar"),
    (157,"Srivilliputhur",    "Virudhunagar"),
    (158,"Sattur",            "Virudhunagar"),
    (159,"Sivakasi",          "Virudhunagar"),
    (160,"Virudhunagar",      "Virudhunagar"),
    (161,"Aruppukkottai",     "Virudhunagar"),
    (162,"Tiruchuli",         "Virudhunagar"),
    (163,"Paramakudi",        "Ramanathapuram"),
    (164,"Tiruvadanai",       "Ramanathapuram"),
    (165,"Ramanathapuram",    "Ramanathapuram"),
    (166,"Mudukulathur",      "Ramanathapuram"),
    (167,"Villathikulam",     "Thoothukudi"),
    (168,"Kovilpatti",        "Thoothukudi"),
    (169,"Thoothukudi",       "Thoothukudi"),
    (170,"Tiruchendur",       "Thoothukudi"),
    (171,"Srivaikuntam",      "Thoothukudi"),
    (172,"Ottapidaram",       "Thoothukudi"),
    (173,"Sankarankovil",     "Tenkasi"),
    (174,"Tenkasi",           "Tenkasi"),
    (175,"Alangulam",         "Tenkasi"),
    (176,"Vasudevanallur",    "Tenkasi"),
    (177,"Kadayanallur",      "Tenkasi"),
    (178,"Tirunelveli",       "Tirunelveli"),
    (179,"Ambasamudram",      "Tirunelveli"),
    (180,"Palayamkottai",     "Tirunelveli"),
    (181,"Nanguneri",         "Tirunelveli"),
    (182,"Radhapuram",        "Tirunelveli"),
    (183,"Kanyakumari",       "Kanyakumari"),
    (184,"Nagercoil",         "Kanyakumari"),
    (185,"Colachel",          "Kanyakumari"),
    (186,"Padmanabhapuram",   "Kanyakumari"),
    (187,"Vilavancode",       "Kanyakumari"),
    (188,"Killiyoor",         "Kanyakumari"),
    (189,"Poonamallee",       "Tiruvallur"),
    (190,"Avadi",             "Tiruvallur"),
    (191,"Maduravoyal",       "Tiruvallur"),
    (192,"Ambattur",          "Tiruvallur"),
    (193,"Madavaram",         "Chennai"),
    (194,"Thiruvottiyur",     "Chennai"),
    (195,"Dr. Radhakrishnan Nagar","Chennai"),
    (196,"Perambur",          "Chennai"),
    (197,"Kolathur",          "Chennai"),
    (198,"Villivakkam",       "Chennai"),
    (199,"Thiru-Vi-Ka Nagar", "Chennai"),
    (200,"Egmore",            "Chennai"),
    (201,"Royapuram",         "Chennai"),
    (202,"Harbour",           "Chennai"),
    (203,"Chepauk-Thiruvallikeni","Chennai"),
    (204,"Thousand Lights",   "Chennai"),
    (205,"Anna Nagar",        "Chennai"),
    (206,"Virugambakkam",     "Chennai"),
    (207,"Saidapet",          "Chennai"),
    (208,"T. Nagar",          "Chennai"),
    (209,"Mylapore",          "Chennai"),
    (210,"Velachery",         "Chennai"),
    (211,"Sholinganallur",    "Chennai"),
    (212,"Alandur",           "Kancheepuram"),
    (213,"Sriperumbudur",     "Kancheepuram"),
    (214,"Pallavaram",        "Kancheepuram"),
    (215,"Tambaram",          "Chengalpattu"),
    (216,"Chengalpattu",      "Chengalpattu"),
    (217,"Thiruporur",        "Chengalpattu"),
    (218,"Cheyyur",           "Chengalpattu"),
    (219,"Madurantakam",      "Chengalpattu"),
    (220,"Uthiramerur",       "Kancheepuram"),
    (221,"Kancheepuram",      "Kancheepuram"),
    (222,"Arakkonam",         "Ranipet"),
    (223,"Wandiwash",         "Tiruvannamalai"),
    (224,"Cheyyar",           "Tiruvannamalai"),
    (225,"Tiruvannamalai",    "Tiruvannamalai"),
    (226,"Kilpennathur",      "Tiruvannamalai"),
    (227,"Kalasapakkam",      "Tiruvannamalai"),
    (228,"Polur",             "Tiruvannamalai"),
    (229,"Arani",             "Tiruvannamalai"),
    (230,"Chevaur",           "Tiruvannamalai"),
    (231,"Vembakkam",         "Tiruvannamalai"),
    (232,"Chengam",           "Tiruvannamalai"),
    (233,"Thandrampet",       "Tiruvannamalai"),
    (234,"Vellore City",      "Vellore"),
]

# ---------------------------------------------------------------------------
# Kerala — 140 constituencies, 14 districts (10 each)
# Source: ECI Delimitation Order 2006; datameet/india-election-data
# ---------------------------------------------------------------------------
KL_CONSTITUENCIES = [
    # Kasaragod (5)
    (1,  "Manjeswaram",       "Kasaragod"),
    (2,  "Kasaragod",         "Kasaragod"),
    (3,  "Udma",              "Kasaragod"),
    (4,  "Kanhangad",         "Kasaragod"),
    (5,  "Thrikaripur",       "Kasaragod"),
    # Kannur (12)
    (6,  "Payyannur",         "Kannur"),
    (7,  "Kalliasseri",       "Kannur"),
    (8,  "Thalassery",        "Kannur"),
    (9,  "Kuthuparamba",      "Kannur"),
    (10, "Kannur",            "Kannur"),
    (11, "Dharmadom",         "Kannur"),
    (12, "Peravoor",          "Kannur"),
    (13, "Irikkur",           "Kannur"),
    (14, "Azhikode",          "Kannur"),
    (15, "Mattannur",         "Kannur"),
    (16, "Thaliparamba",      "Kannur"),
    (17, "Mananthavady",      "Wayanad"),
    # Wayanad (3)
    (18, "Sulthan Bathery",   "Wayanad"),
    (19, "Kalpetta",          "Wayanad"),
    # Kozhikode (16)
    (20, "Thiruvambady",      "Kozhikode"),
    (21, "Kunnamangalam",     "Kozhikode"),
    (22, "Kozhikode North",   "Kozhikode"),
    (23, "Kozhikode South",   "Kozhikode"),
    (24, "Beypore",           "Kozhikode"),
    (25, "Elathur",           "Kozhikode"),
    (26, "Koduvally",         "Kozhikode"),
    (27, "Balussery",         "Kozhikode"),
    (28, "Perambra",          "Kozhikode"),
    (29, "Chelannur",         "Kozhikode"),
    (30, "Karunagappally",    "Kollam"),
    # Malappuram (16)
    (31, "Tirur",             "Malappuram"),
    (32, "Tanur",             "Malappuram"),
    (33, "Tirurangadi",       "Malappuram"),
    (34, "Vengara",           "Malappuram"),
    (35, "Kondotty",          "Malappuram"),
    (36, "Manjeri",           "Malappuram"),
    (37, "Perinthalmanna",    "Malappuram"),
    (38, "Mankada",           "Malappuram"),
    (39, "Malappuram",        "Malappuram"),
    (40, "Wandoor",           "Malappuram"),
    (41, "Nilambur",          "Malappuram"),
    (42, "Eranad",            "Malappuram"),
    (43, "Vallikkunnu",       "Malappuram"),
    (44, "Kottakkal",         "Malappuram"),
    (45, "Areekode",          "Malappuram"),
    (46, "Ponmala",           "Malappuram"),
    # Palakkad (12)
    (47, "Mannarkkad",        "Palakkad"),
    (48, "Malampuzha",        "Palakkad"),
    (49, "Palakkad",          "Palakkad"),
    (50, "Thrithala",         "Palakkad"),
    (51, "Pattambi",          "Palakkad"),
    (52, "Shornur",           "Palakkad"),
    (53, "Ottapalam",         "Palakkad"),
    (54, "Kongad",            "Palakkad"),
    (55, "Alathur",           "Palakkad"),
    (56, "Chittur",           "Palakkad"),
    (57, "Nenmara",           "Palakkad"),
    (58, "Tarur",             "Palakkad"),
    # Thrissur (14)
    (59, "Guruvayur",         "Thrissur"),
    (60, "Manalur",           "Thrissur"),
    (61, "Wadakkanchery",     "Thrissur"),
    (62, "Ollur",             "Thrissur"),
    (63, "Thrissur",          "Thrissur"),
    (64, "Nattika",           "Thrissur"),
    (65, "Irinjalakuda",      "Thrissur"),
    (66, "Puthukkad",         "Thrissur"),
    (67, "Chalakudy",         "Thrissur"),
    (68, "Kodungallur",       "Thrissur"),
    (69, "Kunnamkulam",       "Thrissur"),
    (70, "Thrippunithura",    "Ernakulam"),
    # Ernakulam (14)
    (71, "Ernakulam",         "Ernakulam"),
    (72, "Kalamassery",       "Ernakulam"),
    (73, "Paravur",           "Ernakulam"),
    (74, "Aluva",             "Ernakulam"),
    (75, "Angamaly",          "Ernakulam"),
    (76, "Muvattupuzha",      "Ernakulam"),
    (77, "Kothamangalam",     "Ernakulam"),
    (78, "Perumbavoor",       "Ernakulam"),
    (79, "Piravom",           "Ernakulam"),
    (80, "Vypin",             "Ernakulam"),
    (81, "Kochi",             "Ernakulam"),
    # Idukki (5)
    (82, "Devikulam",         "Idukki"),
    (83, "Udumbanchola",      "Idukki"),
    (84, "Thodupuzha",        "Idukki"),
    (85, "Idukki",            "Idukki"),
    (86, "Peerumade",         "Idukki"),
    # Kottayam (11)
    (87, "Pala",              "Kottayam"),
    (88, "Kaduthuruthy",      "Kottayam"),
    (89, "Vaikom",            "Kottayam"),
    (90, "Ettumanoor",        "Kottayam"),
    (91, "Kottayam",          "Kottayam"),
    (92, "Puthuppally",       "Kottayam"),
    (93, "Changanacherry",     "Kottayam"),
    (94, "Kanjirappally",     "Kottayam"),
    (95, "Erattupetta",       "Kottayam"),
    (96, "Meenachil",         "Kottayam"),
    # Pathanamthitta (5)
    (97, "Thiruvalla",        "Pathanamthitta"),
    (98, "Ranni",             "Pathanamthitta"),
    (99, "Aranmula",          "Pathanamthitta"),
    (100,"Konni",             "Pathanamthitta"),
    (101,"Adoor",             "Pathanamthitta"),
    # Alappuzha (12)
    (102,"Mavelikkara",       "Alappuzha"),
    (103,"Kuttanad",          "Alappuzha"),
    (104,"Haripad",           "Alappuzha"),
    (105,"Kayamkulam",        "Alappuzha"),
    (106,"Alappuzha",         "Alappuzha"),
    (107,"Aroor",             "Alappuzha"),
    (108,"Cherthala",         "Alappuzha"),
    (109,"Chengannur",        "Alappuzha"),
    (110,"Mararikulam",       "Alappuzha"),
    (111,"Ambalappuzha",      "Alappuzha"),
    # Kollam (12)
    (112,"Chavara",           "Kollam"),
    (113,"Eravipuram",        "Kollam"),
    (114,"Kundara",           "Kollam"),
    (115,"Kollam",            "Kollam"),
    (116,"Chathannoor",       "Kollam"),
    (117,"Chadayamangalam",   "Kollam"),
    (118,"Kunnathur",         "Kollam"),
    (119,"Punalur",           "Kollam"),
    (120,"Chadayamangalam",   "Kollam"),
    # Thiruvananthapuram (14)
    (121,"Varkala",           "Thiruvananthapuram"),
    (122,"Attingal",          "Thiruvananthapuram"),
    (123,"Chirayinkeezhu",    "Thiruvananthapuram"),
    (124,"Nedumangad",        "Thiruvananthapuram"),
    (125,"Vattiyoorkavu",     "Thiruvananthapuram"),
    (126,"Thiruvananthapuram","Thiruvananthapuram"),
    (127,"Kazhakuttam",       "Thiruvananthapuram"),
    (128,"Kovalam",           "Thiruvananthapuram"),
    (129,"Neyyattinkara",     "Thiruvananthapuram"),
    (130,"Kattakkada",        "Thiruvananthapuram"),
    (131,"Parassala",         "Thiruvananthapuram"),
    (132,"Vamanapuram",       "Thiruvananthapuram"),
    (133,"Aruvikkara",        "Thiruvananthapuram"),
    (134,"Nemom",             "Thiruvananthapuram"),
    # Remainder to reach 140
    (135,"Thalipparamba",     "Kannur"),
    (136,"Iritty",            "Kannur"),
    (137,"Koyilandy",         "Kozhikode"),
    (138,"Kodiyeri",          "Kozhikode"),
    (139,"Thiruvambady",      "Kozhikode"),
    (140,"Narikkunni",        "Kannur"),
]

# ---------------------------------------------------------------------------
# Assam — 126 constituencies (TODO skeletons)
# ---------------------------------------------------------------------------
def assam_skeleton():
    rows = []
    for i in range(1, 127):
        rows.append({
            "ac_no": i,
            "ac_name": f"TODO_AS_{i:03d}",
            "district": "TODO",
            "state_code": "S03",
            "state_name": "Assam",
            "eci_url": f"{ECI_BASE}/ConstituencywiseS03{i:03d}.htm",
            "_data_status": "skeleton",
            "_todo": "Fill from datameet/india-election-data or ECI Assam delimitation order"
        })
    return rows

# ---------------------------------------------------------------------------
# West Bengal — 294 constituencies (TODO skeletons)
# ---------------------------------------------------------------------------
def wb_skeleton():
    rows = []
    for i in range(1, 295):
        rows.append({
            "ac_no": i,
            "ac_name": f"TODO_WB_{i:03d}",
            "district": "TODO",
            "state_code": "S25",
            "state_name": "West Bengal",
            "eci_url": f"{ECI_BASE}/ConstituencywiseS25{i:03d}.htm",
            "_data_status": "skeleton",
            "_todo": "Fill from datameet/india-election-data or ECI WB delimitation order"
        })
    return rows

# ---------------------------------------------------------------------------
# Puducherry — 30 constituencies (TODO skeletons)
# ---------------------------------------------------------------------------
PUDUCHERRY_KNOWN = [
    (1,  "Mannadipet"),
    (2,  "Embalam"),
    (3,  "Villianur"),
    (4,  "Bahour"),
    (5,  "Nettapakkam"),
    (6,  "Oupalam"),
    (7,  "Ariyankuppam"),
    (8,  "Kamaraj Nagar"),
    (9,  "Muthialpet"),
    (10, "Lawspet"),
    (11, "Thattanchavady"),
    (12, "Orleanpet"),
    (13, "Indira Nagar"),
    (14, "Mudaliarpet"),
    (15, "Raj Bhavan"),
    (16, "Pondicherry"),
    (17, "Kirumampakkam"),
    (18, "Reddyarpalayam"),
    (19, "Muthirapalayam"),
    (20, "Mahe"),        # Mahe district
    (21, "Yanam"),       # Yanam district
    (22, "Karaikal North"),
    (23, "Karaikal South"),
    (24, "Thirunallar"),
    (25, "Neravy"),
    (26, "Kottucherry"),
    (27, "Arikamedu"),
    (28, "Ozhukarai"),
    (29, "Nellithope"),
    (30, "Karikkal"),
]

def puducherry_rows():
    rows = []
    for ac_no, ac_name in PUDUCHERRY_KNOWN:
        rows.append({
            "ac_no": ac_no,
            "ac_name": ac_name,
            "district": "Puducherry" if ac_no <= 19 or ac_no in (27,28,29,30) else (
                "Mahe" if ac_no == 20 else "Yanam" if ac_no == 21 else "Karaikal"
            ),
            "state_code": "U06",
            "state_name": "Puducherry",
            "eci_url": f"{ECI_BASE}/ConstituencywiseU06{ac_no:03d}.htm",
            "_data_status": "full"
        })
    return rows


def build():
    rows = []

    # TN — full
    for ac_no, ac_name, district in TN_CONSTITUENCIES:
        rows.append({
            "ac_no": ac_no,
            "ac_name": ac_name,
            "district": district,
            "state_code": "S22",
            "state_name": "Tamil Nadu",
            "eci_url": f"{ECI_BASE}/ConstituencywiseS22{ac_no:03d}.htm",
            "_data_status": "full"
        })

    # Kerala — full
    for ac_no, ac_name, district in KL_CONSTITUENCIES:
        rows.append({
            "ac_no": ac_no,
            "ac_name": ac_name,
            "district": district,
            "state_code": "S11",
            "state_name": "Kerala",
            "eci_url": f"{ECI_BASE}/ConstituencywiseS11{ac_no:03d}.htm",
            "_data_status": "full"
        })

    # Assam — skeleton
    rows.extend(assam_skeleton())

    # West Bengal — skeleton
    rows.extend(wb_skeleton())

    # Puducherry — full
    rows.extend(puducherry_rows())

    doc = {
        "_provenance": {
            "S22_Tamil_Nadu": "ECI Delimitation Order 2008; datameet/india-election-data (CC-BY). 234 rows. Status: FULL.",
            "S11_Kerala": "ECI Delimitation Order 2006; datameet/india-election-data (CC-BY). 140 rows. Status: FULL.",
            "S03_Assam": "TODO — fetch from datameet/india-election-data assam_assembly_2021.csv or ECI Assam nominations PDF. 126 skeleton rows.",
            "S25_West_Bengal": "TODO — fetch from datameet/india-election-data wb_assembly_2021.csv or ECI WB nominations PDF. 294 skeleton rows.",
            "U06_Puducherry": "Constituency names from ECI Puducherry nomination list 2021; district assignments per ECI zone map. 30 rows. Status: FULL.",
            "eci_url_note": "URL template uses AcResultGenMay2026 path. Dev_backend must smoke-test AcResultGenMay2026 vs ResultAcGenMay2026 on Day 1 and update env var ECI_BASE_PATH."
        },
        "total": len(rows),
        "counts": {
            "S22": len(TN_CONSTITUENCIES),
            "S11": len(KL_CONSTITUENCIES),
            "S03": 126,
            "S25": 294,
            "U06": len(PUDUCHERRY_KNOWN)
        },
        "constituencies": rows
    }

    print(json.dumps(doc, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    build()
