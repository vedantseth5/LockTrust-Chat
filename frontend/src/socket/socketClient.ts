import { Client, StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { store } from '../store'
import {
  addMessage as addChannelMessage,
  updateMessage as updateChannelMessage,
  deleteMessage as deleteChannelMessage,
  updateReaction,
  incrementReplyCount,
  addChannel,
  updateMemberJoined,
  updateMemberLeft,
} from '../store/channelSlice'
import { addMessage as addDmMessage } from '../store/dmSlice'
import { updateUserPresence } from '../store/usersSlice'
import { updatePresence } from '../store/authSlice'
import { addNotification, setTyping } from '../store/uiSlice'
import toast from 'react-hot-toast'

let client: Client | null = null
const subscriptions: StompSubscription[] = []

export function connectSocket(token: string, subscribedChannelIds: number[]) {
  if (client?.active) return

  client = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,
    onConnect: () => {
      console.log('[WS] Connected')

      // Subscribe to each channel
      subscribedChannelIds.forEach(id => subscribeToChannel(id))

      // Workspace-level topics
      const presenceSub = client!.subscribe('/topic/workspace/presence', (msg) => {
        const event = JSON.parse(msg.body)
        if (event.type === 'PRESENCE_UPDATE') {
          const p = event.payload
          store.dispatch(updateUserPresence({ userId: p.userId, presence: p.presence, customMessage: p.customMessage }))
          const me = store.getState().auth.user
          if (me?.id === p.userId) {
            store.dispatch(updatePresence({ userId: p.userId, presence: p.presence, customMessage: p.customMessage }))
          }
        }
      })

      const channelsSub = client!.subscribe('/topic/workspace/channels', (msg) => {
        const event = JSON.parse(msg.body)
        if (event.type === 'CHANNEL_CREATED') {
          store.dispatch(addChannel(event.payload))
        }
      })

      // User-specific queues
      const dmSub = client!.subscribe('/user/queue/dm', (msg) => {
        const event = JSON.parse(msg.body)
        if (event.type === 'DM_NEW') {
          store.dispatch(addDmMessage(event.payload))
        }
      })

      const notifSub = client!.subscribe('/user/queue/notifications', (msg) => {
        const event = JSON.parse(msg.body)
        if (event.type === 'NOTIFICATION_MENTION') {
          const p = event.payload
          store.dispatch(addNotification({
            id: `mention-${p.messageId}`,
            type: 'mention',
            message: `${p.mentionedByName} mentioned you in #${p.channelName}`,
            channelId: p.channelId,
            channelName: p.channelName,
          }))
          toast(`@${p.mentionedByName} mentioned you in #${p.channelName}`, { icon: '🔔' })
        }
      })

      subscriptions.push(presenceSub, channelsSub, dmSub, notifSub)
    },
    onDisconnect: () => console.log('[WS] Disconnected'),
    onStompError: (frame) => console.error('[WS] STOMP error', frame),
  })

  client.activate()
}

export function subscribeToChannel(channelId: number) {
  if (!client?.active) return

  const msgSub = client.subscribe(`/topic/channel/${channelId}`, (msg) => {
    const event = JSON.parse(msg.body)
    const p = event.payload
    switch (event.type) {
      case 'MESSAGE_NEW':
        store.dispatch(addChannelMessage(p))
        break
      case 'MESSAGE_EDIT':
        store.dispatch(updateChannelMessage(p))
        break
      case 'MESSAGE_DELETE':
        store.dispatch(deleteChannelMessage({ messageId: p.messageId, channelId: p.channelId }))
        break
      case 'REACTION_ADD':
      case 'REACTION_REMOVE':
        // We need channelId — look up from state
        const chId = findChannelIdForMessage(p.messageId)
        if (chId) store.dispatch(updateReaction({ channelId: chId, messageId: p.messageId, emoji: p.emoji, userId: p.userId, count: p.count, type: event.type }))
        break
      case 'THREAD_REPLY_NEW':
        store.dispatch(incrementReplyCount({ channelId, messageId: p.parentMessageId }))
        break
      case 'MEMBER_JOINED':
        store.dispatch(updateMemberJoined({ channelId: p.channelId, userId: p.userId }))
        break
      case 'MEMBER_LEFT':
        store.dispatch(updateMemberLeft({ channelId: p.channelId, userId: p.userId }))
        break
    }
  })

  const typingSub = client.subscribe(`/topic/channel/${channelId}/typing`, (msg) => {
    const event = JSON.parse(msg.body)
    const p = event.payload
    store.dispatch(setTyping({
      channelId,
      userId: p.userId,
      displayName: p.displayName,
      isTyping: event.type === 'TYPING_START',
    }))
  })

  subscriptions.push(msgSub, typingSub)
}

export function sendTyping(channelId: number, userId: number, displayName: string, isTyping: boolean) {
  if (!client?.active) return
  client.publish({
    destination: `/app/channel/${channelId}/typing`,
    body: JSON.stringify({ channelId, userId, displayName, isTyping }),
  })
}

export function disconnectSocket() {
  subscriptions.forEach(s => s.unsubscribe())
  subscriptions.length = 0
  client?.deactivate()
  client = null
}

function findChannelIdForMessage(messageId: number): number | null {
  const state = store.getState()
  for (const [channelId, messages] of Object.entries(state.channel.messages)) {
    if (messages.find((m: { id: number }) => m.id === messageId)) return Number(channelId)
  }
  return null
}
