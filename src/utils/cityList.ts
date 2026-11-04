// PostEx approved operational cities (Exact 901 live operational hubs from PostEx API)
export const CITY_LIST: string[] = [
  "ABBASPUR", "ABBOTTABAD", "ABDUL HAKEEM", "ADDA JOHAL", "ADDA ONE R",
  "ADDA PANWAN", "ADDA PLOT", "ADDA SHAIKH WAHAN", "ADDA SIRAJ", "AHMAD NAGAR CHATHA",
  "AHMADAL", "AHMED NAGAR", "AHMEDPUR EAST", "AHMEDPUR SIAL", "AIMANABAD TOWN",
  "AJNIA WALA", "AKHTAR ABAD", "AKORA KHATAK", "AKWAL", "ALI PUR BANGLA",
  "ALIPUR", "ALIPUR CHATHA", "ALLAH ABAD", "ALMAS", "AMANGARH",
  "AMINABAD", "AMINPUR BANGLA", "AMRA KALAN", "AMRA KHURD", "ANWARABAD",
  "ARIFWALA", "ARJA", "ASHARAY", "ATHMUQAM", "ATTOCK",
  "ATTOWALA", "AYUBIA", "BADDOMALHI", "BADIN", "BAFFA",
  "BAGH (AJK)", "BAHAWALNAGAR", "BAHAWALPUR", "BAHRAIN", "BAHRIA ORCHARD",
  "BAHTAR MORE", "BAIDARA", "BAIG PUR", "BAJAR WALA", "BALAKOT",
  "BALAMBAT", "BAN BAJWA", "BANDHI", "BANGULDERO", "BANNU",
  "BANSRA GALI", "BARA MANGA", "BARA MARKET", "BARAWAL", "BARIAN",
  "BARIKOT", "BARKHAN", "BARRTH", "BASHARAT", "BASIRPUR",
  "BASTI MALOOK", "BATKHELA", "BATTAGRAM", "BEGUM KOT", "BEKNANWALA",
  "BELA", "BHAGOWAL KHURD", "BHAGTANWALA", "BHAI PHERU", "BHAKKAR",
  "BHAKNAWALI", "BHAL SYEDAN", "BHALWAAL", "BHAN SAYEDABAD", "BHARA KAHU",
  "BHAU GHASITPUR", "BHERA", "BHIKKI", "BHIMBER (AJK)", "BHOE ASAL",
  "BHOMAN BATTH", "BHOPALWALA", "BHOWANA", "BHURBUN (P.C. HOTEL)", "BIBYAWAR",
  "BILALABAD", "BIRTH BOTH", "BONGA HAYAT", "BOSAL", "BOZDAR WADA",
  "BUCHEKE", "BUNER", "BUNI", "BUREWALA", "CADET COLLEGE SUNNY BANK",
  "CANAL CITY", "CHAK ALI SHAH", "CHAK BELI KHAN", "CHAK FATEH SHAH", "CHAK HAMID",
  "CHAK JANI", "CHAK JHUMRA", "CHAK PARANA", "CHAK SHADI", "CHAK SWARI (AJK)",
  "CHAKDARA", "CHAKLALA", "CHAKORI BHILOWAL", "CHAKRI", "CHAKSWARI",
  "CHAKWAL", "CHAMAN", "CHAMANKOT", "CHANGA MANGA", "CHANNAN",
  "CHAR BAGH", "CHARHOI", "CHARSADDA", "CHASHMA", "CHAUBARA",
  "CHAWINDA", "CHENAB NAGAR", "CHIANWALI", "CHICHAWATNI", "CHIKKAR",
  "CHILAS", "CHILLIANWALA", "CHINIOT", "CHINJI", "CHISHTIAN",
  "CHISTIAN", "CHITRAL", "CHITTA MORE", "CHOA KHALSA", "CHOA SAIDAN SHAH",
  "CHOBARA", "CHOR", "CHOTA LAHORE", "CHOTA SAHIWAL", "CHOWK AZAM",
  "CHOWK MUNDA", "CHOWK PANDORI", "CHUHAR JAMALI", "CHUKYATAN", "CHUNAWALA",
  "CHUNIAN", "DADU", "DADYAL (AJK)", "DAGGAR", "DAGHONI BALGAR",
  "DAKWALA", "DAMBODAS", "DANDA SHAH BILAWAL", "DAOOD ZAI", "DARGAI",
  "DARMAN", "DARORA", "DARRO", "DARYA GALI", "DARYA KHAN",
  "DASKA", "DAUD KHEL", "DAUL TALA", "DAULATPUR", "DAUR",
  "DEHARKI", "DEHLA CHATTHA", "DEPALPUR", "DERA ALLAH YAR", "DERA GHAZI KHAN",
  "DERA ISMAIL KHAN", "DERA MURAD JAMALI", "DERA NAWAB", "DEWAL", "DEWALAY",
  "DEWANA BABA", "DHABJEE", "DHAKKAR", "DHARABI", "DHARYALA JALAP",
  "DHERI ARAIAN", "DHIRKOT", "DHOKE SHAHANI", "DHORI ADDA", "DHUDIAL",
  "DHULIAN", "DHURNAL", "DIGRI", "DIJKOT", "DILAWAR CHEEMA",
  "DINA", "DINA NATH", "DINGA", "DISTT. COMPLEX", "DOABA",
  "DOBERAN KALLAN", "DOKRI", "DONGA BONGA", "DOUGHAL", "DROSH",
  "DUDHU CHAK", "DULLE WALA", "DUNIAPUR", "DUNYA PUR", "F.F.C. PLANT",
  "FAISALABAD", "FAQIRWALI", "FARHAT ABAD", "FAROKA", "FAROOQABAD",
  "FATEH JANG", "FATEH PUR", "FATEH PUR KAMAL", "FATEHPUR", "FATEHPUR THAKIALA",
  "FATTA BHAND", "FAZIL PUR", "FEROZ WATWAN", "FEROZEWALA", "FKPCL POWER PLANT",
  "FORT ABBAS", "FORWARD KAHUTA", "GAGAN", "GAGGO MANDI", "GALI JAGIR",
  "GAMBA SKARDU", "GAMBAT", "GAMBER", "GANORI", "GARH MAHARAJA",
  "GARH MORE", "GARHA MORE", "GARHI DUPATTA", "GARHI MORI", "GATWALA 199 / RB",
  "GHAKKAR MANDI", "GHALANY", "GHAR MORE", "GHARI HABIBULLAH", "GHARIAL CAMP",
  "GHARIBWAL", "GHARIBWAL CEMENT", "GHARO", "GHAZI", "GHAZIABAD",
  "GHIKA GALI", "GHORA GALI", "GHOTKI", "GHOUR GHUSTI", "GHOUS PUR",
  "GHOUSPUR", "GHUMMAN WALA", "GILGIT", "GOJRA", "GOLARCHI",
  "GOLPUR", "GOTH MACHI", "GUJAR KHAN", "GUJRANWALA", "GUJRAT",
  "GUL BELA", "GULYANA", "GUMTI SHAREEF", "GUNJA", "GURMANI ADDA",
  "GWADAR", "HABIB ABAD", "HAFIZ HAYAT CAMPUS", "HAFIZABAD", "HAJEERA",
  "HAJIRA", "HAKIM ABAD", "HALA", "HALLA", "HANGU",
  "HARANPUR", "HARAPPA", "HARIGHEL", "HARIPUR", "HARNAL",
  "HAROONABAD", "HASEEB WAQAS MILLS", "HASIL PUR", "HASLANWALA", "HASSAN ABDAL",
  "HATIA BALA", "HATTAR", "HATTIAN BALA", "HAVELI BAHADUR SHAH", "HAVELI LAKHA",
  "HAVELIAN", "HAZARA UNIVERSITY", "HAZRAT KALIANWALA", "HAZRO", "HEAD BALOKI ROAD",
  "HEAD KHOKHRA", "HEADMARALA", "HUB", "HUB CHOWKI", "HUJRA SHAH MUKEEM",
  "HUNZA–NAGAR", "HUSRI", "HUSSAINABAD", "HYDERABAD", "IIKHLAS",
  "IKHLASPUR", "IQBAL ABAD", "IQBAL NAGAR", "ISLAM GARH (AJK)", "ISLAM HEADWORKS",
  "ISLAMABAD", "ISLAMGARH", "JABBI SHAH DILAWAR", "JACOBABAD", "JAFARABAD",
  "JAFFAR MANDI", "JAHANIAN", "JALALPUR BHATTIAN", "JALALPUR JATTAN", "JALALPUR SHARIF",
  "JALALPURPIRWALA", "JAMALPUR", "JAMKE CHATHA", "JAMPUR", "JAMSHORO",
  "JANDIA SHER KHAN", "JANI CHAK", "JANU CHAK", "JARANWALA", "JASIAL",
  "JATLAN (AJK)", "JATOI", "JAURAH", "JEHANGIRA", "JHABRAN MANDI",
  "JHANG", "JHELUM", "JHOL", "JHUDDO", "JOHARABAD",
  "JOHI", "JUGLOT", "JUTANA", "KABAL", "KABIRWALA",
  "KACHA KHOO", "KACHURA", "KADHAN", "KAHAUTA", "KAHUTA",
  "KAIRPUR NATHIN SHAH", "KALASKE CHEEMA", "KALASWALA", "KALI MITTI", "KALKOT",
  "KALLAR KAHAR", "KALLAR SYEDDAN", "KALOR KOT", "KAMALIA", "KAMOKE",
  "KAMRA", "KAMRIAL", "KAND KOT", "KANDHKOT", "KANDIARO",
  "KANGAN PUR", "KANGRA", "KANJU", "KANOHA", "KANYAL",
  "KAPCO POWER PLANT", "KARACHI", "KARACHI ALHYDRI", "KARACHI CITY", "KARACHI SADDAR",
  "KARAK", "KARAM PUR", "KARARIWALA KHURD", "KARIALA JALIB", "KAROOR PAKA",
  "KAROR LAL EASAN", "KARTARPUR", "KASHMIR POINT", "KASHMORE", "KASSOWAL",
  "KASUR", "KATHORE", "KERIS", "KHAI GALA", "KHAIRPUR",
  "KHAIRPUR MEERUS", "KHAIRPUR NATHAN SHAH", "KHAIRPUR TAMEWALI", "KHAN BELA", "KHAN GHAR",
  "KHANEWAL", "KHANKA DOGRAN", "KHANPUR", "KHANPUR MAHAR", "KHAPLU",
  "KHARALA", "KHARIAN", "KHARMANG", "KHAS BEHAAL", "KHAUR",
  "KHIDARWALA", "KHIPRO", "KHOAZA KHAILA", "KHOHAR", "KHORI ALAM",
  "KHOSKI", "KHUDIAN KHAS", "KHUHRA", "KHUIRATTA", "KHUNDA",
  "KHURRIANWALA", "KHUSHAB", "KHUZDAR", "KHWAGO OBO", "KHWAZAKHELA",
  "KHWERA", "KINGRA MOR", "KML VIA CCW", "KOHAT", "KORANGI KARACHI",
  "KOT ABDUL MALIK", "KOT ADDU", "KOT ASLAM", "KOT BANGLO", "KOT BARAY KHAN",
  "KOT BILAL", "KOT CHUTTA", "KOT FATEH KHAN", "KOT GHULAM MUHAMMAD", "KOT MITHAN",
  "KOT MOMIN", "KOT NAINAN", "KOT PINDI DAS", "KOT QADIR BAKHSH", "KOT QAISRANI",
  "KOT QAZI", "KOT RADHA KISHAN", "KOT SAMABAH", "KOTANAI", "KOTKAY",
  "KOTLA ARAB ALI KHAN", "KOTLI (AJK)", "KOTLI BEHRAM", "KOTLI LOHARAN", "KOTRI",
  "KOTRI MUHAMMAD KABIR", "KUCHLAK", "KULACHI", "KULDANA", "KULLUWAL",
  "KUMB", "KUNDIAN", "KUNJAH", "KUNRI", "KUTHYALA SYEDAN",
  "LADHA SADHA", "LADHEWALA CHEEMA", "LAHORE", "LAHORE CANTT", "LAIDHER",
  "LAKE CITY", "LAKHA ROAD", "LAKHNE WALA", "LAKKI MARWAT", "LALA CHAK",
  "LALA MUSA", "LALIAN", "LALLIAN", "LALLIANI", "LALPIR (THERMAL POWER)",
  "LARKANA", "LASOORI KALAN", "LAWA", "LAWRENCE PUR", "LAYYAH",
  "LESSAR KALAN", "LIAQAT NATIONAL BAGH AKA COMPANY BAGH", "LIAQAT PUR", "LIAQUATABAD", "LILLA",
  "LODHRAN", "LORALAI", "LOWARI", "LOWER BAZAR", "LOWER CHITRAL",
  "LOWER DIR", "LOWER TOPA", "MACHIKEY", "MACHIWAL", "MADRASSA CHATTHA",
  "MADYAN", "MAILSI", "MAIRA SHARIF", "MAJJU CHAK", "MAKLI",
  "MALAKAND", "MALAKWAL", "MAMDOT", "MAMU KANJAN", "MANA WLA",
  "MANAWALA", "MANCHAR CHATTHA", "MANDI BAHAUDDIN", "MANDI BUCHIANA", "MANDI SAFDAR ABAD",
  "MANDI USMAN WALA", "MANDIAN", "MANDRA", "MANGA MANDI", "MANGAT",
  "MANGLA (AJK)", "MANGLA CANTT (AJK)", "MANKERA", "MANKYLA STATION", "MANSEHRA",
  "MANTHAL", "MARDAN", "MARI", "MASAR CAMP", "MATIARI",
  "MATLI", "MATORE", "MATTA", "MEHAR", "MEHDIABAD",
  "MEHER", "MEHMOOD KOT", "MEHRAB PUR", "MIAN CHANNU", "MIAN WALI QURESHAIN",
  "MIANA GONDAL", "MIANDAM", "MIANI", "MIANWALI", "MIANWALI BANGLA",
  "MINCHINABAD", "MINGORA", "MIR PUR METHELO", "MIRAK SIAL", "MIRPUR (AJK)",
  "MIRPUR BATHORO", "MIRPUR KHAS", "MIRPUR MATHELO", "MIRPUR SAKRO", "MITHA TIWANA",
  "MITHI", "MITTHI", "MOHALLA RAJGAN", "MOR AIMANABAD", "MORE AIMANABAD",
  "MORE KHUNDA", "MORO", "MOTRA", "MUHAMMAD PANAH MOR", "MULTAN",
  "MULTAN KHURD", "MUNDA", "MUNDI KHEL", "MURALI", "MURALI WALA",
  "MURAT", "MURIDKE", "MURREE", "MUZAFFARABAD (AJK)", "MUZAFFARGARH",
  "NAKKA KAHUT", "NANKANA SAHIB", "NARA", "NARANG MANDI", "NARAR",
  "NAROWAL", "NASARPUR", "NASIRABAD", "NATHIA GALI", "NAUSHAHRO FEROZE",
  "NAWABSHAH", "NAWAN SHEHR", "NAWAY KALI", "NAYA LAHORE", "NEW INDUSTRIAL AREA",
  "NEW MURREE", "NEW TOWN KARACHI", "NIZAMABAD", "NOKHAR", "NOMAN PORA",
  "NONAR", "NOOR COLONY", "NOOR JAMAAL", "NOOR KOT", "NOORPUR",
  "NOORPUR THAL", "NORIABAD", "NOWSHERA", "NOWSHERA KALAN", "NOWSHERA VIRKAN",
  "NRTC (TELECOM STAFF COLLEGE)", "NUDEARO", "OKARA", "OLD HALA", "OLDING",
  "P.O.F. (FACTORY & COLONY)", "PABBI", "PABI", "PACHNAND", "PAHARPUR",
  "PAK PATTAN SHARIF", "PAKKA LARAN", "PAKPATTAN", "PALANDRI", "PANAKOT",
  "PANJAN SHER SHAHANA", "PANO AKIL", "PANOAQIL", "PAROA", "PASNI",
  "PASROOR", "PASROOR ROAD AND VILLAGES", "PASRUR", "PATHIKA", "PATOKI",
  "PATRAK", "PATRIATA", "PATTOKI", "PEER KALAN", "PEER MAHAL",
  "PESHAWAR", "PEZU", "PHAGWARI", "PHALIA", "PHOOL NAGAR",
  "PINANWAL", "PIND DADAN KHAN", "PINDI BHATIAN", "PINDI GHEB", "PINDI GUJRAN",
  "PINDI POINT", "PINDI SAID PUR", "PIPLAN", "PIR BABA", "PIR JO GOTH",
  "PIR WASAN", "PIRA FATEHAL", "PIRJOGOTH", "PIRYALOI", "PISHIN",
  "PITARO", "PMA KAKUL", "POONCH (AJK)", "PORANWALA", "PUNGIRAYIN",
  "PUNJAR", "PUNWAN", "PURAAN", "QABAL", "QABOOLA SHARIF",
  "QADIR PUR RAWAN", "QAIDABAD", "QAIM BHARWANA", "QAIMPUR", "QALAT",
  "QAMAR ABAD", "QAMAR MASHANI", "QAMBAR", "QASBA GUJRAT.", "QASHQARY",
  "QASIMPURA", "QAZI AHMED", "QILA AHMED ABAD", "QILA DEEDAR SING", "QILA KALAR WALA",
  "QILA SAIB SINGH", "QUETTA", "QULANDI", "RABAT", "RACHNA TOWN",
  "RADHAN", "RAHIM YAR KHAN", "RAHIMYAR KHAN", "RAIWIND", "RAJA JANG",
  "RAJANA", "RAJANPUR", "RAJAR", "RAKH BALOCH KALAN", "RAMAK",
  "RANI PUR", "RAO KHAN WALA", "RASHAKI", "RASOOL NAGAR", "RATO DEARO",
  "RATODERO", "RAWALPINDI", "RAWAT", "REHANKOT", "RENALA KHURD",
  "RISALPUR", "ROHRI", "ROUNDU", "RUBWA", "RUKKAN",
  "SABAZ PEER", "SADAT PUR", "SADIQABAD", "SADPARA", "SAFDARABAD",
  "SAGHAR PUR", "SAHARAN CHATTHA", "SAHIWAL", "SAID NAGAR", "SAID PUR GONDAL",
  "SAIDU SHAIRF", "SAIDU SHARIF", "SAJAWAL", "SAKHAKOT", "SAKRAND",
  "SALLHOKE CHATTHA", "SAMANDARI", "SAMAR BAGH", "SAMARO", "SAMBRIAL",
  "SAMOTE", "SAMUNDRI", "SANGHAR", "SANGLA HILL", "SANGWALA",
  "SANJHORO", "SANJWAL", "SARAI ALAMGIR", "SARAI MUGHAL", "SARAYE NORANG",
  "SARDAR GARH", "SARDARYAB", "SARGODHA", "SARI ALAMGIR", "SAROBA",
  "SAROKI CHEEMA", "SATRAH", "SATYYANA", "SAUWAL", "SAWABI",
  "SAWARI", "SAWNI", "SEHR BAGLA", "SEHWAN SHARIF", "SERMIK",
  "SETHARJA", "SHABQADAR", "SHADAD KOT", "SHADAN LUND", "SHADIWAL",
  "SHAH BAGH", "SHAH PUR CHAKAR", "SHAHDAD PUR", "SHAHDADPUR", "SHAHDARA TOWN",
  "SHAHKOT", "SHAHPUR JAHANIA", "SHAHPUR SADDAR", "SHAKARGARH", "SHAKIRILA",
  "SHAM KOT", "SHAMS ABAD", "SHANGLA", "SHARAQPUR SHARIF", "SHARIF MEDICAL CITY",
  "SHEEDO", "SHEIKHOO SUGAR MILLS", "SHEIKHU CHAK", "SHEIKHUPURA", "SHERGARH",
  "SHERINGAL", "SHEWA ADDA", "SHIGAR", "SHIKARPUR", "SHIMLA HILL",
  "SHOKHDARA", "SHORKOT", "SHORKOT CANTONMENT", "SHUJABAD", "SIALKOT",
  "SIBI", "SIHALA", "SIKANDARABAD", "SILANWALI", "SINJHORO",
  "SIR SUBA SHAH", "SIRAYE MUHAJIR", "SIVIA", "SKARDU", "SMAAL IND ESTATE. DASKA",
  "SOHAWA", "SOHAWA ONLY MAIN GT ROAD", "SOKAR", "SUDHANOTI (AJK)", "SUI",
  "SUI TOWN", "SUKHU CHAK", "SUKKUR", "SUMBRIAL", "SUNDAR INDUSTRIAL ESTATE",
  "SUNDARAWAL", "SUNDER ADDA", "SURKHPUR", "SWABI", "SWAT",
  "SYED WALA", "T.T SINGH", "TAJA BARA", "TAKHT-E-BHAI", "TAKHT-I-BAHI",
  "TALAGANG", "TALAGUNG", "TALASH", "TALHAR", "TALL",
  "TALPUR WADA", "TALVANDI", "TAMMAN", "TANDLIAWALA", "TANDO ADAM",
  "TANDO ALLAHYAR", "TANDO BAGO", "TANDO GHULAM ALI", "TANDO JAM", "TANDO JAN MUHAMMAD",
  "TANDO MOHD KHAN", "TANGI", "TANK", "TARBELA DAM", "TARNOL",
  "TAUNSA SHARIF", "TAXILA", "TAXLA", "TEHI", "THARI MIRWAH",
  "THATHA AMIR", "THATTA", "THEENG MORE (ALLAHABAD)", "THOA MEHRAM KHAN", "THOHA KHALSA",
  "THUL", "THUL HAMZA", "THULL", "TIBBA SULTANPURA", "TIMARGARA",
  "TIMARGARAH", "TIRAT", "TOBA TEK SINGH", "TOBAH", "TOPA ADAM",
  "TOPI", "TOPI (GIK UNIVERSITY AREA ONLY)*", "TORWARSAK", "TRANDA MOHAMMAD PANAH", "TRANDA SAWAY KHAN",
  "TRET", "TULAMBA", "TURBAT", "UBARO", "UBAURO",
  "UCH SHRIF", "UGGOKE", "UMAR KOT", "UMERKOT", "UPPER CHITRAL",
  "UPPER DIR", "USHERI", "USTA MOHAMMAD", "USTA MUHAMMAD", "UTHAL",
  "VEHARI", "VERPAL CHATTHA", "VILLAGE SIAL", "WADA MACHHI", "WAH CANTT",
  "WAH CANTT.", "WAHNDO", "WAHOVA", "WAN RAHDA RAM", "WAPDA COLONY (AJK)",
  "WARBATTAN", "WARRAICHAN WALA", "WARYAM WALA", "WAZIR KE CHATTHA", "WAZIRABAD",
  "WINDER", "YAKA GHUND", "YAZMAN", "ZAFARWAL", "ZAHIR PIR",
  "ZHOB"
]

