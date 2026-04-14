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
import { addMessage as addDmMessage, addConversation } from '../store/dmSlice'
import { addUser, updateUserPresence } from '../store/usersSlice'
import { updatePresence } from '../store/authSlice'
import { addNotification, setTyping } from '../store/uiSlice'
import toast from 'react-hot-toast'

let client: Client | null = null
const subscriptions: StompSubscription[] = []
const subscribedChannels = new Set<number>()

export function connectSocket(token: string, subscribedChannelIds: number[]) {
  if (client?.active) return

  client = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,
    onConnect: () => {
      console.log('[WS] Connected')

      // Clear any stale subscriptions from a previous connect/reconnect
      subscriptions.forEach(s => s.unsubscribe())
      subscriptions.length = 0
      subscribedChannels.clear()

      // Mark user as ONLINE as soon as socket connects
      const { user } = store.getState().auth
      if (user) {
        import('../api/userApi').then(({ userApi }) => {
          userApi.updateStatus('ONLINE', user.customStatusMessage || '').then(() => {
            store.dispatch(updatePresence({ userId: user.id, presence: 'ONLINE', customMessage: user.customStatusMessage || '' }))
            store.dispatch(updateUserPresence({ userId: user.id, presence: 'ONLINE', customMessage: user.customStatusMessage || '' }))
          }).catch(() => {})
        })
      }

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

      const usersSub = client!.subscribe('/topic/workspace/users', (msg) => {
        const event = JSON.parse(msg.body)
        if (event.type === 'USER_NEW') {
          store.dispatch(addUser(event.payload))
        }
      })

      // User-specific queues
      const dmSub = client!.subscribe('/user/queue/dm', (msg) => {
        const event = JSON.parse(msg.body)
        if (event.type === 'DM_NEW') {
          const { message, conversation } = event.payload
          // Add conversation to sidebar if not already known
          const known = store.getState().dm.conversations.find((c: { id: number }) => c.id === conversation.id)
          if (!known) {
            store.dispatch(addConversation(conversation))
          }
          store.dispatch(addDmMessage(message))
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

      subscriptions.push(presenceSub, channelsSub, usersSub, dmSub, notifSub)
    },
    onDisconnect: () => console.log('[WS] Disconnected'),
    onStompError: (frame) => console.error('[WS] STOMP error', frame),
  })

  client.activate()
}

export function subscribeToChannel(channelId: number) {
  if (!client?.active) return
  if (subscribedChannels.has(channelId)) return
  subscribedChannels.add(channelId)

  const msgSub = client.subscribe(`/topic/channel/${channelId}`, (msg) => {
    const event = JSON.parse(msg.body)
    const p = event.payload
    switch (event.type) {
      case 'MESSAGE_NEW': {
        const me = store.getState().auth.user
        const isMention = me
          ? p.content?.toLowerCase().includes(`@${me.displayName.toLowerCase()}`) ||
            p.content?.includes(`@${me.id}`)
          : false
        store.dispatch(addChannelMessage({ ...p, isMention }))
        break
      }
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
  // Best-effort: mark OFFLINE before disconnecting
  const { user } = store.getState().auth
  if (user) {
    import('../api/userApi').then(({ userApi }) => {
      userApi.updateStatus('OFFLINE', user.customStatusMessage || '').catch(() => {})
    })
  }
  subscriptions.forEach(s => s.unsubscribe())
  subscriptions.length = 0
  subscribedChannels.clear()
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
