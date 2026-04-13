export interface User {
  id: number
  email: string
  displayName: string
  role: string
  avatarColor: string
  title?: string
  phone?: string
  timezone?: string
  presence: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'
  customStatusMessage?: string
  createdAt: string
}

export interface Channel {
  id: number
  name: string
  description?: string
  isPrivate: boolean
  createdById?: number
  createdByName?: string
  createdAt: string
  memberCount: number
  memberIds: number[]
}

export interface Reaction {
  emoji: string
  count: number
  userIds: number[]
}

export interface Message {
  id: number
  channelId: number
  senderId: number
  senderName: string
  senderAvatarColor: string
  content: string
  edited: boolean
  deleted: boolean
  createdAt: string
  updatedAt: string
  reactions: Reaction[]
  replyCount: number
}

export interface ThreadReply {
  id: number
  parentMessageId: number
  senderId: number
  senderName: string
  senderAvatarColor: string
  content: string
  edited: boolean
  deleted: boolean
  createdAt: string
  reactions: Reaction[]
}

export interface DmConversation {
  id: number
  isGroup: boolean
  name?: string
  createdAt: string
  participants: User[]
}

export interface DirectMessage {
  id: number
  conversationId: number
  senderId: number
  senderName: string
  senderAvatarColor: string
  content: string
  edited: boolean
  deleted: boolean
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

export interface WsEvent {
  type: string
  payload: Record<string, unknown>
}