// Comprehensive Urdu Script to PostEx approved canonical city mapping
export const URDU_CITY_MAP: Record<string, string> = {
  'کراچی': 'KARACHI',
  'لاہور': 'LAHORE',
  'اسلام آباد': 'ISLAMABAD',
  'اسلاماباد': 'ISLAMABAD',
  'راولپنڈی': 'RAWALPINDI',
  'فیصل آباد': 'FAISALABAD',
  'فیصلاباد': 'FAISALABAD',
  'ملتان': 'MULTAN',
  'پشاور': 'PESHAWAR',
  'کوئٹہ': 'QUETTA',
  'سیالکوٹ': 'SIALKOT',
  'گوجرانوالہ': 'GUJRANWALA',
  'گجرات': 'GUJRAT',
  'سرگودھا': 'SARGODHA',
  'بہاولپور': 'BAHAWALPUR',
  'سکھر': 'SUKKUR',
  'حیدرآباد': 'HYDERABAD',
  'حیدرآباد سندھ': 'HYDERABAD',
  'رحیم یار خان': 'RAHIM YAR KHAN',
  'قصور': 'KASUR',
  'ڈیرہ غازی خان': 'DERA GHAZI KHAN',
  'ڈی جی خان': 'DERA GHAZI KHAN',
  'ڈیرہ اسماعیل خان': 'DERA ISMAIL KHAN',
  'ڈی آئی خان': 'DERA ISMAIL KHAN',
  'خانیوال': 'KHANEWAL',
  'مردان': 'MARDAN',
  'جہلم': 'JHELUM',
  'گلگت': 'GILGIT',
  'گوادر': 'GWADAR',
  'شکارپور': 'SHIKARPUR',
  'ایبٹ آباد': 'ABBOTTABAD',
  'ایبٹاباد': 'ABBOTTABAD',
  'اوکاڑہ': 'OKARA',
  'اوکاڑا': 'OKARA',
  'ساہیوال': 'SAHIWAL',
  'شیخوپورہ': 'SHEIKHUPURA',
  'چکوال': 'CHAKWAL',
  'اٹک': 'ATTOCK',
  'میاں چنوں': 'MIAN CHANNU',
  'وہاڑی': 'VEHARI',
  'بھکر': 'BHAKKAR',
  'جھنگ': 'JHANG',
  'خوشاب': 'KHUSHAB',
  'میانوالی': 'MIANWALI',
  'مظفر گڑھ': 'MUZAFFARGARH',
  'مظفرآباد': 'MUZAFFARABAD (AJK)',
  'بھمبر': 'BHIMBER (AJK)',
  'کوٹلی': 'KOTLI (AJK)',
  'ڈڈیال': 'DADYAL (AJK)',
  'اسلام گڑھ': 'ISLAM GARH (AJK)',
  'اسلامگڑھ': 'ISLAM GARH (AJK)',
  'باغ': 'BAGH (AJK)',
  'ہنزہ': 'HUNZA–NAGAR',
  'ہنزہ نگر': 'HUNZA–NAGAR',
  'پونچھ': 'POONCH (AJK)',
  'سدھنوتی': 'SUDHANOTI (AJK)',
  'منگلا': 'MANGLA (AJK)',
  'جٹلاں': 'JATLAN (AJK)',
  'چک سواری': 'CHAK SWARI (AJK)',
  'میرپور': 'MIRPUR (AJK)',
  'میرپورخاص': 'MIRPUR KHAS',
  'نوابشاہ': 'NAWABSHAH',
  'لاڑکانہ': 'LARKANA',
  'چنیوٹ': 'CHINIOT',
  'ٹوبہ ٹیک سنگھ': 'TOBA TEK SINGH',
  'کوہاٹ': 'KOHAT',
  'بنوں': 'BANNU',
  'سوات': 'SWAT',
  'مینگورہ': 'MINGORA',
  'مانسہرہ': 'MANSEHRA',
  'تربت': 'TURBAT',
  'حب': 'HUB',
  'بلوچستان': 'QUETTA',
  'خیبر': 'PESHAWAR',
  'سندھ': 'KARACHI',
  'پنجاب': 'LAHORE'
}

