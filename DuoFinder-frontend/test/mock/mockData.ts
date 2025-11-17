export interface GameSkill {
  game: string;
  skill: string;
  isRanked: boolean;
}

export interface Profile {
  id: string;
  username: string;
  age: number;
  bio: string;
  image: string;
  discord: string;
  gameSkill: GameSkill[];
}

export const profiles: Profile[] = [
  {
    id: '1',
    username: 'Aereng',
    age: 28,
    bio: 'Hacer amigos y jugar rankeds de jueguitos.',
    image: '/profiles/1.jpg',
    discord: 'Aereng#1234',
    gameSkill: [
      {game: 'LoL', skill: 'Challenger', isRanked: true}, 
      {game: 'CS 2', skill: 'Global Elite', isRanked: true},  
      {game: 'TFT', skill: 'Challenger', isRanked: true}
    ]
  },
  {
    id: '2',
    username: 'AlexMorgan',
    age: 28,
    bio: 'Photographer & Traveler',
    image: 'https://picsum.photos/400/600?random=2',
    discord: 'AlexM#5678',
    gameSkill: [
      {game: 'Apex Legends', skill: 'Diamond', isRanked: true},
      {game: 'Valorant', skill: 'Platinum', isRanked: true}
    ]
  },
  {
    id: '3',
    username: 'TaylorKim',
    age: 25,
    bio: 'Food blogger and chef',
    image: 'https://picsum.photos/400/600?random=3',
    discord: 'TaylorK#9012',
    gameSkill: [
      {game: 'Overwatch 2', skill: 'Master', isRanked: true},
      {game: 'Minecraft', skill: 'Expert Builder', isRanked: false}
    ]
  },
  {
    id: '4',
    username: 'JordanWilliams',
    age: 30,
    bio: 'Software engineer and gamer',
    image: 'https://picsum.photos/400/600?random=4',
    discord: 'JordanW#3456',
    gameSkill: [
      {game: 'LoL', skill: 'Grandmaster', isRanked: true},
      {game: 'CS 2', skill: 'Supreme', isRanked: true},
      {game: 'Dota 2', skill: 'Ancient', isRanked: true}
    ]
  },
  {
    id: '5',
    username: 'EmmaRodriguez',
    age: 26,
    bio: 'Yoga instructor and wellness coach',
    image: 'https://picsum.photos/400/600?random=5',
    discord: 'EmmaR#7890',
    gameSkill: [
      {game: 'Animal Crossing', skill: '5-star island', isRanked: false},
      {game: 'Stardew Valley', skill: 'Perfection', isRanked: false}
    ]
  },
  {
    id: '6',
    username: 'ChrisJohnson',
    age: 32,
    bio: 'Musician and music producer',
    image: 'https://picsum.photos/400/600?random=6',
    discord: 'ChrisJ#1235',
    gameSkill: [
      {game: 'Rock Band', skill: 'Expert', isRanked: false},
      {game: 'OSU!', skill: '6-star', isRanked: true}
    ]
  },
  {
    id: '7',
    username: 'SophiaLee',
    age: 29,
    bio: 'Digital artist and illustrator',
    image: 'https://picsum.photos/400/600?random=7',
    discord: 'SophiaL#6789',
    gameSkill: [
      {game: 'Genshin Impact', skill: 'AR 60', isRanked: false},
      {game: 'Honkai Star Rail', skill: 'TB 70', isRanked: false}
    ]
  },
  {
    id: '8',
    username: 'MarcusChen',
    age: 31,
    bio: 'Architect and urban planner',
    image: 'https://picsum.photos/400/600?random=8',
    discord: 'MarcusC#2345',
    gameSkill: [
      {game: 'Cities: Skylines', skill: 'Expert', isRanked: false},
      {game: 'Civilization VI', skill: 'Deity', isRanked: true}
    ]
  },
  {
    id: '9',
    username: 'OliviaMartinez',
    age: 27,
    bio: 'Environmental scientist and activist',
    image: 'https://picsum.photos/400/600?random=9',
    discord: 'OliviaM#8901',
    gameSkill: [
      {game: 'Eco', skill: 'Sustainability Expert', isRanked: false},
      {game: 'Terraria', skill: 'Master Mode', isRanked: true}
    ]
  },
  {
    id: '10',
    username: 'DanielBrown',
    age: 33,
    bio: 'Chef and restaurant owner',
    image: 'https://picsum.photos/400/600?random=10',
    discord: 'DanielB#4567',
    gameSkill: [
      {game: 'Overcooked 2', skill: '4-star', isRanked: false},
      {game: 'Cooking Simulator', skill: 'Master Chef', isRanked: false}
    ]
  }
];