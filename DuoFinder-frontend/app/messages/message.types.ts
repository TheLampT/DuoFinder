// app/messages/messages.types.ts

// Tipos específicos para la página de mensajes
export interface MessagesUserProfile {
  id: number;
  name: string;
  username?: string;
  age?: number;
  bio?: string;
  avatar: string;
  gamePreferences?: string[];
  onlineStatus?: boolean;
  lastOnline?: string;
  location?: string;
  skillLevel?: string;
  favoriteGames?: string[];
}

export interface FrontendMessage {
  id: number;
  match_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read: boolean;
  isCurrentUser?: boolean; 
}

export interface FrontendChat {
  id: string;
  matchId: number;
  userId: number;
  matchedOn: string;
  lastMessage?: FrontendMessage;
  unreadCount: number;
  user: MessagesUserProfile;
  isCommunity?: boolean;
  communityId?: number;
}

// Tipos para la API de chat
export interface ApiChatListItem {
  match_id: number;
  other_user: {
    id: number;
    name: string;
    username?: string;
    avatar?: string;
    age?: number;
    bio?: string;
    onlineStatus?: boolean;
    location?: string;
    skillLevel?: string;
    gamePreferences?: string[];
    favoriteGames?: string[];
  };
  last_message?: {
    id: number;
    match_id: number;
    sender_id: number;
    content: string;
    created_at: string;
    read: boolean;
  };
  unread_count: number;
}

// Tipos para localStorage
export interface JoinedCommunity {
  id: number;
  name: string;
  gameName: string;
}

export interface CommunityMessages {
  [key: string]: FrontendMessage[];
}

export interface ApiChatResponse {
  match_id: number;
  other_user: {
    id: number;
    name: string;
    username?: string;
    avatar?: string;
    age?: number;
    bio?: string;
    location?: string;
    skillLevel?: string;
    // Solo incluye los campos que realmente devuelve la API
  };
  last_message?: {
    id: number;
    match_id: number;
    sender_id: number;
    content: string;
    created_at: string;
    read: boolean;
  };
  unread_count: number;
}

export interface ApiMessageResponse {
  id: number;
  match_id?: number;
  MatchesID?: number;
  sender_id?: number;
  SenderID?: number;
  content?: string;
  ContentChat?: string;
  created_at?: string;
  CreatedDate?: string;
  read?: boolean;
  ReadChat?: boolean;
}

export interface ApiMatchResponse {
  id: number;
  match_id: number;
  user_id: number;
  other_user_id: number;
  other_user_name?: string;
  other_user_avatar?: string;
  created_at: string;
  status: string;
  other_user?: {
    id: number;
    name: string;
    username?: string;
    avatar?: string;
    age?: number;
    bio?: string;
    location?: string;
    skill_level?: string;
    online_status?: boolean;
    last_online?: string;
  };
}

export interface ChatInfoResponse {
  partner_id: number;
  partner_username: string;
  last_message?: string;
  unread_count: number;
}

export interface ChatMessagesResponse {
  partner_id: number;
  partner_username: string;
  messages: FrontendMessage[];
}

export interface SendMessageResponse {
  message: FrontendMessage;
  partner_id: number;
}