// Common Pakistani City Abbreviations
export const CITY_ABBREVIATIONS: Record<string, string> = {
  'LHR': 'LAHORE',
  'KHI': 'KARACHI',
  'ISB': 'ISLAMABAD',
  'RWP': 'RAWALPINDI',
  'FSD': 'FAISALABAD',
  'MUL': 'MULTAN',
  'PSH': 'PESHAWAR',
  'PEW': 'PESHAWAR',
  'QTA': 'QUETTA',
  'SKT': 'SIALKOT',
  'GRW': 'GUJRANWALA',
  'GUJ': 'GUJRANWALA',
  'GWD': 'GWADAR',
  'HYD': 'HYDERABAD',
  'BWP': 'BAHAWALPUR',
  'SKR': 'SUKKUR',
  'JHG': 'JHANG',
  'SWL': 'SAHIWAL',
  'OKA': 'OKARA',
  'RYK': 'RAHIM YAR KHAN',
  'DGK': 'DERA GHAZI KHAN',
  'DIK': 'DERA ISMAIL KHAN',
  'ABT': 'ABBOTTABAD',
  'ATK': 'ATTOCK',
  'CKL': 'CHAKWAL',
  'JHL': 'JHELUM',
  'MBD': 'MANDI BAHAUDDIN',
  'WZD': 'WAZIRABAD',
  'KSR': 'KASUR',
  'SKP': 'SHEIKHUPURA',
  'NNS': 'NANKANA SAHIB',
  'MTN': 'MULTAN',
  'KRN': 'KARACHI'
}

