import { Audiobook } from '../types/audiobook';

export const FALLBACK_CATALOG: Audiobook[] = [
  {
    id: 'pride_and_prejudice_librivox',
    archiveId: 'pride_and_prejudice_librivox',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    narrator: 'Karen Savage',
    edition: 'LibriVox Unabridged Edition',
    year: 1813,
    genre: 'Classics',
    featured: true,
    coverUrl: '/src/assets/images/cover_pride_prejudice_1795345687934.jpg',
    coverAccent: '#8B6F3E',
    totalDurationSeconds: 41700,
    source: 'curated',
    synopsis:
      'Set in rural Georgian England, Jane Austen’s sharpest comedy of manners follows Elizabeth Bennet as she navigates family expectations, societal pride, and her evolving regard for the reserved Mr. Darcy.',
    chapters: [
      {
        id: 'pp-1',
        index: 0,
        title: 'Chapters 1–3: Arrival at Netherfield',
        durationSeconds: 1132,
        audioUrl:
          'https://archive.org/download/pride_and_prejudice_librivox/prideandprejudice_01-03_austen_64kb.mp3',
      },
      {
        id: 'pp-2',
        index: 1,
        title: 'Chapters 4–5: Reflections on the Ball',
        durationSeconds: 865,
        audioUrl:
          'https://archive.org/download/pride_and_prejudice_librivox/prideandprejudice_04-05_austen_64kb.mp3',
      },
      {
        id: 'pp-3',
        index: 2,
        title: 'Chapter 6: Evening at Lucas Lodge',
        durationSeconds: 777,
        audioUrl:
          'https://archive.org/download/pride_and_prejudice_librivox/prideandprejudice_06_austen_64kb.mp3',
      },
      {
        id: 'pp-4',
        index: 3,
        title: 'Chapter 7: A Walk to Netherfield',
        durationSeconds: 790,
        audioUrl:
          'https://archive.org/download/pride_and_prejudice_librivox/prideandprejudice_07_austen_64kb.mp3',
      },
    ],
  },
  {
    id: 'frankenstein_shelley',
    archiveId: 'frankenstein_shelley',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    narrator: 'Cori Samuel',
    edition: '1818 Public Domain Edition',
    year: 1818,
    genre: 'Mystery & Gothic',
    coverUrl: '/src/assets/images/cover_frankenstein_1795345688170.jpg',
    coverAccent: '#4A627D',
    totalDurationSeconds: 29820,
    source: 'curated',
    synopsis:
      'Driven by grief and scientific obsession, Victor Frankenstein animates a living creature from stitched remains—only to flee in horror, setting off a tragic pursuit from Geneva to the Arctic ice.',
    chapters: [
      {
        id: 'fk-0',
        index: 0,
        title: 'Letters I–IV: Captain Walton’s Expedition',
        durationSeconds: 2193,
        audioUrl:
          'https://archive.org/download/frankenstein_shelley/frankenstein_00_shelley_64kb.mp3',
      },
      {
        id: 'fk-1',
        index: 1,
        title: 'Chapter 1: Childhood in Geneva',
        durationSeconds: 630,
        audioUrl:
          'https://archive.org/download/frankenstein_shelley/frankenstein_01_shelley_64kb.mp3',
      },
      {
        id: 'fk-2',
        index: 2,
        title: 'Chapter 2: Sparks of Natural Philosophy',
        durationSeconds: 1028,
        audioUrl:
          'https://archive.org/download/frankenstein_shelley/frankenstein_02_shelley_64kb.mp3',
      },
      {
        id: 'fk-3',
        index: 3,
        title: 'Chapter 3: Studies at Ingolstadt',
        durationSeconds: 980,
        audioUrl:
          'https://archive.org/download/frankenstein_shelley/frankenstein_03_shelley_64kb.mp3',
      },
    ],
  },
  {
    id: 'the-great-gatsby-full-audiobook',
    archiveId: 'the-great-gatsby-full-audiobook',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    narrator: 'Public Domain Studio Recording',
    edition: '1925 Complete Unabridged Text',
    year: 1925,
    genre: 'Classics',
    coverUrl: '/src/assets/images/cover_great_gatsby_1795345687976.jpg',
    coverAccent: '#2F8F6B',
    totalDurationSeconds: 17901,
    source: 'curated',
    synopsis:
      'In the glittering summer of 1922 on Long Island Sound, Nick Carraway becomes entangled in the lavish parties and tragic longing of his mysterious neighbor, Jay Gatsby.',
    chapters: [
      {
        id: 'gg-1',
        index: 0,
        title: 'Complete Unabridged Reading',
        durationSeconds: 17901,
        audioUrl:
          'https://archive.org/download/the-great-gatsby-full-audiobook/The%20Great%20Gatsby%20Full%20Audiobook.mp3',
      },
    ],
  },
  {
    id: 'adventures_sherlock_holmes_rg_librivox',
    archiveId: 'adventures_sherlock_holmes_rg_librivox',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    narrator: 'Ruth Golding',
    edition: 'LibriVox Solo Recording',
    year: 1892,
    genre: 'Mystery & Gothic',
    coverUrl: '/src/assets/images/cover_sherlock_holmes_1795345687772.jpg',
    coverAccent: '#C58A3A',
    totalDurationSeconds: 38400,
    source: 'curated',
    synopsis:
      'Twelve classic cases chronicled by Dr. John Watson—from the scandal in Bohemia to the Red-Headed League—revealing Sherlock Holmes at the height of his deductive powers in Victorian London.',
    chapters: [
      {
        id: 'sh-1',
        index: 0,
        title: 'Adventure I: A Scandal in Bohemia',
        durationSeconds: 1670,
        audioUrl:
          'https://archive.org/download/adventures_sherlock_holmes_rg_librivox/adventuresholmes_01_doyle_64kb.mp3',
      },
      {
        id: 'sh-2',
        index: 1,
        title: 'Adventure II: The Red-Headed League',
        durationSeconds: 2350,
        audioUrl:
          'https://archive.org/download/adventures_sherlock_holmes_rg_librivox/adventuresholmes_02_doyle_64kb.mp3',
      },
      {
        id: 'sh-3',
        index: 2,
        title: 'Adventure III: A Case of Identity',
        durationSeconds: 2182,
        audioUrl:
          'https://archive.org/download/adventures_sherlock_holmes_rg_librivox/adventuresholmes_03_doyle_64kb.mp3',
      },
    ],
  },
  {
    id: 'meditations_0708_librivox',
    archiveId: 'meditations_0708_librivox',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    narrator: 'J. M. Smallheer',
    edition: 'George Long Translation',
    year: 180,
    genre: 'Philosophy',
    coverUrl: '/src/assets/images/cover_meditations_1795345687669.jpg',
    coverAccent: '#9A886D',
    totalDurationSeconds: 18240,
    source: 'curated',
    synopsis:
      'Private Stoic reflections written on campaign by the Roman Emperor Marcus Aurelius—a timeless guide to equanimity, duty, clarity of mind, and living in harmony with nature.',
    chapters: [
      {
        id: 'med-0',
        index: 0,
        title: 'Introduction & Historical Context',
        durationSeconds: 167,
        audioUrl:
          'https://archive.org/download/meditations_0708_librivox/meditations_00_marcusaurelius_64kb.mp3',
      },
      {
        id: 'med-1',
        index: 1,
        title: 'Book One: Debts & Lessons',
        durationSeconds: 985,
        audioUrl:
          'https://archive.org/download/meditations_0708_librivox/meditations_01_marcusaurelius_64kb.mp3',
      },
      {
        id: 'med-2',
        index: 2,
        title: 'Book Two: Written Among the Quadi',
        durationSeconds: 829,
        audioUrl:
          'https://archive.org/download/meditations_0708_librivox/meditations_02_marcusaurelius_64kb.mp3',
      },
      {
        id: 'med-3',
        index: 3,
        title: 'Book Three: Written in Carnuntum',
        durationSeconds: 1060,
        audioUrl:
          'https://archive.org/download/meditations_0708_librivox/meditations_03_marcusaurelius_64kb.mp3',
      },
    ],
  },
  {
    id: 'time_machine_ms_librivox',
    archiveId: 'time_machine_ms_librivox',
    title: 'The Time Machine',
    author: 'H. G. Wells',
    narrator: 'Mark Smith',
    edition: 'LibriVox Version 2',
    year: 1895,
    genre: 'Sci-Fi & Fantasy',
    coverUrl: '/src/assets/images/cover_time_machine_1795345688511.jpg',
    coverAccent: '#B57B45',
    totalDurationSeconds: 10440,
    source: 'curated',
    synopsis:
      'A Victorian inventor travels 800,000 years into the future and discovers humanity split into two eerie descendants—the sunlit Eloi and the subterranean Morlocks.',
    chapters: [
      {
        id: 'tm-1',
        index: 0,
        title: 'Chapter 1: Introduction & The Fourth Dimension',
        durationSeconds: 1302,
        audioUrl:
          'https://archive.org/download/time_machine_ms_librivox/timemachine_01_wells_64kb.mp3',
      },
      {
        id: 'tm-2',
        index: 1,
        title: 'Chapter 2: The Machine Takes Flight',
        durationSeconds: 828,
        audioUrl:
          'https://archive.org/download/time_machine_ms_librivox/timemachine_02_wells_64kb.mp3',
      },
      {
        id: 'tm-3',
        index: 2,
        title: 'Chapter 3: The Time Traveller Returns',
        durationSeconds: 852,
        audioUrl:
          'https://archive.org/download/time_machine_ms_librivox/timemachine_03_wells_64kb.mp3',
      },
      {
        id: 'tm-4',
        index: 3,
        title: 'Chapter 4: Time Travelling into 802,701 AD',
        durationSeconds: 1582,
        audioUrl:
          'https://archive.org/download/time_machine_ms_librivox/timemachine_04_wells_64kb.mp3',
      },
    ],
  },
  {
    id: 'dracula_librivox',
    archiveId: 'dracula_librivox',
    title: 'Dracula',
    author: 'Bram Stoker',
    narrator: 'LibriVox Full Cast',
    edition: '1897 Epistolary Edition',
    year: 1897,
    genre: 'Mystery & Gothic',
    coverUrl: '/src/assets/images/cover_dracula_1795345687481.jpg',
    coverAccent: '#9E3A36',
    totalDurationSeconds: 56400,
    source: 'curated',
    synopsis:
      'Told through journals, letters, and ship logs, Jonathan Harker’s routine real-estate visit to a remote Transylvanian castle unleashes an ancient terror upon Victorian London.',
    chapters: [
      {
        id: 'dr-1',
        index: 0,
        title: 'Chapter 1: Jonathan Harker’s Journal',
        durationSeconds: 2218,
        audioUrl: 'https://archive.org/download/dracula_librivox/dracula_01_stoker_64kb.mp3',
      },
      {
        id: 'dr-2',
        index: 1,
        title: 'Chapter 2: Castle Dracula',
        durationSeconds: 1796,
        audioUrl: 'https://archive.org/download/dracula_librivox/dracula_02_stoker_64kb.mp3',
      },
      {
        id: 'dr-3',
        index: 2,
        title: 'Chapter 3: Warnings in the Night',
        durationSeconds: 2825,
        audioUrl: 'https://archive.org/download/dracula_librivox/dracula_03_stoker_64kb.mp3',
      },
    ],
  },
  {
    id: 'aliceinwonderland_2106_librivox',
    archiveId: 'aliceinwonderland_2106_librivox',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    narrator: 'LibriVox Studio',
    edition: '1865 Unabridged Classic',
    year: 1865,
    genre: 'Sci-Fi & Fantasy',
    coverUrl: '/src/assets/images/cover_alice_wonderland_1795345688256.jpg',
    coverAccent: '#4B8278',
    totalDurationSeconds: 9900,
    source: 'curated',
    synopsis:
      'Following a waistcoat-clad White Rabbit down a burrow plunges Alice into a topsy-turvy dreamscape of riddles, mad tea parties, and the unpredictable Queen of Hearts.',
    chapters: [
      {
        id: 'aw-1',
        index: 0,
        title: 'Chapter 1: Down the Rabbit-Hole',
        durationSeconds: 1046,
        audioUrl:
          'https://archive.org/download/aliceinwonderland_2106_librivox/alicesadventuresinwonderland_01_carroll_64kb.mp3',
      },
      {
        id: 'aw-2',
        index: 1,
        title: 'Chapter 2: The Pool of Tears',
        durationSeconds: 962,
        audioUrl:
          'https://archive.org/download/aliceinwonderland_2106_librivox/alicesadventuresinwonderland_02_carroll_64kb.mp3',
      },
      {
        id: 'aw-3',
        index: 2,
        title: 'Chapter 3: A Caucus-Race and a Long Tale',
        durationSeconds: 815,
        audioUrl:
          'https://archive.org/download/aliceinwonderland_2106_librivox/alicesadventuresinwonderland_03_carroll_64kb.mp3',
      },
    ],
  },
  {
    id: 'the-yellow-wallpaper_202407',
    archiveId: 'the-yellow-wallpaper_202407',
    title: 'The Yellow Wallpaper',
    author: 'Charlotte Perkins Gilman',
    narrator: 'Public Domain Reader',
    edition: '1892 Short Fiction Edition',
    year: 1892,
    genre: 'Mystery & Gothic',
    coverUrl: '',
    coverAccent: '#C99B3B',
    totalDurationSeconds: 1932,
    source: 'curated',
    synopsis:
      'Confined to an upstairs nursery for a supposed nervous condition, a young writer becomes consumed by the shifting patterns behind the room’s faded yellow wallpaper.',
    chapters: [
      {
        id: 'yw-1',
        index: 0,
        title: 'Complete Short Story Reading',
        durationSeconds: 1932,
        audioUrl:
          'https://archive.org/download/the-yellow-wallpaper_202407/The%20Yellow%20Wallpaper.mp3',
      },
    ],
  },
  {
    id: 'art_of_war_librivox',
    archiveId: 'art_of_war_librivox',
    title: 'The Art of War',
    author: 'Sun Tzu',
    narrator: 'Moira Fogarty',
    edition: 'Lionel Giles Translation',
    year: -500,
    genre: 'Philosophy',
    coverUrl: '',
    coverAccent: '#A64B3B',
    totalDurationSeconds: 4560,
    source: 'curated',
    synopsis:
      'Ancient Chinese treatise on strategy, adaptability, and winning without conflict—essential listening on leadership, preparation, and reading the terrain.',
    chapters: [
      {
        id: 'aow-1',
        index: 0,
        title: 'Chapters 1–2: Laying Plans & Waging War',
        durationSeconds: 506,
        audioUrl:
          'https://archive.org/download/art_of_war_librivox/art_of_war_01-02_sun_tzu_64kb.mp3',
      },
      {
        id: 'aow-2',
        index: 1,
        title: 'Chapters 3–4: Attack by Stratagem & Tactical Dispositions',
        durationSeconds: 465,
        audioUrl:
          'https://archive.org/download/art_of_war_librivox/art_of_war_03-04_sun_tzu_64kb.mp3',
      },
      {
        id: 'aow-3',
        index: 2,
        title: 'Chapters 5–6: Energy & Weak Points and Strong',
        durationSeconds: 636,
        audioUrl:
          'https://archive.org/download/art_of_war_librivox/art_of_war_05-06_sun_tzu_64kb.mp3',
      },
    ],
  },
];
