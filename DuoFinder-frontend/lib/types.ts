// lib/types.ts

// =========================
// Imágenes de usuario
// =========================

export interface UserImage {
  id?: number;              // ID en la tabla de imágenes del backend (opcional)
  url: string;              // URL absoluta o relativa de la imagen
  is_primary: boolean;      // true si es la imagen principal
}

// =========================
// Juegos del usuario
// =========================

export interface UserGame {
  game_id: number;
  game_name?: string;
  skill_level: string;          // Texto libre si no es ranked (ej: "Casual", "Gold", etc.)
  is_ranked: boolean;
  game_rank_local_id?: number;  // ID del rango local (si es ranked)
  rank_name?: string;           // Nombre del rango (si es ranked)
}

// =========================
// Perfil de usuario
// =========================

export interface UserProfile {
  id: number;
  username: string;
  email: string;

  bio?: string | null;
  discord?: string | null;
  server?: string | null;
  tracker?: string | null;
  age?: number | null;

  // Imágenes asociadas al usuario (lo que arma el backend con images_payload)
  images?: UserImage[];

  // Juegos/rangos del usuario
  games?: UserGame[];

  // Campos extra por si el backend ya los envía
  created_at?: string;
  updated_at?: string;
}

// =========================
// Update profile
// =========================

export interface UpdateProfileGame {
  game_id: number;
  skill_level: string;
  is_ranked: boolean;
  game_rank_local_id?: number;
}

export interface UpdateProfileImage {
  id?: number;          // opcional, por si querés referenciar una existente
  url: string;          // URL de la imagen
  is_primary: boolean;  // principal o no
}

export interface UpdateProfileRequest {
  username: string;
  bio?: string;
  discord?: string;
  server?: string;
  tracker?: string;
  games?: UpdateProfileGame[];
  // Nuevo: envío de imágenes al backend (si tus compañeros lo manejan)
  images?: UpdateProfileImage[];
}

export interface UpdateProfileResponse {
  message?: string;
  profile?: UserProfile;
}

// =========================
// Matching / Discover
// =========================

export interface Suggestion {
  id: number;
  username: string;

  age?: number | null;
  bio?: string | null;
  location?: string | null;

  // Imagen principal o lista de imágenes
  avatar_url?: string | null;  // por si el backend ya arma una URL directa
  images?: UserImage[];        // por si trae el mismo esquema que en UserProfile

  games?: UserGame[];

  // Otros campos que puedas tener en el backend
  server?: string | null;
  discord?: string | null;
  tracker?: string | null;
}

// Lo que envía el frontend al hacer swipe
export interface SwipeInput {
  target_user_id: number;
  is_like: boolean;
  is_ranked?: boolean;
}

// Respuesta del backend al hacer swipe
export interface SwipeResponse {
  match_created: boolean;
  match_id?: number;
  message?: string;
}

// =========================
// Matches y chats simples (API genérica)
// =========================

export interface MatchUserSummary {
  id: number;
  name: string;
  username?: string;
  age?: number;
  bio?: string | null;
  avatar?: string | null;       // URL de avatar simplificada
  location?: string | null;
  online_status?: boolean;
  last_online?: string | null;
  skill_level?: string | null;

  images?: UserImage[];         // por si se quiere mostrar imágenes en “match cards”
}

export interface Match {
  id: number;                   // o match_id según backend
  user1_id?: number;
  user2_id?: number;
  is_ranked?: boolean;
  status?: string;
  created_at?: string;

  // Resumen del “otro usuario”
  other_user_id?: number;
  other_user_name?: string;
  other_user_avatar?: string | null;

  other_user?: MatchUserSummary;
}

// Chat simple (para endpoints genéricos /chats si los usás)
export interface Chat {
  id: number;
  match_id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;

  last_message?: string | null;
  unread_count?: number;
}

// Mensaje genérico (para apiService.sendMessage)
export interface Message {
  id: number;
  match_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read: boolean;
}

// =========================
// Preferencias de usuario
// =========================

export interface UserPreferences {
  min_age?: number;
  max_age?: number;
  region?: string;
  languages?: string[];

  // filtros por juego, rank, etc.
  game_ids?: number[];
  ranked_only?: boolean;

  // cualquier otro filtro configurable
  [key: string]: any;
}

// =========================
// FrontendChat (usado sólo en apiService.chatService.combineMatchAndChatInfo)
// Ojo: este NO es el mismo que importás desde ./messages/message.types
// =========================

export interface FrontendChat {
  id: string;                           // ej: "match-123"
  matchId: number;
  userId: number;
  matchedOn: string;

  lastMessage?: {
    id: number;
    match_id: number;
    sender_id: number;
    content: string;
    created_at: string;
    read: boolean;
    isCurrentUser: boolean;
  };

  unreadCount: number;

  user: {
    id: number;
    name: string;
    username?: string;
    age?: number;
    bio?: string;
    avatar?: string;
    lastOnline?: string;
    location?: string;
  };

  currentUserId: number;
}