// Deep Pakistani Area, Locality, Colony, and Landmark to Operational Hub City Map
export const PAKISTAN_AREA_TO_CITY_MAP: Record<string, string> = {
  // Lahore Localities & Landmarks
  'CHUNGI AMAR SIDHU': 'LAHORE',
  'AMAR SIDHU': 'LAHORE',
  'CHUNGI': 'LAHORE',
  'KAHNA NAU': 'LAHORE',
  'KAHNA': 'LAHORE',
  'KOT LAKHPAT': 'LAHORE',
  'TOWNSHIP': 'LAHORE',
  'GREEN TOWN': 'LAHORE',
  'WAPDA TOWN': 'LAHORE',
  'VALENCIA': 'LAHORE',
  'JOHAR TOWN': 'LAHORE',
  'MODEL TOWN': 'LAHORE',
  'GULBERG': 'LAHORE',
  'FAISAL TOWN': 'LAHORE',
  'GARDEN TOWN': 'LAHORE',
  'ALLAMA IQBAL TOWN': 'LAHORE',
  'IQBAL TOWN': 'LAHORE',
  'SAMANABAD': 'LAHORE',
  'ICHHRA': 'LAHORE',
  'ANARKALI': 'LAHORE',
  'SHADMAN': 'LAHORE',
  'SHAH DARA': 'LAHORE',
  'SHAHDARA': 'LAHORE',
  'BAGHBANPURA': 'LAHORE',
  'MUGHALPURA': 'LAHORE',
  'DHARAMPURA': 'LAHORE',
  'HARBANSPURA': 'LAHORE',
  'DAROGHAWALA': 'LAHORE',
  'SALAMATPURA': 'LAHORE',
  'TAJPURA': 'LAHORE',
  'BEDIAN ROAD': 'LAHORE',
  'BEDIAN': 'LAHORE',
  'BARKI ROAD': 'LAHORE',
  'BARKI': 'LAHORE',
  'WALTON ROAD': 'LAHORE',
  'WALTON': 'LAHORE',
  'CAVALRY GROUND': 'LAHORE',
  'CAVALRY': 'LAHORE',
  'CHUNG': 'LAHORE',
  'THOKAR NIAZ BAIG': 'LAHORE',
  'THOKAR': 'LAHORE',
  'LAKE CITY': 'LAHORE',
  'PARAGON CITY': 'LAHORE',
  'BAHRIA ORCHARD': 'LAHORE',
  'BAHRIA TOWN LAHORE': 'LAHORE',
  'DHA LAHORE': 'LAHORE',
  'DEFENCE LAHORE': 'LAHORE',
  'ASKARI LAHORE': 'LAHORE',
  'RAIWIND ROAD': 'LAHORE',
  'FEROZEPUR ROAD': 'LAHORE',
  'MULTAN ROAD LAHORE': 'LAHORE',
  'MANGA MANDI': 'LAHORE',
  'SUNDER': 'LAHORE',
  'ISLAMPURA': 'LAHORE',
  'SANDA': 'LAHORE',
  'MOZANG': 'LAHORE',
  'LAKSHMI CHOWK': 'LAHORE',
  'SHAH ALAM': 'LAHORE',
  'BADAMI BAGH': 'LAHORE',
  'RIVAZ GARDEN': 'LAHORE',
  'RACE COURSE': 'LAHORE',
  'CANTT LAHORE': 'LAHORE',
  'SADDAR LAHORE': 'LAHORE',

  // Karachi Localities & Landmarks
  'CLIFTON': 'KARACHI',
  'DEFENCE KARACHI': 'KARACHI',
  'DHA KARACHI': 'KARACHI',
  'KORANGI': 'KARACHI',
  'LANDHI': 'KARACHI',
  'MALIR': 'KARACHI',
  'MALIR CANTT': 'KARACHI',
  'GULSHAN-E-IQBAL': 'KARACHI',
  'GULSHAN': 'KARACHI',
  'GULISTAN-E-JOHAR': 'KARACHI',
  'GULSHAN-E-JOHAR': 'KARACHI',
  'NORTH NAZIMABAD': 'KARACHI',
  'NAZIMABAD': 'KARACHI',
  'FEDERAL B AREA': 'KARACHI',
  'FB AREA': 'KARACHI',
  'LIAQUATABAD': 'KARACHI',
  'PECHS': 'KARACHI',
  'SADDAR KARACHI': 'KARACHI',
  'TARIQ ROAD': 'KARACHI',
  'BAHADURABAD': 'KARACHI',
  'MEHMOODABAD': 'KARACHI',
  'MANZOOR COLONY': 'KARACHI',
  'SHAH FAISAL COLONY': 'KARACHI',
  'SHAH FAISAL': 'KARACHI',
  'ORANGI TOWN': 'KARACHI',
  'ORANGI': 'KARACHI',
  'BALDIA TOWN': 'KARACHI',
  'BALDIA': 'KARACHI',
  'SITE AREA': 'KARACHI',
  'SITE KARACHI': 'KARACHI',
  'LYARI': 'KARACHI',
  'KEMARI': 'KARACHI',
  'SURJANI TOWN': 'KARACHI',
  'SURJANI': 'KARACHI',
  'NORTH KARACHI': 'KARACHI',
  'NEW KARACHI': 'KARACHI',
  'SCHEME 33': 'KARACHI',
  'GULSHAN-E-MAYMAR': 'KARACHI',
  'ANCHOLI': 'KARACHI',
  'GULBERG KARACHI': 'KARACHI',
  'SOHRAB GOTH': 'KARACHI',
  'BAHRIA TOWN KARACHI': 'KARACHI',
  'I.I CHUNDRIGAR': 'KARACHI',
  'BURNS ROAD': 'KARACHI',
  'BOAT BASIN': 'KARACHI',

  // Islamabad Sectors & Zones
  'BLUE AREA': 'ISLAMABAD',
  'F-6': 'ISLAMABAD', 'F-7': 'ISLAMABAD', 'F-8': 'ISLAMABAD', 'F-10': 'ISLAMABAD', 'F-11': 'ISLAMABAD',
  'G-6': 'ISLAMABAD', 'G-7': 'ISLAMABAD', 'G-8': 'ISLAMABAD', 'G-9': 'ISLAMABAD', 'G-10': 'ISLAMABAD', 'G-11': 'ISLAMABAD', 'G-13': 'ISLAMABAD', 'G-15': 'ISLAMABAD',
  'H-8': 'ISLAMABAD', 'H-9': 'ISLAMABAD', 'H-12': 'ISLAMABAD', 'I-8': 'ISLAMABAD', 'I-9': 'ISLAMABAD', 'I-10': 'ISLAMABAD',
  'E-11': 'ISLAMABAD', 'D-12': 'ISLAMABAD', 'B-17': 'ISLAMABAD',
  'BANI GALA': 'ISLAMABAD',
  'TARLAI': 'ISLAMABAD',
  'CHAK SHAHZAD': 'ISLAMABAD',
  'PWD': 'ISLAMABAD',
  'SOAN GARDENS': 'ISLAMABAD',
  'CBR TOWN': 'ISLAMABAD',
  'DHA ISLAMABAD': 'ISLAMABAD',
  'BAHRIA TOWN ISLAMABAD': 'ISLAMABAD',

  // Rawalpindi Localities
  'SADDAR RAWALPINDI': 'RAWALPINDI',
  'RAJA BAZAR': 'RAWALPINDI',
  'COMMERCIAL MARKET': 'RAWALPINDI',
  'SATELLITE TOWN': 'RAWALPINDI',
  'CHAKLALA': 'RAWALPINDI',
  'CHAKLALA SCHEME 3': 'RAWALPINDI',
  'WESTRIDGE': 'RAWALPINDI',
  'ADYALA ROAD': 'RAWALPINDI',
  'PESHAWAR ROAD': 'RAWALPINDI',
  'TENCH BHATTA': 'RAWALPINDI',
  'GULZAR-E-QUAID': 'RAWALPINDI',
  'BAHRIA TOWN RAWALPINDI': 'RAWALPINDI',
  'DHA PHASE 1': 'RAWALPINDI',
  'DHA PHASE 2': 'RAWALPINDI',

  // Faisalabad Localities
  'D-GROUND': 'FAISALABAD',
  'MADINA TOWN': 'FAISALABAD',
  'PEOPLES COLONY': 'FAISALABAD',
  'GHULAM MUHAMMAD ABAD': 'FAISALABAD',
  'JINNAH COLONY': 'FAISALABAD',
  'MILLAT TOWN': 'FAISALABAD',
  'KOHINOOR CITY': 'FAISALABAD',
  'CANAL ROAD FAISALABAD': 'FAISALABAD',
  'SAMUNDRI ROAD': 'FAISALABAD',
  'JARANWALA ROAD': 'FAISALABAD',
  'SATIANA ROAD': 'FAISALABAD',

  // Multan Localities
  'BOSAN ROAD': 'MULTAN',
  'GULGASHT COLONY': 'MULTAN',
  'GULGASHT': 'MULTAN',
  'SHAH RUKN-E-ALAM': 'MULTAN',
  'CHUNGI NO 9': 'MULTAN',
  'MUMTAZABAD': 'MULTAN',
  'SHAMSABAD MULTAN': 'MULTAN',
  'MDA CHOWK': 'MULTAN',
  'SURAJ MIANI': 'MULTAN',
  'CANTT MULTAN': 'MULTAN',

  // Peshawar Localities
  'HAYATABAD': 'PESHAWAR',
  'UNIVERSITY TOWN': 'PESHAWAR',
  'KARKHANO': 'PESHAWAR',
  'GULBAHAR': 'PESHAWAR',
  'WARSAK ROAD': 'PESHAWAR',
  'SADDAR PESHAWAR': 'PESHAWAR'
}

// Canonical city aliases to resolve variants and colloquial names to exact PostEx hubs
export const CANONICAL_CITY_ALIASES: Record<string, string> = {
  // AJK Approved Operational Hubs
  'MUZAFFARABAD': 'MUZAFFARABAD (AJK)',
  'MUZAFFARABAD AJK': 'MUZAFFARABAD (AJK)',
  'MIRPUR': 'MIRPUR (AJK)',
  'MIRPUR AJK': 'MIRPUR (AJK)',
  'BHIMBER': 'BHIMBER (AJK)',
  'BHIMBER AJK': 'BHIMBER (AJK)',
  'KOTLI': 'KOTLI (AJK)',
  'KOTLI AJK': 'KOTLI (AJK)',
  'DADYAL': 'DADYAL (AJK)',
  'DADYAL AJK': 'DADYAL (AJK)',
  'ISLAMGARH': 'ISLAM GARH (AJK)',
  'ISLAM GARH': 'ISLAM GARH (AJK)',
  'ISLAM GARH AJK': 'ISLAM GARH (AJK)',
  'ISLAMGARH AJK': 'ISLAM GARH (AJK)',
  'BAGH': 'BAGH (AJK)',
  'BAGH AJK': 'BAGH (AJK)',
  'JATLAN': 'JATLAN (AJK)',
  'JATLAN AJK': 'JATLAN (AJK)',
  'MANGLA': 'MANGLA (AJK)',
  'MANGLA AJK': 'MANGLA (AJK)',
  'MANGLA CANTT': 'MANGLA CANTT (AJK)',
  'MANGLA CANTT AJK': 'MANGLA CANTT (AJK)',
  'POONCH': 'POONCH (AJK)',
  'POONCH AJK': 'POONCH (AJK)',
  'SUDHANOTI': 'SUDHANOTI (AJK)',
  'SUDHANOTI AJK': 'SUDHANOTI (AJK)',
  'SUDHNUTI': 'SUDHANOTI (AJK)',
  'WAPDA COLONY': 'WAPDA COLONY (AJK)',
  'WAPDA COLONY AJK': 'WAPDA COLONY (AJK)',
  'CHAK SWARI': 'CHAK SWARI (AJK)',
  'CHAKSWARI': 'CHAK SWARI (AJK)',
  'CHAKSWARI AJK': 'CHAK SWARI (AJK)',
  'CHAK SWARI AJK': 'CHAK SWARI (AJK)',
  'RAWALAKOT': 'POONCH (AJK)',
  'RAWALAKOT AJK': 'POONCH (AJK)',
  'RAWALAKOT (AJK)': 'POONCH (AJK)',

  // Gilgit-Baltistan & Hunza
  'HUNZA': 'HUNZA–NAGAR',
  'HUNZIA': 'HUNZA–NAGAR',
  'HUNZA NAGAR': 'HUNZA–NAGAR',
  'HUNZA-NAGAR': 'HUNZA–NAGAR',
  'HUNZA–NAGAR': 'HUNZA–NAGAR',
  'NAGAR': 'HUNZA–NAGAR',
  'ALIABAD': 'HUNZA–NAGAR',
  'ALI ABAD': 'HUNZA–NAGAR',
  'ALIABAD HUNZA': 'HUNZA–NAGAR',
  'ALI ABAD HUNZIA': 'HUNZA–NAGAR',
  'KARIMABAD': 'HUNZA–NAGAR',
  'KARIMABAD HUNZA': 'HUNZA–NAGAR',

  // Punjab towns & phonetic spelling variants
  'GO JERA': 'GOJRA',
  'GOJERA': 'GOJRA',
  'TAHSEEL GO JERA': 'GOJRA',
  'HASSANABBAD': 'HASAN ABDAL',
  'HASSAN ABBAD': 'HASAN ABDAL',
  'HASSANAABBAD': 'HASAN ABDAL',
  'HASSAN ABAD': 'HASAN ABDAL'
}

// Pre-computed lowercase map for O(1) instant resolution
const CITY_MAP = new Map<string, string>()
for (const city of CITY_LIST) {
  CITY_MAP.set(city.toLowerCase().replace(/[^a-z0-9]/g, ''), city)
}
for (const [alias, canonical] of Object.entries(CANONICAL_CITY_ALIASES)) {
  CITY_MAP.set(alias.toLowerCase().replace(/[^a-z0-9]/g, ''), canonical)
}

/**
 * Deep Geographic Address Scanner:
 * Scans an entire address string for known major cities, tehsils, and famous landmarks.
 * Returns the confirmed canonical city, or null if no definitive match found.
 */
export function detectCityFromAddress(address?: string | null): string | null {
  if (!address || typeof address !== 'string') return null
  const cleanAddr = address.trim()
  if (!cleanAddr) return null

  const upper = cleanAddr.toUpperCase()

  // 1. High-priority major metropolitan cities (word-boundary matched)
  const majorCities = [
    'LAHORE', 'KARACHI', 'ISLAMABAD', 'RAWALPINDI', 'FAISALABAD', 'MULTAN',
    'PESHAWAR', 'QUETTA', 'SIALKOT', 'GUJRANWALA', 'HYDERABAD', 'SUKKUR',
    'BAHAWALPUR', 'SARGODHA', 'GUJRAT', 'SHEIKHUPURA', 'JHANG', 'SAHIWAL',
    'LARKANA', 'KASUR', 'RAHIM YAR KHAN', 'DERA GHAZI KHAN', 'ABBOTTABAD',
    'NAWABSHAH', 'MIRPUR', 'MUZAFFARABAD', 'HUNZA', 'OKARA', 'MARDAN', 'CHAKWAL', 'ATTOCK'
  ]

  // Scan address from end to start (cities are almost always placed at the end of addresses in Pakistan)
  for (const city of majorCities) {
    const regex = new RegExp(`\\b${city}\\b`, 'i')
    if (regex.test(upper)) {
      // Check if it's Mirpur Khas, Mirpur Mathelo, etc.
      if (city === 'MIRPUR') {
        if (/\bMIRPUR\s+KHAS\b/i.test(upper)) return 'MIRPUR KHAS'
        if (/\bMIRPUR\s+MATHELO\b/i.test(upper)) return 'MIRPUR MATHELO'
        if (/\bMIRPUR\s+BATHORO\b/i.test(upper)) return 'MIRPUR BATHORO'
        if (/\bMIRPUR\s+SAKRO\b/i.test(upper)) return 'MIRPUR SAKRO'
        return 'MIRPUR (AJK)'
      }
      return CANONICAL_CITY_ALIASES[city] || city
    }
  }

  // 1b. Check canonical aliases (AJK, Hunza, etc.)
  for (const [alias, canonical] of Object.entries(CANONICAL_CITY_ALIASES)) {
    if (alias.length >= 4) {
      const regex = new RegExp(`\\b${alias.replace(/[()]/g, '')}\\b`, 'i')
      if (regex.test(upper)) {
        return canonical
      }
    }
  }

  // 2. Check Area/Locality Dictionary (e.g. "Chungi Amar Sidhu" -> "LAHORE")
  for (const [area, hubCity] of Object.entries(PAKISTAN_AREA_TO_CITY_MAP)) {
    if (upper.includes(area)) {
      return hubCity
    }
  }

  // 3. Check Urdu script cities in address
  for (const [urduKey, engCity] of Object.entries(URDU_CITY_MAP)) {
    if (cleanAddr.includes(urduKey)) {
      return engCity
    }
  }

  // 4. Scan all canonical cities in CITY_LIST at word boundaries
  for (const city of CITY_LIST) {
    if (city.length >= 4) {
      const regex = new RegExp(`\\b${city.replace(/[()]/g, '')}\\b`, 'i')
      if (regex.test(upper)) {
        return CANONICAL_CITY_ALIASES[city] || city
      }
    }
  }

  return null
}

/**
 * Ultra-Reliable City Normalization Engine:
 * Converts any extracted city name, abbreviation, Roman Urdu spelling, or landmark into
 * a canonical PostEx operational hub city.
 * NEVER makes naive 2-3 letter substring mistakes (e.g. "ALI" -> "ALIPUR").
 */
export function normalizeCityName(rawCity?: string | null, contextAddress?: string | null): string {
  if (!rawCity || typeof rawCity !== 'string') {
    if (contextAddress) {
      const detected = detectCityFromAddress(contextAddress)
      if (detected) return detected
    }
    return ''
  }

  const trimmed = rawCity.trim().toUpperCase()
  if (!trimmed) return ''

  // 1. If contextAddress contains an explicit major city and rawCity looks suspicious or matches customer name:
  if (contextAddress) {
    const detectedFromAddr = detectCityFromAddress(contextAddress)
    if (detectedFromAddr) {
      // If rawCity is equal to detected city, great
      if (trimmed === detectedFromAddr) return detectedFromAddr
      // If rawCity is very short or in our area map pointing to the detected city:
      if (PAKISTAN_AREA_TO_CITY_MAP[trimmed] === detectedFromAddr) {
        return detectedFromAddr
      }
      // If rawCity is an area of the detected city, or rawCity was confused with a person name (e.g. "ALI"):
      if (trimmed.length <= 4 || trimmed === 'ALIPUR' || trimmed === 'RECIPIENT') {
        return detectedFromAddr
      }
    }
  }

  // 2a. Canonical alias dictionary (e.g. "MUZAFFARABAD" -> "MUZAFFARABAD (AJK)", "ISLAMGARH" -> "ISLAM GARH (AJK)", "HUNZA" -> "HUNZA–NAGAR")
  if (CANONICAL_CITY_ALIASES[trimmed]) {
    return CANONICAL_CITY_ALIASES[trimmed]
  }
  const dashNormalized = trimmed.replace(/[\u2013\u2014]/g, '-')
  if (CANONICAL_CITY_ALIASES[dashNormalized]) {
    return CANONICAL_CITY_ALIASES[dashNormalized]
  }

  // 2b. Direct exact match in canonical list
  if (CITY_LIST.includes(trimmed)) return trimmed

  // 3. Known city abbreviations (LHR -> LAHORE, KHI -> KARACHI, etc.)
  if (CITY_ABBREVIATIONS[trimmed]) {
    return CITY_ABBREVIATIONS[trimmed]
  }

  // 4. Check Area/Locality Dictionary (e.g. "CHUNGI AMAR SIDHU" -> "LAHORE")
  if (PAKISTAN_AREA_TO_CITY_MAP[trimmed]) {
    return PAKISTAN_AREA_TO_CITY_MAP[trimmed]
  }
  for (const [area, hubCity] of Object.entries(PAKISTAN_AREA_TO_CITY_MAP)) {
    if (trimmed.includes(area)) {
      return hubCity
    }
  }

  // 5. Check Urdu script city dictionary
  const rawClean = rawCity.trim()
  if (URDU_CITY_MAP[rawClean]) {
    return URDU_CITY_MAP[rawClean]
  }
  for (const [urduKey, engCity] of Object.entries(URDU_CITY_MAP)) {
    if (rawClean.includes(urduKey)) {
      return engCity
    }
  }

  // 6. Alphanumeric normalized exact match (e.g. "lahore-cantt" -> "LAHORE CANTT")
  const simplified = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (CITY_MAP.has(simplified)) {
    return CITY_MAP.get(simplified)!
  }

  // 7. Safe composite name matching (e.g. "Lahore Cantt" -> "LAHORE")
  // CRITICAL RULE: simplified must contain cSimple (NOT the other way around unless lengths are very close)
  // Prevents short strings like "ali" (len 3) from matching "alipur"!
  if (simplified.length >= 4) {
    for (const city of CITY_LIST) {
      const cSimple = city.toLowerCase().replace(/[^a-z0-9]/g, '')
      // composite match: "lahorecantt" contains "lahore"
      if (cSimple.length >= 4 && simplified.includes(cSimple)) {
        return city
      }
      // reverse match: only if lengths are almost identical (e.g. typos, "lahor" -> "lahore")
      if (simplified.length >= 5 && cSimple.includes(simplified) && (simplified.length / cSimple.length) >= 0.8) {
        return city
      }
    }
  }

  // 8. If nothing matched, but contextAddress has a city, fallback to contextAddress
  if (contextAddress) {
    const detected = detectCityFromAddress(contextAddress)
    if (detected) return detected
  }

  return trimmed
}
